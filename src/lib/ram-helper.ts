import { NS, Server } from "@ns";
import { Task } from "/hacking/task";
import { Batch, isBatch } from "/hacking/batch";
import { getUsableHosts } from "/lib/searchServers";
import { shrinkThreads } from "./thread-utils";

export function calculateAvailableRam(ns: NS): number {
  const hosts = getUsableHosts(ns);
  let availableRam = 0;
  hosts.forEach((host) => {
    availableRam += calculateHostRam(ns, host);
  });
  return availableRam;
}

function calculateHostRam(ns: NS, host: Server): number {
  let availableRamOnHost = host.maxRam - host.ramUsed;
  if (host.hostname == "home") {
    availableRamOnHost -= 64;
  }

  const minimumRequiredRam = ns.getScriptRam("hacking/weaken.js");
  const usableRam =
    availableRamOnHost - (availableRamOnHost % minimumRequiredRam);

  return usableRam;
}

export function calculateTaskRamUsage(ns: NS, task: Task): number {
  const scriptRamCost = ns.getScriptRam(task.script);
  const taskRamCost = scriptRamCost * task.threads;
  return taskRamCost;
}

export function getTotalRam(ns: NS): number {
  const hosts = getUsableHosts(ns);
  let totalRam = 0;
  hosts.forEach((host) => {
    totalRam += ns.getServerMaxRam(host.hostname);
  });
  return totalRam;
}

// Waits until enough ram is available for a job
export async function waitForRam(ns: NS, job: Batch | Task): Promise<void> {
  while (!ramEnough(ns, job)) {
    await ns.sleep(100);
  }
  return;
}

// Checks if enough ram is available across hosts for a job
export function ramEnough(ns: NS, job: Batch | Task): boolean {
  const availableRamAcrossHosts = calculateAvailableRam(ns);
  const jobRamCost = calculateRamCost(ns, job);

  const jobHasEnoughRam = availableRamAcrossHosts > jobRamCost;

  return jobHasEnoughRam;
}

export function shrinkRam(ns: NS, job: Batch | Task): void {
  const availableRam = calculateAvailableRam(ns);
  const ramCost = calculateRamCost(ns, job);
  const reduction = availableRam / ramCost;

  if (isBatch(job)) {
    job.tasks.forEach((task) => {
      shrinkThreads(reduction, task);
    });
  } else {
    shrinkThreads(reduction, job);
  }
}

function calculateRamCost(ns: NS, job: Batch | Task): number {
  let jobRamCost = 0;
  if (isBatch(job)) {
    job.tasks.forEach((task) => {
      const taskRamCost = calculateTaskRamUsage(ns, task);
      jobRamCost += taskRamCost;
    });
  } else {
    jobRamCost = calculateTaskRamUsage(ns, job);
  }

  return jobRamCost;
}
