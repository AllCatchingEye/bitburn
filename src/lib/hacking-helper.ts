import { NS } from "@ns";
import { Batch, isBatch } from "/hacking/batch";
import { Task } from "/hacking/task";
import { hackingScripts } from "/scripts/Scripts";
import { getMaxRunnableThreads } from "/lib/thread-utils";
import {
  ramEnough,
  calculateRamCost,
  calculateAvailableRam,
} from "/lib/ram-helper";

export function distributeScript(
  ns: NS,
  script: string,
  hosts: string[],
  threads: number,
  target: string,
): void {
  let threadsLeft = threads;
  hosts.forEach((host) => {
    threadsLeft = execute(ns, script, host, threadsLeft, target);
  });
}

function execute(
  ns: NS,
  script: string,
  host: string,
  threads: number,
  target: string,
) {
  const maxPossibleThreads = getMaxRunnableThreads(ns, script, host);
  const runnableThreads = Math.floor(Math.min(threads, maxPossibleThreads));

  if (runnableThreads > 0) {
    ns.exec(script, host, runnableThreads, target);
    ns.print(
      `INFO Starting ${script} ${runnableThreads} times on ${host} for ${target}`,
    );
  }

  return Math.floor(threads) - runnableThreads;
}

// Deploys a job.
// A job can be a single task or a whole batch
export async function deploy(ns: NS, job: Batch | Task): Promise<void> {
  if (!ramEnough(ns, job)) {
    shrinkJob(ns, job);
  }

  if (isBatch(job)) {
    for (const task of job.tasks) {
      await dispatchWorker(ns, task);
    }
  } else {
    await dispatchWorker(ns, job);
  }
}

// Dispatches worker for a task
export async function dispatchWorker(ns: NS, task: Task): Promise<void> {
  if (task.threads <= 0) {
    return;
  }

  ns.run("hacking/tWorker.js", 1, JSON.stringify(task));
}

export function shrinkJob(ns: NS, job: Batch | Task): void {
  const availableRam = calculateAvailableRam(ns);
  const ramCost = calculateRamCost(ns, job);
  const reduction = availableRam / ramCost;

  if (isBatch(job)) {
    job.tasks.forEach((task) => {
      shrinkTask(reduction, task);
    });
  } else {
    shrinkTask(reduction, job);
  }
}

export function shrinkTask(reduction: number, task: Task): void {
  const newThreadCount = task.threads * reduction;
  if (task.script == hackingScripts.Weaken) {
    // If the script is weaken, ceil to ensure security wont slowly raise
    task.threads = Math.ceil(newThreadCount);
  } else {
    // Hack and grow will be floored
    task.threads = Math.floor(newThreadCount);
  }
}
