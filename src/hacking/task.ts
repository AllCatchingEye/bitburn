import { Server } from "@ns";
import { Scripts, getBatchScripts } from "/Scripts";
import { Batch } from "./batch";
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
  const target: Server = controller.target.server;
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
  let taskTime = 0;
  switch (task.script) {
    case Scripts.Grow:
      taskTime = ns.getGrowTime(task.target.hostname);
      break;
    case Scripts.Weaken:
      taskTime = ns.getWeakenTime(task.target.hostname);
      break;
    case Scripts.Hacking:
      taskTime = ns.getHackTime(task.target.hostname);
      break;
    default:
      break;
  }

  return taskTime;
}
