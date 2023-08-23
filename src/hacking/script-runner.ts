import { NS } from "@ns";
import { waitUntilScriptFinished, calculateThreadAmount } from "/lib/helper-functions";


export async function main(ns: NS): Promise<void> {
  const script = ns.args[0] as string;
  const serverName = ns.args[1] as string;
  const target = ns.args[2] as string;

  await scriptRunner(ns, script, serverName, target);
}

/**
 * Runs a script 
 * @param {NS} ns - Mandatory to access netscript functions
 * @param {string} script - Script that should be run
 * @param {string} serverName - Server on which the script is run
 * @param {string} target - Which server the scripts should target
 */
async function scriptRunner(ns: NS, serverName: string, target: string) {
  const maxPossibleThreads: number = calculateThreadAmount(
    ns,
    script,
    serverName
  );

  const pid = ns.exec(script, hackableServer.hostname, maxPossibleThreads, target);

  await waitUntilScriptFinished(ns, pid);
}