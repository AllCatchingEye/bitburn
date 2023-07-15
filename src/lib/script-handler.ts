import { NS, Server } from "@ns";

/**
 * Executes the provided script on the specified server
 * @param ns - Netscript library
 * @param server - Server on which the script should be deployed
 * @param script - Script that should be deployed
 */
export async function deployScript(ns: NS, server: Server, script: string, runParallel?: boolean) {
  const maxScriptAmount = calcMaxScriptAmount(ns, server, script);
  const amount: number = runParallel ? maxScriptAmount : 1;

  if (canRunScript(ns, server, amount)) {
    runScript(ns, server, script, amount);
  }
}

/**
 * Runs a specified amount of the provided script on the provided server
 * @param ns - Netscript library
 * @param server - Server that should run the script
 * @param script - Script that should be run
 * @param amount - How many times the script should be run
*/
async function runScript(ns:NS, server: Server, script: string, amount: number) {
  // Copies the provided script to the target server that will be executed there
  await ns.scp(script, server.hostname, 'home');
  await initServer(ns, server.hostname);
  
  // Execute the specified amount of scripts on target server
  await ns.exec(script, server.hostname, amount);
  ns.tprint(`Started ${amount} hacks on ${server.hostname}`);
}

function canRunScript(ns: NS, server: Server, amount: number) {
  return hackSkillEnough(ns, server) && amount > 0;
}

async function initServer(ns: NS, target: string) {
  if (ns.fileExists("BruteSSH.exe", "home")) {
      await ns.brutessh(target);
  }

  await ns.nuke(target);
}