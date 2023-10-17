import { NS } from "@ns";
import { hackingScripts } from "/scripts/Scripts";
import { Metrics } from "/hacking/metrics";
import { getGrowThreads, getMinSecThreads } from "/lib/thread-utils";
import { disableNSLogs, preventFreeze } from "/lib/misc";
import { Deployment } from "/hacking/deployment";
import { log } from "/lib/misc";

export async function main(ns: NS): Promise<void> {
  const functionNames: string[] = ["getServerMaxRam", "scan"];
  disableNSLogs(ns, functionNames);

  const loggerPid = ns.args[0] as number;
  const controller: Controller = new Controller(ns, loggerPid, 5, 0.05);
  await controller.start();
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
    await log(this.ns, "New controller started...\n", this.loggerPid);
    await this.startPreparation();
    await this.run();
  }

  /**
   * Will prepare the server by
   * 1. Maximizing money
   * 2. Minimizing security
   */
  async startPreparation(): Promise<void> {
    await log(this.ns, "Preparing target...\n", this.loggerPid);

    await this.prepareMoney();
    await this.prepareSecurity();

    await log(this.ns, "Target has been prepared\n", this.loggerPid);
  }

  /** Maximize available money on a server */
  async prepareMoney(): Promise<void> {
    await log(this.ns, "Preparing money on target...\n", this.loggerPid);

    while (!this.metrics.target.moneyIsPrepped()) {
      const growThreads = getGrowThreads(this.ns, this.metrics.target);
      await this.deployPreparation(hackingScripts.Grow, growThreads);

      await preventFreeze(this.ns);
    }
  }

  /** Minimize security on a server */
  async prepareSecurity(): Promise<void> {
    await log(this.ns, "Preparing security on target...\n", this.loggerPid);

    while (!this.metrics.target.secIsPrepped()) {
      const weakenThreads = getMinSecThreads(this.ns, this.metrics.target);
      await this.deployPreparation(hackingScripts.Weaken, weakenThreads);

      await preventFreeze(this.ns);
    }
  }

  async deployPreparation(script: string, threads: number): Promise<void> {
    const deployment: Deployment = new Deployment(
      this.ns,
      this.metrics,
      true,
      script,
      threads,
    );
    await deployment.start();

    // Wait until deployment finished
    await this.ns.sleep(Date.now() - deployment.end);
  }

  /** Continously creates batches, and deploys them */
  async run(): Promise<void> {
    // Log start of deployment
    await log(
      this.ns,
      `INFO Deploying batches for ${this.metrics.target.server.hostname}\n`,
      this.loggerPid,
    );

    while (true) {
      if (this.metrics.targetChanged()) {
        await this.startPreparation();
      }

      const deployment: Deployment = new Deployment(this.ns, this.metrics);
      await deployment.start();

      // Minimum amount of delay necessary to ensure batches stay in sync
      await this.ns.sleep(this.metrics.taskDelay * 2);
    }
  }
}
