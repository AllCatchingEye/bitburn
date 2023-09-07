import { NS } from "../../NetscriptDefinitions";

export function calculateThreadAmount(
  ns: NS,
  script: string,
  hostname: string
): number {
  const scriptRamCost = ns.getScriptRam(script);
  const availableRamOnHost =
    ns.getServerMaxRam(hostname) - ns.getServerUsedRam(hostname);

  const threadAmount = Math.floor(availableRamOnHost / scriptRamCost);
  return threadAmount;
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

export function hackLevelEnough(ns: NS, hostname: string): boolean {
  const requiredHackingLevel = ns.getServerRequiredHackingLevel(hostname);
  const playerHackingLevel = ns.getHackingLevel();
  return playerHackingLevel >= requiredHackingLevel;
}

export function disableLogs(ns: NS, functionNames: string[]): void {
  functionNames.forEach((functionName) => {
    ns.disableLog(functionName);
  });
}
