import { NS, Server } from "@ns";
import { searchServers } from "/lib/searchServers";

export function getThreadsForAllScripts(ns: NS, target: Server) {
  const hackThreads = Math.ceil(ns.hackAnalyzeThreads(target.hostname, target.moneyMax!));
  const hackWeakenThreads = getWeakenThreads(ns, "hacking/hack.js", hackThreads, target);

  const growThreads = getGrowThreads(ns, target);
  const growWeakenThreads = getWeakenThreads(ns, "hacking/grow.js", growThreads, target);

  return [hackThreads, hackWeakenThreads, growThreads, growWeakenThreads];
}

function getGrowThreads(ns: NS, target: Server) {
  if (ns.fileExists("Formulas.exe")) {
    return ns.formulas.hacking.growThreads(target, ns.getPlayer(), target.moneyMax!);
  }

  const multiplier = target.moneyMax! / target.moneyAvailable!;
  const growThreads = ns.growthAnalyze(target.hostname, multiplier);

  return Math.ceil(growThreads);
}

function getWeakenThreads(ns: NS, script: string, threads: number, target: Server) {
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

function getSecurityIncrease(ns: NS, script: string, threads: number, target: Server) {
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

function execute(ns: NS, script: string, host: string, threads: number, target: string) {
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
  const filteredHosts: Server[] = hosts.map((serverName) => ns.getServer(serverName))
    .filter((server) => server.hostname !== "home")
    .filter((server) => server.hasAdminRights)
    .filter((server) => server.maxRam !== 0);
  return filteredHosts;
}

export function getTimings(ns: NS, target: Server) {
  const hackDelay = ns.getHackTime(target.hostname);
  const growDelay = ns.getGrowTime(target.hostname);
  const weakenDelay = ns.getWeakenTime(target.hostname);

  return [hackDelay, growDelay, weakenDelay];
}
