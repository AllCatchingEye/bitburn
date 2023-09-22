import { NS } from "@ns";

/**
 * Startup routine for scripts
 * @param {NS} ns - Mandatory to access netscript functions
 */
export async function main(ns: NS): Promise<void> {
  while (true) {
    startCracker(ns);

    startHacking(ns);

    startServerExpander(ns);

    startWatcher(ns);

    // Not profitable for now
    //startHacknet(ns);

    await ns.sleep(1000);
  }
}

function startCracker(ns: NS) {
  const script = "cracker/server-cracker.js";
  startScript(ns, script);
}

function startHacking(ns: NS) {
  const script = "hacking/controller.js";
  startScript(ns, script);
}

function startServerExpander(ns: NS) {
  if (hasEnoughMoney(ns)) {
    const serverExpander = "expand-servers.js";
    ns.run(serverExpander);
  }
}

function hasEnoughMoney(ns: NS) {
  const minMoney = 440_000;
  const money = ns.getServerMoneyAvailable("home");
  return money > minMoney;
}

function startWatcher(ns: NS) {
  const script = "hacknet-nodes-upgrader.js";
  startScript(ns, script);
}

function startHacknet(ns: NS) {
  const script = "watcher.js";
  startScript(ns, script);
}

function startScript(ns: NS, script: string) {
  if (!ns.scriptRunning(script, "home")) {
    ns.run(script);
  }
}
