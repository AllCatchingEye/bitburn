import { NS, Server } from "@ns";
import { findServers } from "../lib/find-Neighbours";
import { deployScript } from "/lib/script-handler";

/** 
 * Deploys and executes the provided script 
 * @param {NS} ns - Netscript library
 * @param {string} script - Script to deploy
 * @param {boolean} parallel - If set to true, it will run the script as many times as it can
 */
/** @param {NS} ns */
export async function main(ns: NS) {
  const target: string = String(ns.args[0]);
  const filter: string = String(ns.args[1]);
  const lookRecursive: boolean | undefined = Boolean(ns.args[2]);

  const neighbours = await findServers(ns, target, filter, lookRecursive);

  // Deploy script on all server found
  for (let neighbor of neighbours) {
    const server: Server = ns.getServer(neighbor);
    await deployScript(ns, server);
  }
}