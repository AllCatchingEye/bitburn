import { NS } from "@ns";

/**
 * Startup routine for scripts
 * @param {NS} ns - Mandatory to access netscript functions
 */
export async function main(ns: NS) {
  const host = "home";
  if (!ns.scriptRunning("watcher.js", host)) {
    ns.run("watcher.js");
  }

  if (!ns.scriptRunning("expand-servers.js", host)) {
    ns.run("expand-servers.js");
  }

  if (!ns.scriptRunning("server-cracker.js", host)) {
    ns.run("server-cracker.js");
  }

  if (!ns.scriptRunning("/hacking/controller.js", host)) {
    ns.run("/hacking/controller.js");
  }

  if (!ns.scriptRunning("hacknet-nodes-upgrader.js", host)) {
    //ns.run("hacknet-nodes-upgrader.js");
  }
}

