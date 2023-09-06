import { Server } from "@ns"
import { Controller } from "./controller";
import { getThreadsForAllScripts, getTimings } from "/lib/batch-helper";

export interface Task {
  target: Server,
  hosts: Server[],
  script: string,
  threads: number,
  delay: number,
}

export function createTask(controller: Controller, script: string,
  threads: number, delay: number = 0): Task {
  const task = {
    target: controller.target,
    hosts: controller.hosts,
    script: script,
    threads: threads,
    delay: delay,
  }
  return task;
}

export function createBatch(ns: NS, controller: Controller): Task[] {
  const [hackThreads, weaken1Threads, growThreads, weaken2Threads] =
    getThreadsForAllScripts(ns, controller.target);
  const [hackDelay, weaken1Delay, growDelay, weaken2Delay] =
    calculateDelays(ns, controller.target, controller.spacer);

  // To negate the security increase by hack, weaken should be startet first
  // The rest can be startet simultanously with a slight delay between them because they 
  // finish in order 
  const hack: Task = createTask(controller, 'hacking/hack.js', hackThreads, weaken1Delay);
  const weaken1: Task = createTask(controller, 'hacking/weaken.js', weaken1Threads, hackDelay);
  const grow: Task = createTask(controller, 'hacking/grow.js', growThreads, growDelay);
  const weaken2: Task = createTask(controller, 'hacking/weaken.js', weaken2Threads, weaken2Delay);
  const tasks: Task[] = [hack, weaken1, grow, weaken2];

  return tasks;
}

function calculateDelays(ns: NS, target: Server, spacer: number):
  [number, number, number, number] {
  const [hackTime, growTime, weakenTime] = getTimings(ns, target);

  const hackDelay = weakenTime - spacer - hackTime;
  const weaken1Delay = 0;
  const growDelay = weakenTime + spacer - growTime;
  const weaken2Delay = spacer * 2;

  return [hackDelay, weaken1Delay, growDelay, weaken2Delay];
}
