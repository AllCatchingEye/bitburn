import { NS, Server } from "@ns";
import { Target } from "/hacking/target";
import { getMostProfitableServer } from "/lib/profit-functions";

export class Metrics {
  /** Provides access to Netscript functions */
  ns: NS;
  target: Target;
  taskDelay: number;
  greed: number;
  loggerPid: number;

  nextTaskId: number;
  nextBatchId: number;

  constructor(ns: NS, delay: number, greed: number, loggerPid: number) {
    this.ns = ns;

    const mostProfitableServer = getMostProfitableServer(this.ns);
    this.target = new Target(this.ns, mostProfitableServer);

    this.taskDelay = delay;
    this.greed = greed;
    this.loggerPid = loggerPid;

    this.nextTaskId = 0;
    this.nextBatchId = 0;
  }

  get taskId(): number {
    return this.nextTaskId++;
  }

  get batchId(): number {
    return this.nextBatchId++;
  }

  targetChanged(): boolean {
    const mostProfitableServer: Server = getMostProfitableServer(this.ns);

    // Checks if most profitable server is not the same
    const targetChanged =
      this.target.server.hostname != mostProfitableServer.hostname;
    if (targetChanged) {
      // Log target change
      this.ns.writePort(
        this.loggerPid,
        `Target changed from ${this.target.server.hostname} to ${mostProfitableServer.hostname}`,
      );

      this.target = new Target(this.ns, mostProfitableServer);
      return true;
    }

    return false;
  }
}
