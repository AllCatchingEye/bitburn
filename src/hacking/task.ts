import { NS, Server } from "@ns"
import { Controller } from "/hacking/controller";
import { getThreadsForAllScripts } from "/lib/thread-utils";

export interface Task {
  target: Server,
  hosts: Server[],
  script: string,
  threads: number,
  delay: number,
}

export function createTask(controller: Controller, script: string,
  threads: number, delay = 0): Task {
  const target: Server = controller.target.server;
  const hosts: Server[] = controller.hosts;
  const task = {
    target: target,
    hosts: hosts,
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
    calculateDelays(ns, controller.target.server, controller.spacer);

  // To negate the security increase by hack, weaken should be startet first
  // The rest can be startet simultanously with a slight delay between them because they 
  // finish in order 
  const hack: Task = createTask(controller, '/hacking/hack.js', hackThreads, hackDelay);
  const weaken1: Task = createTask(controller, '/hacking/weaken.js', weaken1Threads, weaken1Delay);
  const grow: Task = createTask(controller, '/hacking/grow.js', growThreads, growDelay);
  const weaken2: Task = createTask(controller, '/hacking/weaken.js', weaken2Threads, weaken2Delay);
  const tasks: Task[] = [hack, weaken1, grow, weaken2];

  return tasks;
}

function calculateDelays(ns: NS, target: Server, spacer: number):
  [number, number, number, number] {
  const hackTime = ns.getHackTime(target.hostname);
  const growTime = ns.getGrowTime(target.hostname);
  const weakenTime = ns.getWeakenTime(target.hostname);

  // Calculate delay based on weaken1
  //  H:    =     => W - H - S
  // W1: =====    => 0
  //  G:   ====   => W - G + S
  // W2:   =====  => S * 2
  const hackDelay = weakenTime - hackTime - spacer;
  const weaken1Delay = 0;
  const growDelay = weakenTime - growTime + spacer;
  const weaken2Delay = spacer * 2;

  return [hackDelay, weaken1Delay, growDelay, weaken2Delay];
}
