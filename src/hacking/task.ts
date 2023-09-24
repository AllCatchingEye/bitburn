import { Server } from "@ns";
import { hackingScripts, getBatchScripts } from "/scripts/Scripts";
import { Batch } from "/hacking/batch";
import { Controller } from "/hacking/controller";
import { calculateThreads, calculateDelays } from "/lib/thread-utils";

export interface Task {
  target: Server;
  hosts: Server[];
  script: string;
  threads: number;
  delay: number;
}

export function isTask(job: Batch | Task): job is Batch {
  const script = (job as Task).script;
  const threads = (job as Task).threads;
  const delay = (job as Task).delay;

  return script !== undefined && threads !== undefined && delay !== undefined;
}

export function createBatchTasks(ns: NS, controller: Controller): Task[] {
  const scripts: string[] = getBatchScripts();
  const threads: number[] = calculateThreads(ns, controller);
  const delays: number[] = calculateDelays(ns, controller);

  const tasks: Task[] = [];
  for (let i = 0; i < scripts.length; i++) {
    const task = createTask(controller, scripts[i], threads[i], delays[i]);
    tasks.push(task);
  }

  return tasks;
}

export function createTask(
  controller: Controller,
  script: string,
  threads: number,
  delay = 0,
): Task {
  const target: Server = controller.metrics.target.server;
  const hosts: Server[] = controller.usableServers;
  const task = {
    target: target,
    hosts: hosts,
    script: script,
    threads: threads,
    delay: delay,
  };
  return task;
}

export function calculateTaskTime(ns: NS, task: Task): number {
  const hackTime = ns.getHackTime(task.target.hostname);
  let taskTime = 0;
  switch (task.script) {
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
