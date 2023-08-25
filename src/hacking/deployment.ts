import { NS, Server } from "@ns";
import { calculateThreadAmount } from "/lib/helper-functions";

export class Deployment {
  host: Server;
  pid: number;
  
  constructor(ns: NS, host: Server, target: string) {
    this.host = host;
    this.pid = 0;
    this.deployScript(ns, target);
  }

  deployScript(ns: NS, target: string): void {
    const script = this.determineHackingScript(ns, target);
    const threadAmount: number = calculateThreadAmount(ns, script, this.host.hostname);

    const newPid = ns.exec(script, this.host.hostname, threadAmount, target);
    this.pid = newPid;
  }

  determineHackingScript(ns: NS, target: string): string {
    const moneyThresh = ns.getServerMaxMoney(target) * 0.75;
    const securityThresh = ns.getServerMinSecurityLevel(target) + 5;

    let hackingScript = "";
    if (ns.getServerSecurityLevel(target) > securityThresh) {
      hackingScript = "hacking/weaken.js";
    } else if (ns.getServerMoneyAvailable(target) < moneyThresh) {
      hackingScript = "hacking/grow.js";
    } else {
      hackingScript = "hacking/hack.js";
    }
    return hackingScript;
  }
}
