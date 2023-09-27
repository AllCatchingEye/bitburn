import { NS } from "@ns";

/**
 * Startup routine for scripts
 * @param {NS} ns - Mandatory to access netscript functions
 */
export async function main(ns: NS): Promise<void> {
  //while (true) {
  const loggerPid: number = startLogger(ns);

  startCracker(ns);

  startHacking(ns, loggerPid);

  startServerExpander(ns);

  startWatcher(ns);

  // Not profitable for now
  //startHacknet(ns);

  //await ns.sleep(1000);
  //}
}

function startLogger(ns: NS): number {
  const script = "hacking/logging.js";
  const pid: number = startScript(ns, script);
  return pid;
}

function startCracker(ns: NS) {
  const script = "cracker/server-cracker.js";
  startScript(ns, script);
}

function startHacking(ns: NS, loggerPid: number) {
  const script = "hacking/controller.js";
  startScript(ns, script, loggerPid);
}

function startServerExpander(ns: NS) {
  if (hasEnoughMoney(ns)) {
    const script = "expand-servers.js";
    startScript(ns, script);
  }
}

function hasEnoughMoney(ns: NS) {
  const minMoney = 440_000;
  const money = ns.getServerMoneyAvailable("home");
  return money > minMoney;
}

function startWatcher(ns: NS) {
  const script = "watcher.js";
  startScript(ns, script);
}

/*
function startHacknet(ns: NS) {
  const script = "hacknet-nodes-upgrader.js";
  startScript(ns, script);
}
*/

function startScript(
  ns: NS,
  script: string,
  ...args: (string | number | boolean)[]
): number {
  let pid = 0;
  if (!ns.scriptRunning(script, "home")) {
    pid = ns.run(script, 1, ...args);
  }
  return pid;
}
