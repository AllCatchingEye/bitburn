import { NS, Server } from "@ns";
import { hackingScripts } from "/scripts/Scripts";
import { Metrics } from "/hacking/metrics";
import { Task, createTask, calculateTaskTime } from "/hacking/task";
import { getGrowThreads, getMinSecThreads } from "/lib/thread-utils";
import { getUsableHosts } from "/lib/searchServers";
import { disableLogs } from "/lib/helper-functions";
import { Batch, createBatch } from "/hacking/batch";
import { deploy } from "/lib/hacking-helper";

export async function main(ns: NS): Promise<void> {
  const functionNames: string[] = ["getServerMaxRam", "scan"];
  disableLogs(ns, functionNames);

  const loggerPid = ns.args[0] as number;
  const controller: Controller = new Controller(ns, loggerPid, 100, 0.25);
  await controller.start();
}

export class Controller {
  ns: NS;
  metrics: Metrics;
  loggerPid: number;
  usableServers: Server[];

  constructor(ns: NS, loggerPid: number, delay: number, greed: number) {
    this.ns = ns;
    this.loggerPid = loggerPid;
    this.metrics = new Metrics(this.ns, delay, greed, loggerPid);
    this.usableServers = getUsableHosts(this.ns);
  }

  async start(): Promise<void> {
    this.ns.writePort(this.loggerPid, "New controller started...");
    await this.prepareTarget();

    await this.runHackingBatches();
  }

  // Prepares a server for optimal hacking conditions:
  // 1. It has the maximum amount of money available
  // 2. The security is at a minimum
  async prepareTarget(): Promise<void> {
    // Log start of preparation
    this.ns.writePort(
      this.loggerPid,
      `Preparing server ${this.metrics.target.server.hostname} for batching...`,
    );

    let prepEnd = 0;
    while (!this.metrics.target.isPrepped()) {
      this.usableServers = getUsableHosts(this.ns);

      const task: Task = this.prepareTask();

      await deploy(this.ns, task);

      this.metrics.target.update(task);
      this.metrics.checkForNewTarget();

      const taskTime = calculateTaskTime(this.ns, task);
      prepEnd = Math.max(prepEnd, taskTime);

      await this.ns.sleep(this.metrics.taskDelay * 2);
    }

    const sleep = Math.max(
      prepEnd - Date.now() + this.metrics.taskDelay,
      this.metrics.taskDelay,
    );
    await this.ns.sleep(sleep);
  }

  prepareTask(): Task {
    let script = "";
    let threads = 0;
    if (!this.metrics.target.moneyIsPrepped()) {
      // Prepare money on target
      script = hackingScripts.Grow;
      threads = getGrowThreads(this.ns, this.metrics.target);
    } else {
      // Prepare security on target
      script = hackingScripts.Weaken;
      threads = getMinSecThreads(this.ns, this.metrics.target);
    }

    const task: Task = createTask(this, script, threads);
    return task;
  }

  // Continously deploy batches
  async runHackingBatches(): Promise<void> {
    // Log start of deployment
    this.ns.writePort(
      this.loggerPid,
      `Deploying batches for ${this.metrics.target.server.hostname}`,
    );

    while (true) {
      this.usableServers = getUsableHosts(this.ns);

      const batch: Batch = createBatch(this.ns, this);

      await deploy(this.ns, batch);

      this.metrics.target.update(batch);
      //If the target changed, it needs to be prepared before use
      if (this.metrics.checkForNewTarget()) {
        await this.prepareTarget();
        break;
      }

      await this.ns.sleep(this.metrics.taskDelay * 2);
    }
  }
}
