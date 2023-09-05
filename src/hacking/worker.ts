import { NetscriptPort, NS, PortData, Server } from "../../NetscriptDefinitions";
import { getUsableHosts, getGrowThreads, getWeakenThreads, distributeScript } from "lib/batch-helper";
import { toNumber } from "lodash";
import { Batch } from "./controller";

/**
 * Runs hack on the given batch.target
 * @param {NS} ns - Mandatory to access netscript functions
 * @argument {string} batch.target - Server name of the batch.target
 */
export async function main(ns: NS): Promise<void> {
  const portNumber: number = toNumber(ns.args[0]);
  const port: NetscriptPort = ns.getPortHandle(portNumber);

  await port.nextWrite();
  const data: string = port.read() as string;
  const batch: Batch = JSON.parse(data);

  while (true) {
    batch.hosts = getUsableHosts(ns);

    batch.hackThreads = Math.ceil(ns.hackAnalyzeThreads(batch.target.hostname, batch.target.moneyMax!));
    batch.hackWeakenThreads = getWeakenThreads(ns, "hacking/hack.js", batch.hackThreads, batch.target);

    batch.growThreads = getGrowThreads(ns, batch.target);
    batch.growWeakenThreads = getWeakenThreads(ns, "hacking/grow.js", batch.growThreads, batch.target);

    distributeScript(ns, 'hacking/hack.js', batch.hosts, batch.hackThreads, batch.target.hostname);
    distributeScript(ns, 'hacking/weaken.js', batch.hosts, batch.hackWeakenThreads, batch.target.hostname);
    distributeScript(ns, 'hacking/grow.js', batch.hosts, batch.growThreads, batch.target.hostname);
    distributeScript(ns, 'hacking/weaken.js', batch.hosts, batch.growWeakenThreads, batch.target.hostname);

    await ns.sleep(5000);
  }
}


