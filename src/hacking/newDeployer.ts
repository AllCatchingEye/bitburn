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
    const weakenThreads = hackSecurityThreads + growSecurityThreads;

    // search hosts and filter them for running scripts on them
    const hosts: string[] = searchServers(ns, "home")
      .map((serverName) => ns.getServer(serverName))
      .filter((server) => server.hostname !== "home")
      .filter((server) => server.hasAdminRights)
      .filter((server) => server.maxRam !== 0)
      .map(server => server.hostname);

    const hackTime = ns.getHackTime(target.hostname);
    const weakenTime = ns.getWeakenTime(target.hostname);
    const growTime = ns.getGrowTime(target.hostname);

    distributeScript(ns, 'hacking/weaken.js', hosts, weakenThreads, target.hostname);

    //await ns.sleep(Math.max(sleepTime, 0));
    distributeScript(ns, 'hacking/grow.js', hosts, growThreads, target.hostname);

    //sleepTime = weakenTime - hackTime - sleepTime;
    //await ns.sleep(Math.max(sleepTime, 0))
    distributeScript(ns, 'hacking/hack.js', hosts, hackThreads, target.hostname);

    await ns.sleep(Math.min(hackTime, weakenTime, growTime));
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
    ns.print(`INFO Starting ${script} ${runnableThreads} times on ${host} for ${target}`);
  }

  return Math.floor(threads) - runnableThreads;
}

function calculateThreads(ns: NS, target: Server) {
  const hackThreads = Math.ceil(ns.hackAnalyzeThreads(target.hostname, target.moneyMax!));
  const hackSecurityThreads = calculateSecurityThreads(ns, "hacking/hack.js", hackThreads, target);

  const growThreads = calculateGrowThreads(ns, target);
  const growSecurityThreads = calculateSecurityThreads(ns, "hacking/grow.js", growThreads, target);

  return [hackThreads, hackSecurityThreads, growThreads, growSecurityThreads];
}

function calculateGrowThreads(ns: NS, target: Server) {
  const multiplier = target.moneyMax! / target.moneyAvailable!;
  const growThreads = ns.growthAnalyze(target.hostname, multiplier);

  return Math.ceil(growThreads);
}

export function getMaxPossibleThreads(ns: NS, script: string,
  hostname: string): number {
  const scriptRamCost = ns.getScriptRam(script);
  const availableRamOnHost =
    ns.getServerMaxRam(hostname) - ns.getServerUsedRam(hostname);

  const maxPossibleThreads = Math.floor(availableRamOnHost / scriptRamCost);
  return maxPossibleThreads;
}

function calculateSecurityThreads(ns: NS, script: string, threads: number, target: Server) {
  let securityIncrease = 0;
  if (script == "hacking/hack.js") {
    securityIncrease = ns.hackAnalyzeSecurity(threads, target.hostname);
  } else {
    securityIncrease = ns.growthAnalyzeSecurity(threads, target.hostname);
  }

  const securityReduction = (target.hackDifficulty! + securityIncrease - target.minDifficulty!);
  const securityThreads = securityReduction / ns.weakenAnalyze(1);
  return Math.ceil(securityThreads);
}
