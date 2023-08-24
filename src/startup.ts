import { NS } from "@ns";

/**
 * Startup routine for scripts
 * @param {NS} ns - Mandatory to access netscript functions
 */
export async function main(ns: NS) {
  const expandServersPid = ns.exec("expand-servers.js", "home");

  const hacknetNodesUpgraderPid = ns.exec("hacknet-nodes-upgrader.js", "home");

  const serverCracker = ns.run("hacking/server-cracker.js");

  const hackDeployer = ns.run("hacking/hack-deployer.js");
}

