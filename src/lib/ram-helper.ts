import { NS, Server } from "@ns";
import { getUsableHosts } from "/lib/searchServers";
import { getStartupScriptsList, hackingScripts } from "/scripts/Scripts";

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

export function getTotalRam(ns: NS): number {
  const hosts = getUsableHosts(ns);
  let totalRam = 0;
  hosts.forEach((host) => {
    totalRam += ns.getServerMaxRam(host.hostname);
  });
  return totalRam;
}
