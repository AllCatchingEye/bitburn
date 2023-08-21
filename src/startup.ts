import { NS } from "@ns";
import { findServers } from "./lib/find-servers";

/** @param {NS} ns */
export async function main(ns: NS) {
  const expandServersPid = ns.exec("expand-servers.js", "home");
  //const hacknetNodesUpgraderPid = ns.exec("hacknet-nodes-upgrader.js", "home");

  const target = "joesguns";
  while (true) {
    ns.exec("deploy-script.js", "home", 1, "home", target);
    await ns.sleep(60000);
  }
}

