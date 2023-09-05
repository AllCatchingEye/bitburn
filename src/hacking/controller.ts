import { NS, Server } from "@ns";
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

function createTask(target: Server, host: Server[], script: ScriptType, threads: number, delay: number = 0) {
  const task = {
    target: target,
    host: host,
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
  let nextNewPort = await prepareTarget(ns, hosts, target, 0);
  ns.print(`INFO Server is prepared`);

  while (true) {
    const [hackThreads, hackWeakenThreads, growThreads, growWeakenThreads] =
      getThreadsForAllScripts(ns, target);

    const [, growTime,] = getTimings(ns, target);

    // To negate the security increase by hack, weaken should be startet first
    // The rest can be startet simultanously because theiy execute after at different times
    const hackWeaken = createTask(target, hosts, ScriptType.Weaken, hackWeakenThreads, 0);
    const hack = createTask(target, hosts, ScriptType.Hack, hackThreads, growTime + 20);
    const grow = createTask(target, hosts, ScriptType.Grow, growThreads, growTime + 40);
    const growWeaken = createTask(target, hosts, ScriptType.Weaken, growWeakenThreads, growTime + 60);
    const tasks = [hack, hackWeaken, grow, growWeaken];

    tasks.forEach(task => {
      ns.run("hacking/worker.js", nextNewPort);
      ns.writePort(nextNewPort, JSON.stringify(task));
    })
    nextNewPort++;
  }
}

async function prepareTarget(ns: NS, hosts: Server[], target: Server, nextNewPort: number) {
  if (targetIsPrepared(target)) {
    return nextNewPort;
  }
  ns.print(`INFO Preparing target server...`);

  const [, , growThreads, weakenThreads] = getThreadsForAllScripts(ns, target);
  const growTime = ns.getGrowTime(target.hostname);
  const weakenTime = ns.getWeakenTime(target.hostname);

  const growTask = createTask(target, hosts, ScriptType.Grow, growThreads, growTime);
  const weakenTask = createTask(target, hosts, ScriptType.Weaken, weakenThreads, weakenTime);
  const tasks = [growTask, weakenTask];

  tasks.forEach(task => {
    ns.run("hacking/worker.js", nextNewPort);
    ns.writePort(nextNewPort, JSON.stringify(task));
    nextNewPort++;
  })
  return nextNewPort;
}

function targetIsPrepared(target: Server) {
  const targetHasMaxMoney = target.moneyAvailable === target.moneyMax;
  const targetHasMinSec = target.hackDifficulty === target.minDifficulty;
  return targetHasMaxMoney && targetHasMinSec;
}

