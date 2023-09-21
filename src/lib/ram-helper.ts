import { NS, Server } from "@ns";
import { Task } from "/hacking/task";
import { getUsableHosts } from "/lib/searchServers";

export async function waitTillEnoughRamAvailable(
  ns: NS,
  tasks: Task[],
): Promise<void> {
  while (!batchHasEnoughRam(ns, tasks)) {
    await ns.sleep(100);
  }
  return;
}

export function reduceThreadAmount(ns: NS, tasks: Task[]): Task[] {
  const availableRamAcrossHosts = calculateAvailableRamAcrossHosts(ns);
  const batchRamCost = calculateBatchRamCost(ns, tasks);
  const reduction = availableRamAcrossHosts / batchRamCost;

  tasks.forEach((task) => {
    const newThreadCount = task.threads * reduction;
    if (task.script == "hacking/weaken.js") {
      task.threads = Math.ceil(newThreadCount);
    } else {
      task.threads = Math.floor(newThreadCount);
    }
  });
  const newBatchRamCost = calculateBatchRamCost(ns, tasks);
  ns.print(newBatchRamCost);
  return tasks;
}

export function batchHasEnoughRam(ns: NS, tasks: Task[]): boolean {
  const availableRamAcrossHosts = calculateAvailableRamAcrossHosts(ns);
  const batchRamCost = calculateBatchRamCost(ns, tasks);
  const batchHasEnoughRam = availableRamAcrossHosts > batchRamCost;
  return batchHasEnoughRam;
}

export function calculateAvailableRamAcrossHosts(ns: NS): number {
  const hosts = getUsableHosts(ns);
  let availableRamAcrossHosts = 0;
  hosts.forEach((host) => {
    availableRamAcrossHosts += calculateAvailableRamOnHost(ns, host);
  });
  return availableRamAcrossHosts;
}

function calculateAvailableRamOnHost(ns: NS, host: Server): number {
  let availableRamOnHost = host.maxRam - host.ramUsed;
  if (host.hostname == "home") {
    availableRamOnHost -= 64;
  }

  const minimumRequiredRam = ns.getScriptRam("hacking/weaken.js");
  const usableRam =
    availableRamOnHost - (availableRamOnHost % minimumRequiredRam);

  return usableRam;
}

function calculateBatchRamCost(ns: NS, tasks: Task[]): number {
  let batchRamCost = 0;
  tasks.forEach((task) => {
    const taskRamCost = calculateTaskRamUsage(ns, task);
    batchRamCost += taskRamCost;
  });
  return batchRamCost;
}

function calculateTaskRamUsage(ns: NS, task: Task): number {
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
