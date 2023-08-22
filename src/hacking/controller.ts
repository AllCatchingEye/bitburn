import { NS } from "@ns";
import {
  getMaxPossibleThreads,
  waitUntilScriptFinished,
} from "/lib/helper-functions";
import { mostProfitableServer } from "/lib/profit-functions";

/** @param {NS} ns */
export async function hackingScript(ns: NS): Promise<void> {
  ns.run("crackServers.js", 1, "home");

  await hackServer(ns);
}

async function hackServer(ns: NS) {
  while (true) {
    
    const target = mostProfitableServer(ns);
    const moneyThresh = ns.getServerMaxMoney(target) * 0.75;
    const securityThresh = ns.getServerMinSecurityLevel(target) + 5;
    
    const script = determineScript(ns, target, securityThresh, moneyThresh);

    const maxPossibleThreads: number = getMaxPossibleThreads(
      ns,
      script,
      target
    );

    const pid = ns.run(script, maxPossibleThreads, target);
    await waitUntilScriptFinished(ns, pid);
  }
}

function determineScript(
  ns: NS,
  target: string,
  securityThresh: number,
  moneyThresh: number
): string {
  let script = "";
  if (ns.getServerSecurityLevel(target) > securityThresh) {
    script = "weaken.js";
  } else if (ns.getServerMoneyAvailable(target) < moneyThresh) {
    script = "grow.js";
  } else {
    script = "hack.js";
  }
  return script;
}
