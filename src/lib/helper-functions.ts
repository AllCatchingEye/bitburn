import { NS } from "../../NetscriptDefinitions";

export function getMaxPossibleThreads(ns: NS, scriptName: string, host: string) {
    const scriptRamCost = ns.getScriptRam(scriptName);
    const availableRamOnServer = (ns.getServerMaxRam(host) - ns.getServerUsedRam(host))

    const maxPossibleThreads = Math.floor(availableRamOnServer / scriptRamCost);

    return maxPossibleThreads;
}

export async function waitUntilScriptFinished(ns: NS, pid: number, sleepIntervall: number = 1000) {
    while (ns.isRunning(pid)) {
        await ns.sleep(sleepIntervall);
    }
}