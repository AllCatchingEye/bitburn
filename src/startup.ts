import { NS } from "@ns";

/**
 * Startup routine for scripts
 * @param {NS} ns - Mandatory to access netscript functions
 */
export async function main(ns: NS) {
  const watcherPid = ns.run("watcher.js");

  const expandServersPid = ns.run("expand-servers.js");

  // const hacknetNodesUpgraderPid = ns.exec("hacknet-nodes-upgrader.js", "home");

  const serverCracker = ns.run("server-cracker.js");

  const hackDeployer = ns.run("hacking/newDeployer.js");
}

