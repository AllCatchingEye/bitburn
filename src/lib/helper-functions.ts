import { NS, Server } from "../../NetscriptDefinitions";

export function calculateThreadAmount(
  ns: NS,
  script: string,
  hostname: string,
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
  sleepIntervall = 1000,
): Promise<void> {
  while (ns.isRunning(pid)) {
    await ns.sleep(sleepIntervall);
  }
}

export function disableLogs(ns: NS, functionNames: string[]): void {
  functionNames.forEach((functionName) => {
    ns.disableLog(functionName);
  });
}
