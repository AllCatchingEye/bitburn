import { NetscriptPort, NS, Server } from "@ns";
import { Scripts } from "/Scripts";
import { Target } from "/hacking/target";
import { Task, createBatch, createTask } from "/hacking/task";
import {
  batchHasEnoughRam,
  reduceThreadAmount,
  waitTillEnoughRamAvailable,
} from "/lib/ram-helper";
import { getGrowThreads, getMinSecThreads } from "/lib/thread-utils";
import { getUsableHosts } from "/lib/searchServers";
import { getMostProfitableServer } from "/lib/profit-functions";
import { disableLogs } from "/lib/helper-functions";
import { hackingLog, HackLogType } from "/hacking/logger";

export async function main(ns: NS): Promise<void> {
  const functionNames: string[] = ["getServerMaxRam", "scan"];
  disableLogs(ns, functionNames);

  await hackingLog(ns, HackLogType.start);

  const controller: Controller = new Controller(ns, 100);
  await controller.start();
}

export class Controller {
  ns: NS;
  target: Target;
  targetIsPrepared: boolean;
  hosts: Server[];
  portIndex: number;
  ports: NetscriptPort[];
  spacer: number;
  stealPercent: number;

  prepEnd: number;

  constructor(ns: NS, spacer: number) {
    this.ns = ns;
    this.target = new Target(this.ns, getMostProfitableServer(this.ns));
    this.targetIsPrepared = false;
    this.hosts = getUsableHosts(this.ns);
    this.portIndex = 1;
    this.ports = [];
    this.spacer = spacer;
    this.prepEnd = 0;
    this.stealPercent = 0.25;
  }

  async start(): Promise<void> {
    await this.init();

    await this.run();
  }

  // Prepares a server for optimal hacking conditions:
  // 1. It has the maximum amount of money available
  // 2. The security is at a minimum
  async init(): Promise<void> {
    await hackingLog(this.ns, HackLogType.prepare, this.target.server.hostname);

    while (!this.target.isPrepped()) {
      this.target.checkForNewTarget();
      this.hosts = getUsableHosts(this.ns);

      await this.dispatchPrepTask();

      await this.ns.sleep(this.spacer * 2);
    }
    await this.sleepTillPrepEnd();

    await hackingLog(
      this.ns,
      HackLogType.prepared,
      this.target.server.hostname,
    );
  }

  // Prepares a Batch of a single Task,
  // returns the time it takes to work
  async dispatchPrepTask(): Promise<void> {
    const task: Task = this.prepareTask();
    await this.dispatchBatch([task]);

    const taskTime = this.getTaskTime(task.script);
    this.updatePrepEndTime(taskTime);
  }

  async sleepTillPrepEnd(): Promise<void> {
    const sleep = Math.max(
      this.prepEnd - Date.now() + this.spacer,
      this.spacer,
    );
    await this.ns.sleep(sleep);
  }

  prepareTask(): Task {
    if (!this.target.moneyIsPrepped()) {
      // Prepare money on target
      const growThreads = getGrowThreads(this.ns, this.target);
      return createTask(this, Scripts.Grow, growThreads);
    } else {
      // Prepare security on target
      const weakenThreads = getMinSecThreads(this.ns, this.target);
      return createTask(this, Scripts.Weaken, weakenThreads);
    }
  }

  getTaskTime(script: string): number {
    const hostname = this.target.server.hostname;
    let taskTime = 0;
    if (script == Scripts.Grow) {
      taskTime = this.ns.getGrowTime(hostname);
    } else {
      taskTime = this.ns.getWeakenTime(hostname);
    }
    return taskTime;
  }

  updatePrepEndTime(taskTime: number): void {
    this.prepEnd = Math.max(this.prepEnd, taskTime);
  }

  // Continously deploy batches
  async run(): Promise<void> {
    while (true) {
      await hackingLog(this.ns, HackLogType.newDeployment);
      await this.deploy();

      const batchDelay = this.spacer * 2;
      await this.ns.sleep(batchDelay);
    }
  }

  async deploy(): Promise<void> {
    const tasks: Task[] = createBatch(this.ns, this, this.stealPercent);
    await waitTillEnoughRamAvailable(this.ns, tasks);
    await this.dispatchBatch(tasks);
  }

  async sendTask(task: Task): Promise<void> {
    const data: string = JSON.stringify(task);
    const port: NetscriptPort = this.ns.getPortHandle(this.portIndex);
    port.clear();
    await port.write(data);

    await hackingLog(this.ns, HackLogType.sendTask, this.portIndex);

    this.ports.push(port);
    this.portIndex++;
  }

  async dispatchBatch(batch: Task[]): Promise<void> {
    if (!batchHasEnoughRam(this.ns, batch)) {
      reduceThreadAmount(this.ns, batch);
    }

    for (const task of batch) {
      await this.dispatchWorker(task);
    }
  }

  async dispatchWorker(task: Task): Promise<void> {
    if (task.threads <= 0) {
      return;
    }

    this.ns.run("hacking/tWorker.js", 1, this.portIndex);
    await this.sendTask(task);

    await hackingLog(this.ns, HackLogType.dispatch, this.portIndex);
  }
}
