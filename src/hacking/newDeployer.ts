import { NS, Server } from "@ns";
import { mostProfitableServer } from "/lib/profit-functions";
import { searchServers } from "/lib/searchServers";

export async function main(ns: NS): Promise<void> {
  ns.disableLog('getServerMaxRam');
  ns.disableLog('getServerUsedRam');
  await deploy(ns);
}

async function deploy(ns: NS) {
  while (true) {
    const target = ns.getServer(mostProfitableServer(ns));
    let [hackThreads, hackSecurityThreads, growThreads, growSecurityThreads]
      = calculateThreads(ns, target);

    // search hosts and filter them for running scripts on them
    const hosts: string[] = searchServers(ns, "home")
      .map((serverName) => ns.getServer(serverName))
      .filter((server) => server.hostname !== "home")
      .filter((server) => server.hasAdminRights)
      .filter((server) => server.maxRam !== 0)
      .map(server => server.hostname);

    distributeScript(ns, 'hacking/grow.js', hosts, growThreads, target.hostname);

    await ns.sleep(10);
    const weakenThreads = hackSecurityThreads + growSecurityThreads;
    distributeScript(ns, 'hacking/weaken.js', hosts, weakenThreads, target.hostname);

    const weakenTime = ns.getWeakenTime(target.hostname);
    const hackTime = ns.getHackTime(target.hostname);
    await ns.sleep(weakenTime - hackTime - 10);
    distributeScript(ns, 'hacking/hack.js', hosts, hackThreads, target.hostname);

    await ns.sleep(hackTime);
  }
}

function distributeScript(ns: NS, script: string,
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
  }

  return Math.floor(threads) - runnableThreads;
}

function calculateThreads(ns: NS, target: Server) {
  const hackThreads = ns.hackAnalyzeThreads(target.hostname, target.moneyMax!);
  const hackSecurityThreads = calculateSecurityThreads(ns, "hacking/hack.js", hackThreads);

  const growThreads = calculateGrowThreads(ns, target.moneyAvailable!, target);
  const growSecurityThreads = calculateSecurityThreads(ns, "hacking/grow.js", growThreads);

  return [hackThreads, hackSecurityThreads, growThreads, growSecurityThreads];
}

function calculateGrowThreads(ns: NS, availableMoney: number, target: Server) {
  const targetGrowth = (target.moneyMax! + 1) / (availableMoney + 1);
  const growThreads = ns.growthAnalyze(target.hostname, targetGrowth);

  return growThreads;
}

export function getMaxPossibleThreads(ns: NS, script: string,
  hostname: string): number {
  const scriptRamCost = ns.getScriptRam(script);
  const availableRamOnHost =
    ns.getServerMaxRam(hostname) - ns.getServerUsedRam(hostname);

  const maxPossibleThreads = Math.floor(availableRamOnHost / scriptRamCost);
  return maxPossibleThreads;
}

function calculateSecurityThreads(ns: NS, script: string, threads: number) {
  let securityIncrease = 0;
  if (script == "hacking/hack.js") {
    securityIncrease = ns.hackAnalyzeSecurity(threads);
  } else {
    securityIncrease = ns.growthAnalyzeSecurity(threads);
  }

  const securityThreads = securityIncrease / ns.weakenAnalyze(1);
  return securityThreads;
}
