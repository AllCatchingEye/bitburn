import { NS, Server } from "@ns";

/**
 * Checks if you can hack the provided server
 * @param ns - Netscript library
 * @param server - Server for which you want to check if you can hack it
 * @returns {boolean} - If you can hack the provided server
 */
export function hackSkillEnough(ns: NS, server: Server) {
  const hackingSkill = ns.getHackingLevel();
  const requiredSkill: number = server.requiredHackingSkill ?? 0;

  return hackingSkill > requiredSkill;
}

/**
 * Calculates the maximum amount a script can run on this server
 * @param ns - Netscript library
 * @param server - Server to run script on
 * @param script - Script that should be ran
 * @returns {number} How many times the script can run parallel on the server
 */
export function calcMaxScriptAmount(ns: NS, server: Server, script: string) {
  const ramOfScript: number = ns.getScriptRam(script, server.hostname);
  const scriptAmount = Math.floor(server.maxRam / ramOfScript);
  return scriptAmount;
}

/**
 * Executes the provided script on the specified server
 * @param ns - Netscript library
 * @param server - Server on which the script should be deployed
 * @param script - Script that should be deployed
 */
export async function deployScript(ns: NS, server: Server, script: string, runParallel?: boolean) {
  const maxScriptAmount = calcMaxScriptAmount(ns, server, script);
  const scriptAmount: number = runParallel ? maxScriptAmount : 1;

  const canRunScript: boolean = hackSkillEnough(ns, server) && scriptAmount > 0;
  if (canRunScript) {
    runScript(ns, server, script, scriptAmount);
  }
}

/**
 * Runs a specified amount of the provided script on the provided server
 * @param ns - Netscript library
 * @param server - Server that should run the script
 * @param script - Script that should be run
 * @param amount - How many times the script should be run
*/
export async function runScript(ns:NS, server: Server, script: string, amount: number) {
  // Copies the provided script to the target server that will be executed there
  await ns.scp(script, server.hostname, 'home');
  
  // Execute the specified amount of scripts on target server
  await ns.exec(script, server.hostname, amount);
  ns.tprint(`Started ${amount} hacks on ${server.hostname}`);
}