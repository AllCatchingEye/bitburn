import { getBatchScripts } from "/scripts/Scripts";
import { calculateThreads } from "/lib/thread-utils";
import { Metrics } from "/hacking/metrics";
import { Job } from "/hacking/job";
import { Task } from "/hacking/task";
import { log } from "/lib/misc";

export class Batch extends Job {
  tasks: Task[];
  ramCost: number;
  end: number;
  loggerPid: number;

  constructor(ns: NS, metrics: Metrics) {
    super(ns, metrics, metrics.nextBatchId);
    this.loggerPid = metrics.loggerPid;
    const scripts: string[] = getBatchScripts();
    const threads: number[] = calculateThreads(ns, metrics);

    this.tasks = [];
    for (let i = 0; i < scripts.length; i++) {
      const task = new Task(ns, metrics, scripts[i], threads[i]);
      this.tasks.push(task);
    }

    this.end = this.tasks[-1].end;
    this.ramCost = this.calculateRamCost();
  }

  isBatch(): this is Batch {
    return this instanceof Batch;
  }

  calculateTime(): number {
    let time = 0;
    this.tasks.forEach((task) => (time += task.time));
    return time;
  }

  async deploy(): Promise<void> {
    for (const task of this.tasks) {
      await task.deploy();

      log(
        this.ns,
        `INFO Task ${task.id} of Batch ${this.id} was deployed.\n`,
        this.loggerPid,
      );
    }
  }

  updateTarget(): void {
    this.tasks.forEach((task) => this.target.update(task));
  }

  shrink(reduction: number): void {
    this.tasks.forEach((task) => task.shrink(reduction));
  }

  calculateRamCost(): number {
    let ramCost = 0;
    this.tasks.forEach((task) => (ramCost += task.ramCost));
    return ramCost;
  }
}
