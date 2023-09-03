import { NS, Server } from "@ns";
import { calculateThreadAmount } from "/lib/helper-functions";
import { mostProfitableServer } from "/lib/profit-functions";

export class Deployment {
  host: Server;
  target: string;
  ns: NS;

  constructor(ns: NS, host: Server) {
    this.ns = ns;
    this.host = host;
    this.target = mostProfitableServer(this.ns);
  }

  async deployScript() {
    while (true) {
      this.target = mostProfitableServer(this.ns);
      await this.start();
    }
  }

  async start() {
    const targetServer = this.ns.getServer(this.host.hostname);
    const availableMohney = targetServer.moneyAvailable!;

    const hackThreads = this.ns.hackAnalyzeThreads(this.host.hostname, availableMohney);
    const hackSecurityThreads = this.calculateSecurityThreads("hacking/hack.js", hackThreads);

    const growThreads = this.calculateGrowThreads(availableMohney, targetServer);
    const growSecurityThreads = this.calculateSecurityThreads("hacking/grow.js", growThreads);

    this.execute("hacking/hack.js", hackThreads);

    await this.ns.sleep(100);
    this.execute("hacking/weaken.js", hackSecurityThreads);

    await this.ns.sleep(100);
    this.execute("hacking/grow.js", growThreads);

    await this.ns.sleep(100);
    await this.execute("hacking/weaken.js", growSecurityThreads);
  }

  calculateGrowThreads(availableMoney: number, target: Server) {
    const targetGrowth = target.moneyMax! / (availableMoney + 1);
    const growThreads = this.ns.growthAnalyze(this.host.hostname, targetGrowth);

    return growThreads;
  }

  calculateSecurityThreads(script: string, threads: number) {
    let securityIncrease = 0;
    if (script == "hacking/hack.js") {
      securityIncrease = this.ns.hackAnalyzeSecurity(threads);
    } else if (script == "hacking/grow.js") {
      securityIncrease = this.ns.growthAnalyzeSecurity(threads);
    } else {
      this.ns.print("ERROR unknown script");
    }

    const securityThreads = securityIncrease / this.ns.weakenAnalyze(1);
    return securityThreads;
  }

  async execute(script: string, threads: number) {
    let threadsLeft = Math.floor(threads);
    while (threadsLeft > 0) {
      const maxPossibleThreads = calculateThreadAmount(this.ns, script, this.host.hostname);
      const runnableThreads = Math.min(threadsLeft, maxPossibleThreads);
      const pid = this.ns.exec(script, this.host.hostname, runnableThreads);
      threadsLeft -= runnableThreads;

      if (threadsLeft > 0) {
        await this.waitTillFinished(pid);
      }
    }
  }

  async waitTillFinished(pid: number) {
    while (this.ns.isRunning(pid)) {
      await this.ns.sleep(1000);
    }
  }
}

