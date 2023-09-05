import { NS, Server } from "@ns";
import { searchServers } from "/lib/searchServers";

export function getGrowThreads(ns: NS, target: Server) {
  if (ns.fileExists("Formulas.exe")) {
    return ns.formulas.hacking.growThreads(target, ns.getPlayer(), target.moneyMax!);
  }

  const multiplier = target.moneyMax! / target.moneyAvailable!;
  const growThreads = ns.growthAnalyze(target.hostname, multiplier);

  return Math.ceil(growThreads);
}

export function getWeakenThreads(ns: NS, script: string, threads: number, target: Server) {
  const currentSecurity = target.hackDifficulty! - target.minDifficulty!;
  const securityIncrease = getSecurityIncrease(ns, script, threads, target);
  const weakenThreads = (securityIncrease + currentSecurity) / ns.weakenAnalyze(1);
  return Math.ceil(weakenThreads);
}

export function getMaxPossibleThreads(ns: NS, script: string,
  hostname: string): number {
  const scriptRamCost = ns.getScriptRam(script);
  const availableRamOnHost =
    ns.getServerMaxRam(hostname) - ns.getServerUsedRam(hostname);

  const maxPossibleThreads = Math.floor(availableRamOnHost / scriptRamCost);
  return maxPossibleThreads;
}

export function getSecurityIncrease(ns: NS, script: string, threads: number, target: Server) {
  let securityIncrease = 0;
  if (script == "hacking/hack.js") {
    securityIncrease = ns.hackAnalyzeSecurity(threads, target.hostname);
  } else {
    securityIncrease = ns.growthAnalyzeSecurity(threads, target.hostname);
  }
  return securityIncrease;
}

export function distributeScript(ns: NS, script: string,
  hosts: string[], threads: number, target: string) {

  let threadsLeft = threads;
  hosts.forEach(host => {
    threadsLeft = execute(ns, script, host, threadsLeft, target);
  })
}

export function execute(ns: NS, script: string, host: string, threads: number, target: string) {
  const maxPossibleThreads = getMaxPossibleThreads(ns, script, host);
  const runnableThreads = Math.floor(Math.min(threads, maxPossibleThreads));

  if (runnableThreads > 0) {
    ns.exec(script, host, runnableThreads, target);
    ns.print(`INFO Starting ${script} ${runnableThreads} times on ${host} for ${target}`);
  }

  return Math.floor(threads) - runnableThreads;
}

export function getUsableHosts(ns: NS) {
  const hosts: string[] = searchServers(ns, "home");
  const filteredHosts: string[] = hosts.map((serverName) => ns.getServer(serverName))
    .filter((server) => server.hostname !== "home")
    .filter((server) => server.hasAdminRights)
    .filter((server) => server.maxRam !== 0)
    .map(server => server.hostname);
  return filteredHosts;
}

