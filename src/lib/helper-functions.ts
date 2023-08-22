import { NS } from "../../NetscriptDefinitions";

export function getMaxPossibleThreads(
  ns: NS,
  scriptName: string,
  host: string
): number {
  const scriptRamCost = ns.getScriptRam(scriptName);
  const availableRamOnServer =
    ns.getServerMaxRam(host) - ns.getServerUsedRam(host);

  const maxPossibleThreads = Math.floor(availableRamOnServer / scriptRamCost);
  return maxPossibleThreads;
}

export async function waitUntilScriptFinished(
  ns: NS,
  pid: number,
  sleepIntervall = 1000
): Promise<void> {
  while (ns.isRunning(pid)) {
    await ns.sleep(sleepIntervall);
  }
}

export function hackLevelEnough(ns: NS, server: string): boolean {
  const hackLevelRequired = ns.getServerRequiredHackingLevel(server);
  const hackLevel = ns.getHackingLevel();
  return hackLevel >= hackLevelRequired;
}

export function hasSufficientThreads(threadAmount: number): boolean {
  return threadAmount > 0;
}
