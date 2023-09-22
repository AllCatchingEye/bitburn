import { NS, Server } from "@ns";
import { hackingScripts } from "/scripts/Scripts";
import { Target } from "/hacking/target";
import { Task, createTask, calculateTaskTime } from "/hacking/task";
import { getGrowThreads, getMinSecThreads } from "/lib/thread-utils";
import { getUsableHosts } from "/lib/searchServers";
import { disableLogs } from "/lib/helper-functions";
import { Batch, createBatch } from "/hacking/batch";
import { deploy } from "/lib/hacking-helper";

export async function main(ns: NS): Promise<void> {
  const functionNames: string[] = ["getServerMaxRam", "scan"];
  disableLogs(ns, functionNames);

  const controller: Controller = new Controller(ns, 100);
  await controller.start();
}

export class Controller {
  ns: NS;
  target: Target;
  targetIsPrepared: boolean;
  usableServers: Server[];
  taskDelay: number;
  stealPercent: number;

  constructor(ns: NS, spacer: number) {
    this.ns = ns;
    this.target = new Target(this.ns);
    this.targetIsPrepared = false;
    this.usableServers = getUsableHosts(this.ns);
    this.taskDelay = spacer;
    this.stealPercent = 0.25;
  }

  async start(): Promise<void> {
    await this.prepareTarget();

    await this.runHackingBatches();
  }

  // Prepares a server for optimal hacking conditions:
  // 1. It has the maximum amount of money available
  // 2. The security is at a minimum
  async prepareTarget(): Promise<void> {
    let prepEnd = 0;
    while (!this.target.isPrepped()) {
      this.usableServers = getUsableHosts(this.ns);

      const task: Task = this.prepareTask();

      await deploy(this.ns, task);

      this.target.update(task);
      this.target.checkForNewTarget();

      const taskTime = calculateTaskTime(this.ns, task);
      prepEnd = Math.max(prepEnd, taskTime);

      await this.ns.sleep(this.taskDelay * 2);
    }

    const sleep = Math.max(
      prepEnd - Date.now() + this.taskDelay,
      this.taskDelay,
    );
    await this.ns.sleep(sleep);
  }

  prepareTask(): Task {
    let script = "";
    let threads = 0;
    if (!this.target.moneyIsPrepped()) {
      // Prepare money on target
      script = hackingScripts.Grow;
      threads = getGrowThreads(this.ns, this.target);
    } else {
      // Prepare security on target
      script = hackingScripts.Weaken;
      threads = getMinSecThreads(this.ns, this.target);
    }

    const task: Task = createTask(this, script, threads);
    return task;
  }

  // Continously deploy batches
  async runHackingBatches(): Promise<void> {
    while (true) {
      const batch: Batch = createBatch(this.ns, this);

      await deploy(this.ns, batch);

      this.target.update(batch);
      //If the target changed, it needs to be prepared before use
      if (this.target.checkForNewTarget()) {
        await this.prepareTarget();
        break;
      }

      await this.ns.sleep(this.taskDelay * 2);
    }
  }
}
