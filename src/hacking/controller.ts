import { NetscriptPort, NS, Server } from "@ns"
import { getTimings, getUsableHosts, getThreadsForAllScripts } from "lib/batch-helper";
import { mostProfitableServer } from "/lib/profit-functions";

export enum ScriptType {
  Hack = 0,
  Grow = 1,
  Weaken = 2,
}

export interface Task {
  target: Server,
  hosts: Server[],
  script: ScriptType,
  threads: number,
  delay: number,
}

function createTask(target: Server, hosts: Server[], script: ScriptType,
  threads: number, delay: number = 0): Task {
  const task = {
    target: target,
    hosts: hosts,
    script: script,
    threads: threads,
    delay: delay,
  }
  return task;
}

export async function main(ns: NS): Promise<void> {
  ns.disableLog('getServerMaxRam');
  ns.disableLog('getServerUsedRam');
  await deploy(ns);
}

async function deploy(ns: NS) {
  const target = ns.getServer(mostProfitableServer(ns));
  let hosts: Server[] = getUsableHosts(ns);

  let nextNewPort: number = 0;
  let ports: NetscriptPort[] = [];
  [nextNewPort, ports] = prepareTarget(ns, hosts, target, nextNewPort, ports);
  ns.print(`INFO Server is prepared`);

  while (true) {
    const [hackThreads, hackWeakenThreads, growThreads, growWeakenThreads] =
      getThreadsForAllScripts(ns, target);

    const [, growTime,] = getTimings(ns, target);

    // To negate the security increase by hack, weaken should be startet first
    // The rest can be startet simultanously with a slight delay between them because they 
    // finish in order 
    const hackWeaken = createTask(target, hosts, ScriptType.Weaken, hackWeakenThreads, 0);
    const hack = createTask(target, hosts, ScriptType.Hack, hackThreads, growTime + 20);
    const grow = createTask(target, hosts, ScriptType.Grow, growThreads, growTime + 40);
    const growWeaken = createTask(target, hosts, ScriptType.Weaken, growWeakenThreads, growTime + 60);
    const tasks = [hack, hackWeaken, grow, growWeaken];

    [nextNewPort, ports] = deployWorkers(ns, tasks, nextNewPort, ports);

    await ns.sleep(growTime + 80);
  }
}

function prepareTarget(ns: NS, hosts: Server[], target: Server,
  nextNewPort: number, ports: NetscriptPort[]): [number, NetscriptPort[]] {
  if (targetIsPrepared(target)) {
    return [nextNewPort, ports];
  }
  ns.print(`INFO Preparing target server...`);

  const [, , growThreads, weakenThreads] = getThreadsForAllScripts(ns, target);
  const growTime = ns.getGrowTime(target.hostname);
  const weakenTime = ns.getWeakenTime(target.hostname);

  const growTask: Task = createTask(target, hosts, ScriptType.Grow, growThreads, growTime);
  const weakenTask: Task = createTask(target, hosts, ScriptType.Weaken, weakenThreads, weakenTime);
  const tasks: Task[] = [growTask, weakenTask];

  return deployWorkers(ns, tasks, nextNewPort, ports);
}

function deployWorkers(ns: NS, tasks: Task[], nextNewPort: number,
  ports: NetscriptPort[]): [number, NetscriptPort[]] {
  tasks.forEach(task => {
    ns.run("hacking/worker.js", 1, nextNewPort);
    const port: NetscriptPort = ns.getPortHandle(nextNewPort);
    ports.push(port);
    port.write(JSON.stringify(task))
    nextNewPort++;
  })
  return [nextNewPort, ports];
}

function targetIsPrepared(target: Server): boolean {
  const targetHasMaxMoney = target.moneyAvailable === target.moneyMax;
  const targetHasMinSec = target.hackDifficulty === target.minDifficulty;
  return targetHasMaxMoney && targetHasMinSec;
}

