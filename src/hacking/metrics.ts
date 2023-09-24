import { NS, Server } from "@ns";
import { Target } from "./target";
import { getMostProfitableServer } from "/lib/profit-functions";

export class Metrics {
  /** Provides access to Netscript functions */
  ns: NS;
  target: Target;
  taskDelay: number;
  greed: number;

  constructor(ns: NS, delay: number, greed: number) {
    this.ns = ns;

    const mostProfitableServer = getMostProfitableServer(this.ns);
    this.target = new Target(this.ns, mostProfitableServer);

    this.taskDelay = delay;
    this.greed = greed;
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
