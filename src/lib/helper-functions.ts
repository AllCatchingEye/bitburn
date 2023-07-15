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
 * Filters a list of servers
 * @param ns - Netscript library
 * @param servers - Servers found
 * @param filter - string that filters
 * @returns - List of filtered servers
 */
export function filterServers(
  ns: NS,
  servers: Set<string>,
  filter: string
) {
  const filteredServers = new Set<string>();
  for (let server of servers) {
    if (!server.includes(filter)) {
      filteredServers.add(server);
    }
  }
  return filteredServers;
}