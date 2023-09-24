import { NS, Server } from "@ns";
import { Target } from "./target";
import { Batch, isBatch } from "/hacking/batch";
import { Task } from "/hacking/task";
import { getMostProfitableServer } from "/lib/profit-functions";

export class Metrics {
  /** Provides access to Netscript functions */
  ns: NS;

  target: Target;

  constructor(ns: NS) {
    this.ns = ns;

    const mostProfitableServer = getMostProfitableServer(this.ns);
    this.target = new Target(this.ns, mostProfitableServer);
  }

  // Updates security and money based on task provided
  update(job: Batch | Task): void {
    if (isBatch(job)) {
      job.tasks.forEach((task) => this.update(task));
    } else {
      this.update(job);
    }
  }

  // Check if a more profitable target is available, and changes if so
  checkForNewTarget(): boolean {
    const mostProfitableServer: Server = getMostProfitableServer(this.ns);
    if (this.changed(mostProfitableServer)) {
      this.switchTarget(mostProfitableServer);
      return true;
    }
    return false;
  }

  // Checks if the target changed
  changed(newTarget: Server): boolean {
    const targetChanged = this.target.hostname != newTarget.hostname;
    return targetChanged;
  }

  switchTarget(server: Server): void {
    this.target = new Target(this.ns, server);
  }
}
