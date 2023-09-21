import { NS } from "@ns";
import { getTotalRam } from "./lib/ram-helper";

/**
 * Startup routine for scripts
 * @param {NS} ns - Mandatory to access netscript functions
 */
export async function main(ns: NS) {
  const host = "home";

  startServerExpander(ns);

  if (!ns.scriptRunning("cracker/server-cracker.js", host)) {
    ns.run("/cracker/server-cracker.js");
  }

  startHacking(ns);

  if (!ns.scriptRunning("hacknet-nodes-upgrader.js", host)) {
    //ns.run("hacknet-nodes-upgrader.js");
  }

  if (!ns.scriptRunning("watcher.js", host)) {
    ns.run("watcher.js");
  }
}

function startServerExpander(ns: NS) {
  if (hasEnoughMoney(ns)) {
    const serverExpander = "expand-servers.js";
    ns.run(serverExpander);
  }
}

function startHacking(ns: NS) {
  const script = decideHackerScript(ns);
  if (!ns.isRunning(script)) {
    ns.run(script);
  }
}

function decideHackerScript(ns: NS) {
  const totalRam = getTotalRam(ns);
  let script = "";
  const controller = "/hacking/controller.js";
  const earlyHack = "/hacking/early-game-hack.js";
  if (totalRam > 512) {
    script = controller;
    ns.scriptKill(earlyHack, "home");
  } else {
    script = earlyHack;
    ns.scriptKill(controller, "home");
  }
  return script;
}

function hasEnoughMoney(ns: NS) {
  const minMoney = 440_000;
  const money = ns.getServerMoneyAvailable("home");
  return money > minMoney;
}
