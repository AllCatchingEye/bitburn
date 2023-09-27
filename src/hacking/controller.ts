import { NS, Server } from "@ns";
//import { hackingScripts } from "/scripts/Scripts";
import { Metrics } from "/hacking/metrics";
//import { Task } from "/hacking/task";
/*import {
  getGrowThreads,
  getMinSecThreads,
  calculateRunnableThreads,
} from "/lib/thread-utils";
*/
//import { disableLogs } from "/lib/helper-functions";
//import { Job, isBatch, createJob } from "/hacking/job";
//import { getUsableHosts } from "/lib/searchServers";
//import { shrinkJob } from "/lib/hacking-helper";
//import { ramEnough } from "/lib/ram-helper";

export async function main(ns: NS): Promise<void> {
  //const functionNames: string[] = ["getServerMaxRam", "scan"];
  //disableLogs(ns, functionNames);
  //const loggerPid = ns.args[0] as number;
  //const controller: Controller = new Controller(ns, loggerPid, 5, 0.05);
  //await controller.start();
}

export class Controller {
  ns: NS;
  metrics: Metrics;
  loggerPid: number;

  constructor(ns: NS, loggerPid: number, delay: number, greed: number) {
    this.ns = ns;
    this.loggerPid = loggerPid;
    this.metrics = new Metrics(this.ns, delay, greed, loggerPid);
  }

  async start(): Promise<void> {
    //this.log("New controller started...\n");
    //await this.startPreparation();
    //await this.run();
  }

  /**
   * Will prepare the server by
   * 1. Maximizing money
   * 2. Minimizing security
   */
  async startPreparation(): Promise<void> {
    this.log("Preparing target...\n");

    await this.prepareMoney();
    await this.prepareSecurity();

    this.log("Target has been prepared\n");
  }

  /** Maximize available money on a server */
  async prepareMoney(): Promise<void> {
    this.log("Preparing money on target...\n");

    while (!this.metrics.target.moneyIsPrepped()) {
      const growThreads = getGrowThreads(this.ns, this.metrics.target);
      await this.deployPreparation(hackingScripts.Grow, growThreads);
    }
  }

  /** Minimize security on a server */
  async prepareSecurity(): Promise<void> {
    this.log("Preparing security on target...\n");

    while (!this.metrics.target.secIsPrepped()) {
      const weakenThreads = getMinSecThreads(this.ns, this.metrics.target);
      await this.deployPreparation(hackingScripts.Weaken, weakenThreads);
    }
  }

  async deployPreparation(script: string, threads: number): Promise<void> {
    const job: Job = createJob(this.ns, this.metrics, true, script, threads);

    await this.deploy(this.ns, job);

    // Wait until job finished
    await this.ns.sleep(Date.now() - job.end);
  }

  /** Continously creates batches, and deploys them */
  async run(): Promise<void> {
    // Log start of deployment
    this.log(
      `INFO Deploying batches for ${this.metrics.target.server.hostname}\n`,
    );

    while (true) {
      if (this.metrics.targetChanged()) {
        await this.startPreparation();
      }

      const job: Job = createJob(this.ns, this.metrics);
      await this.deploy(this.ns, job);

      // Minimum amount of delay necessary to ensure batches stay in sync
      await this.ns.sleep(this.metrics.taskDelay * 2);
    }
  }

  async deploy(ns: NS, job: Job): Promise<void> {
    /*
    if (!ramEnough(ns, job)) {
      shrinkJob(ns, job);
    }
    */

    // A job can be a single task or a whole batch
    /*
    if (isBatch(job.tasks)) {
      for (const task of job.tasks) {
        await this.deployTask(task);
      }
    } else {
      await this.deployTask(job.tasks);
    }
    */

    this.metrics.target.update(job);
  }

  async deployTask(task: Task): Promise<void> {
    while (!this.taskIsDeployed(task)) {
      this.distributeScripts(task);

      await this.ns.sleep(5);
    }

    this.log(
      `INFO Task ${task.taskId} of Batch ${task.batchId} was deployed.\n`,
    );
  }

  /**
   * Distribute a task across hosts
   * @param task - Task which will be distributed across hosts
   */
  distributeScripts(task: Task): void {
    const hosts: Server[] = getUsableHosts(this.ns);
    for (const host of hosts) {
      if (!this.taskIsDeployed(task)) {
        this.startScript(host.hostname, task);
      } else {
        break;
      }
    }
  }

  /**
   * Checks if a task has been deployed, by checking if there are still threads,
   * left in the task
   * @returns If the task has been deployed
   */
  taskIsDeployed(task: Task): boolean {
    return task.threads <= 0;
  }

  /**
   * Deploys a task on a host, with as many threads as the host can execute
   * @param host - Server where task will be executed
   * @param task - Task which will be deployed
   */
  startScript(host: string, task: Task): void {
    const runnableThreads = calculateRunnableThreads(this.ns, task, host);

    if (runnableThreads > 0) {
      this.ns.exec(task.script, host, runnableThreads, JSON.stringify(task));
      task.threads -= runnableThreads;
    }
  }

  log(message: string): void {
    this.ns.writePort(this.loggerPid, message);
  }
}
