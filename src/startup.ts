import { NS } from "@ns";

/** @param {NS} ns */
export async function main(ns: NS) {
  ns.exec("deploy-script.js", "home");
  ns.exec("expand-servers.js", "home");
  ns.exec("hacknet-nodes-upgrader.js", "home");
}