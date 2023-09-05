import { NS, Server } from "@ns";
import { getGrowThreads, getWeakenThreads, distributeScript, getUsableHosts, getThreadsForAllScripts } from "lib/batch-helper";
import { mostProfitableServer } from "/lib/profit-functions";

export interface Batch {
  target: Server,
  hosts: string[],
  hackThreads: number,
  growThreads: number,
  hackWeakenThreads: number,
  growWeakenThreads: number,
}

export async function main(ns: NS): Promise<void> {
  ns.disableLog('getServerMaxRam');
  ns.disableLog('getServerUsedRam');
  await deploy(ns);
}

async function deploy(ns: NS) {
  const target = ns.getServer(mostProfitableServer(ns));
  let hosts: string[] = getUsableHosts(ns);
  await prepareTarget(ns, hosts, target)
  ns.print(`INFO Server is prepared`);

  let nextNewPort = 0;
  while (true) {
    const [hackThreads, hackWeakenThreads, growThreads, growWeakenThreads] =
      getThreadsForAllScripts(ns, target);

    const batch: Batch = {
      target: target,
      hosts: getUsableHosts(ns),
      hackThreads: hackThreads,
      hackWeakenThreads: hackWeakenThreads,
      growThreads: growThreads,
      growWeakenThreads: growWeakenThreads,
    }

    ns.run("hacking/worker.js", nextNewPort);
    ns.writePort(nextNewPort, JSON.stringify(batch));
    nextNewPort++;
  }
}

async function prepareTarget(ns: NS, hosts: string[], target: Server) {
  if (targetIsPrepared(target)) {
    return;
  }
  ns.print(`INFO Preparing target server...`);

  const [, , growThreads, weakenThreads] = getThreadsForAllScripts(ns, target);
  distributeScript(ns, "hacking/weaken.js", hosts, weakenThreads, target.hostname);

  await ns.sleep(getGrowDelay(ns, target));
  distributeScript(ns, "hacking/grow.js", hosts, growThreads, target.hostname);

  await ns.sleep(ns.getGrowTime(target.hostname));
}

function targetIsPrepared(target: Server) {
  const targetHasMaxMoney = target.moneyAvailable === target.moneyMax;
  const targetHasMinSec = target.hackDifficulty === target.minDifficulty;
  return targetHasMaxMoney && targetHasMinSec;
}

function getGrowDelay(ns: NS, target: Server) {
  const weakenTime = ns.getWeakenTime(target.hostname);
  const growTime = ns.getGrowTime(target.hostname);
  const growDelay = weakenTime - growTime - 5;

  return growDelay;
}
