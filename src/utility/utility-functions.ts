import { NS } from '@ns';

export const HACK_SCRIPT_PATH = 'hackScripts/hack.js';
export const GROW_SCRIPT_PATH = 'hackScripts/grow.js';
export const WEAKEN_SCRIPT_PATH = 'hackScripts/weaken.js';

export function canHack(ns: NS, server: string) {
  return ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(server);
}

export function getAvailableRam(ns: NS, servers: string[]): number {
  let availableRam = 0;
  for (const server of servers) {
    const serverRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
    const serverUsableRam = serverRam - (serverRam % ns.getScriptRam(WEAKEN_SCRIPT_PATH));
    availableRam += serverUsableRam;
  }
  return availableRam;
}

export function getTotalMaxRam(ns: NS, servers: string[]): number {
  let availableRam = 0;
  for (const server of servers) {
    const serverRam = ns.getServerMaxRam(server);
    availableRam += serverRam;
  }
  return availableRam;
}

export function clamp(min: number, max: number, val: number): number {
  return Math.max(min, Math.min(max, val));
}
