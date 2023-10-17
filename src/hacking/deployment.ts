import { NS } from "@ns";
import { Target } from "/hacking/target";
import { Task } from "/hacking/task";
import { Batch } from "/hacking/batch";
import { Job } from "/hacking/job";
import { Metrics } from "/hacking/metrics";
import { getAvailableRam } from "/lib/ram-helper";

export interface Deployment {
  ns: NS;
  target: Target;
  metrics: Metrics;
  job: Job;
  batchId: number;
  ramCost: number;
  end: number;
}

export class Deployment {
  constructor(
    ns: NS,
    metrics: Metrics,
    prep = false,
    script = "",
    threads = 0,
  ) {
    this.ns = ns;
    this.target = metrics.target;
    this.metrics = metrics;
    this.job = this.createJob(ns, metrics, prep, script, threads);

    this.end = this.job.end;
    this.ramCost = this.job.ramCost;
  }

  createJob(
    ns: NS,
    metrics: Metrics,
    prep: boolean,
    script: string,
    threads: number,
  ): Job {
    let job = undefined;
    if (prep) {
      job = new Task(ns, metrics, script, threads);
    } else {
      job = new Batch(ns, metrics);
    }

    return job;
  }

  async start(): Promise<void> {
    if (!this.ramEnough()) {
      this.resize();
    }

    await this.job.deploy();
  }

  ramEnough(): boolean {
    return getAvailableRam(this.ns) > this.job.ramCost;
  }

  resize(): void {
    const availableRam = getAvailableRam(this.ns);
    const reduction = availableRam / this.ramCost;
    this.job.shrink(reduction);
  }
}
