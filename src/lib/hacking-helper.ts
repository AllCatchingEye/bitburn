import { NS } from "@ns";
import { Job, isBatch } from "/hacking/job";
import { Task } from "/hacking/task";
import { hackingScripts } from "/scripts/Scripts";
import { getMaxRunnableThreads } from "/lib/thread-utils";
import { calculateRamCost, getAvailableRam } from "/lib/ram-helper";

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

export function shrinkJob(ns: NS, job: Job): void {
  const availableRam = getAvailableRam(ns);
  const reduction = availableRam / job.ramCost;

  if (isBatch(job.tasks)) {
    job.tasks.forEach((task) => {
      shrinkTask(reduction, task);
    });
  } else {
    shrinkTask(reduction, job.tasks);
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
