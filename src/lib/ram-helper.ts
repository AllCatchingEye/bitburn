import { NS, Server } from "@ns";
import { Job, isBatch } from "/hacking/job";
import { Task } from "/hacking/task";
import { getUsableHosts } from "/lib/searchServers";
import { getStartupScriptsList, hackingScripts } from "/scripts/Scripts";

export interface RamNet {
  ns: NS;
  maxRam: number;
  availableRam: number;
  blocks: [Server, number][];
}

export class RamNet implements RamNet {
  ns: NS;
  maxRam: number;
  availableRam: number;
  blocks: [Server, number][];

  constructor(ns: NS) {
    this.ns = ns;
    this.maxRam = getTotalRam(ns);
    this.availableRam = getAvailableRam(ns);
    this.blocks = calculateBlocks(ns);
  }
}

function calculateBlocks(ns: NS): [Server, number][] {
  const hosts: Server[] = getUsableHosts(ns);
  const blocks: [Server, number][] = hosts.map((host) => [host, host.maxRam]);

  return blocks;
}

export function getAvailableRam(ns: NS): number {
  let hosts = getUsableHosts(ns);
  hosts = hosts.filter((host) => calculateFreeRam(host) >= 1.75);

  let availableRam = 0;
  hosts.forEach((host) => {
    availableRam += calculateHostRam(ns, host);
  });

  return availableRam;
}

function calculateFreeRam(host: Server) {
  return host.maxRam - host.ramUsed;
}

function calculateHostRam(ns: NS, host: Server): number {
  let availableRamOnHost = host.maxRam - host.ramUsed;
  if (host.hostname == "home") {
    availableRamOnHost -= calculateStartupScriptsRam(ns);
    availableRamOnHost = Math.max(availableRamOnHost, 0);
  }

  const scriptRamCost = ns.getScriptRam(hackingScripts.Weaken);
  const usableRam = availableRamOnHost - (availableRamOnHost % scriptRamCost);

  return usableRam;
}

function calculateStartupScriptsRam(ns: NS): number {
  const startupScripts: string[] = getStartupScriptsList();
  const startupScriptsRamCost = 0;
  startupScripts.forEach(
    (script) => startupScriptsRamCost + ns.getScriptRam(script),
  );

  return startupScriptsRamCost;
}

export function calculateRamCost(ns: NS, tasks: Task[] | Task): number {
  let jobRamCost = 0;
  if (isBatch(tasks)) {
    tasks.forEach((task) => {
      const taskRamCost = calculateTaskRamUsage(ns, task.script, task.threads);
      jobRamCost += taskRamCost;
    });
  } else {
    jobRamCost = calculateTaskRamUsage(ns, tasks.script, tasks.threads);
  }

  return jobRamCost;
}

export function calculateTaskRamUsage(
  ns: NS,
  script: string,
  threads: number,
): number {
  return ns.getScriptRam(script) * threads;
}

export function getTotalRam(ns: NS): number {
  const hosts = getUsableHosts(ns);
  let totalRam = 0;
  hosts.forEach((host) => {
    totalRam += ns.getServerMaxRam(host.hostname);
  });
  return totalRam;
}

// Checks if enough ram is available across hosts for a job
export function ramEnough(ns: NS, job: Job): boolean {
  return getAvailableRam(ns) > job.ramCost;
}
