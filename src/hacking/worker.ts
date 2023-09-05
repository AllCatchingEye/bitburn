import { NetscriptPort, NS, PortData, Server } from "../../NetscriptDefinitions";
import { distributeScript } from "lib/batch-helper";
import { toNumber } from "lodash";
import { Batch } from "./controller";

export async function main(ns: NS): Promise<void> {
  const portNumber: number = toNumber(ns.args[0]);
  const port: NetscriptPort = ns.getPortHandle(portNumber);

  await port.nextWrite();
  const data: string = port.read() as string;
  const batch: Batch = JSON.parse(data);
  while (true) {
    runTasks(ns, batch);
  }
}

async function runTasks(ns: NS, batch: Batch) {
  distributeScript(ns, 'hacking/hack.js', batch.hosts, batch.hackThreads, batch.target.hostname);
  distributeScript(ns, 'hacking/weaken.js', batch.hosts, batch.hackWeakenThreads, batch.target.hostname);
  distributeScript(ns, 'hacking/grow.js', batch.hosts, batch.growThreads, batch.target.hostname);
  distributeScript(ns, 'hacking/weaken.js', batch.hosts, batch.growWeakenThreads, batch.target.hostname);
  await ns.sleep(5000);
}
