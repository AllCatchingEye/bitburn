import { NS } from '@ns';

// Paths to the hacking scripts used in the game.
export const HACK_SCRIPT_PATH = 'hackScripts/hack.js';
export const GROW_SCRIPT_PATH = 'hackScripts/grow.js';
export const WEAKEN_SCRIPT_PATH = 'hackScripts/weaken.js';

/**
 * Checks if the player has a high enough hacking level to hack the specified server.
 *
 * @param {NS} ns - The Netscript environment object providing access to game functions.
 * @param {string} server - The name of the server to check.
 * @returns {boolean} - True if the player's hacking level is sufficient, false otherwise.
 */
export function canHack(ns: NS, server: string): boolean {
  return ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(server);
}

/**
 * Calculates the total available RAM across the specified servers.
 * This considers the currently used RAM and ensures that the remaining RAM can fully support the weakest script.
 *
 * @param {NS} ns - The Netscript environment object providing access to game functions.
 * @param {string[]} servers - An array of server names to calculate available RAM for.
 * @returns {number} - The total available RAM across all specified servers.
 */
export function getAvailableRam(ns: NS, servers: string[]): number {
  let availableRam = 0;
  for (const server of servers) {
    const serverRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
    const serverUsableRam = serverRam - (serverRam % ns.getScriptRam(WEAKEN_SCRIPT_PATH));
    availableRam += serverUsableRam;
  }
  return availableRam;
}

/**
 * Calculates the total maximum RAM across the specified servers.
 *
 * @param {NS} ns - The Netscript environment object providing access to game functions.
 * @param {string[]} servers - An array of server names to calculate maximum RAM for.
 * @returns {number} - The total maximum RAM across all specified servers.
 */
export function getTotalMaxRam(ns: NS, servers: string[]): number {
  let availableRam = 0;
  for (const server of servers) {
    const serverRam = ns.getServerMaxRam(server);
    availableRam += serverRam;
  }
  return availableRam;
}

/**
 * Clamps a value between a specified minimum and maximum range.
 *
 * @param {number} min - The minimum allowable value.
 * @param {number} max - The maximum allowable value.
 * @param {number} val - The value to clamp.
 * @returns {number} - The clamped value.
 */
export function clamp(min: number, max: number, val: number): number {
  return Math.max(min, Math.min(max, val));
}
