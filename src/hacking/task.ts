import { Server } from "@ns";
import { hackingScripts, getBatchScripts } from "/scripts/Scripts";
import { Job } from "/hacking/job";
import { calculateThreads } from "/lib/thread-utils";
import { Metrics } from "/hacking/metrics";
import { Target } from "/hacking/target";
import { calculateTaskRamUsage } from "/lib/ram-helper";

export interface Task {
  target: Server;

  script: string;
  threads: number;
  ramCost: number;

  time: number;
  end: number;

  batchId: number;
  taskId: number;
  loggerPid: number;
}

export function createTasks(ns: NS, metrics: Metrics, batchId: number): Task[] {
  const scripts: string[] = getBatchScripts();
  const threads: number[] = calculateThreads(ns, metrics);

  const tasks: Task[] = [];
  for (let i = 0; i < scripts.length; i++) {
    const task = createTask(ns, metrics, batchId, scripts[i], threads[i]);
    tasks.push(task);
  }

  return tasks;
}

export function createTask(
  ns: NS,
  metrics: Metrics,
  batchId: number,
  script: string,
  threads: number,
): Task {
  const target: Target = metrics.target;
  const time = calculateTaskTime(ns, target.server.hostname, script);
  const task = {
    target: metrics.target.server,

    script: script,
    threads: threads,
    ramCost: calculateTaskRamUsage(ns, script, threads),

    time: time,
    end: Date.now() - time,

    loggerPid: metrics.loggerPid,
    taskId: metrics.taskId,
    batchId: batchId,
  };

  return task;
}

export function calculateTaskTime(
  ns: NS,
  host: string,
  script: string,
): number {
  const hackTime = ns.getHackTime(host);
  let taskTime = 0;
  switch (script) {
    case hackingScripts.Grow:
      taskTime = hackTime * 3.2;
      break;
    case hackingScripts.Weaken:
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

export function isTask(job: Job | Task): job is Job {
  const script = (job as Task).script;
  const threads = (job as Task).threads;

  return script !== undefined && threads !== undefined;
}
