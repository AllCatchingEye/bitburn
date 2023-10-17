import { Server } from "@ns";
import { hackingScripts } from "/scripts/Scripts";
import { Metrics } from "/hacking/metrics";
import { getUsableHosts } from "/lib/searchServers";
import { Job } from "/hacking/job";
import { preventFreeze } from "/lib/misc";

export class Task extends Job {
  script: string;
  threads: number;

  time: number;
  end: number;
  ramCost: number;

  constructor(ns: NS, metrics: Metrics, script: string, threads: number) {
    super(ns, metrics, metrics.nextTaskId);

    this.script = script;
    this.threads = threads;
    this.ramCost = this.calculateRamCost();

    this.time = this.calculateTime();
    this.end = Date.now() - this.time;
  }

  isTask(): this is Task {
    return this instanceof Task;
  }

  calculateTime(): number {
    const hackTime = this.ns.getHackTime(this.target.name);
    let taskTime = 0;
    switch (this.script) {
      case hackingScripts.Grow:
        // The time of one grow call is equal to 3.2 hack calls
        taskTime = hackTime * 3.2;
        break;
      case hackingScripts.Weaken:
        // The time of one weaken call is equal to 4 hack calls
        taskTime = hackTime * 4;
        break;
      case hackingScripts.Hacking:
        taskTime = hackTime;
        break;
      default:
        break;
    }

    return taskTime;
  }

  async deploy(): Promise<void> {
    while (this.threads > 0) {
      this.distributeScripts(this);

      await preventFreeze(this.ns);
    }
  }

  /**
   * Deploys a task on a host, with as many threads as the host can execute
   * @param host - Server where task will be executed
   * @param task - Task which will be deployed
   */
  startScript(host: string): void {
    const runnableThreads = Math.max(0, this.calculateRunnableThreads(host));

    if (runnableThreads > 0) {
      this.ns.exec(this.script, host, runnableThreads, JSON.stringify(this));
      this.threads -= runnableThreads;
    }
  }

  calculateRunnableThreads(host: string): number {
    const runnableThreadsOnHost = Math.min(
      this.getMaxRunnableThreads(host),
      this.threads,
    );

    return Math.floor(runnableThreadsOnHost);
  }

  getMaxRunnableThreads(host: string): number {
    const scriptRamCost = this.ns.getScriptRam(this.script);

    const maxRam = this.ns.getServerMaxRam(host);
    const usedRam = this.ns.getServerUsedRam(host);
    const availableRamOnHost = maxRam - usedRam;

    // Thread amount needs to be whole number
    const maxPossibleThreads = Math.floor(availableRamOnHost / scriptRamCost);
    return maxPossibleThreads;
  }

  /**
   * Distribute a task across hosts
   * @param task - Task which will be distributed across hosts
   */
  distributeScripts(task: Task): void {
    const hosts: Server[] = getUsableHosts(this.ns);
    for (const host of hosts) {
      if (this.threads > 0) {
        this.startScript(host.hostname, task);
      } else {
        break;
      }
    }
  }

  updateTarget(): void {
    this.target.update(this);
  }

  shrink(reduction: number): void {
    const newThreadCount = this.threads * reduction;
    if (this.script == hackingScripts.Weaken) {
      // If the script is weaken, ceil to ensure security wont slowly raise
      this.threads = Math.ceil(newThreadCount);
    } else {
      // Hack and grow will be floored
      this.threads = Math.floor(newThreadCount);
    }

    this.ramCost = this.calculateRamCost();
  }

  calculateRamCost(): number {
    return this.ns.getScriptRam(this.script) * this.threads;
  }
}
