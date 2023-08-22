import { NS } from "@ns";
import {
  getMaxPossibleThreads,
  waitUntilScriptFinished,
} from "/lib/helper-functions";

/** @param {NS} ns */
export async function hackingScript(ns: NS) {
  const target: string = ns.args[0].toString();

  const moneyThresh = ns.getServerMaxMoney(target) * 0.75;
  const securityThresh = ns.getServerMinSecurityLevel(target) + 5;

  hackServer(ns, target, securityThresh, moneyThresh);
}

function hackServer(
  ns: NS,
  target: string,
  securityThresh: number,
  moneyThresh: number
) {
  while (true) {
    let script = "";
    script = determineScript(ns, target, securityThresh, script, moneyThresh);

    const maxPossibleThreads: number = getMaxPossibleThreads(
      ns,
      script,
      target
    );
    const pid = ns.run(script, maxPossibleThreads);
    waitUntilScriptFinished(ns, pid);
  }
}

function determineScript(
  ns: NS,
  target: string,
  securityThresh: number,
  script: string,
  moneyThresh: number
) {
  if (ns.getServerSecurityLevel(target) > securityThresh) {
    script = "weaken.js";
  } else if (ns.getServerMoneyAvailable(target) < moneyThresh) {
    script = "grow.js";
  } else {
    script = "hack.js";
  }
  return script;
}
