import { NetscriptPort, NS, Server } from "@ns"
import { Task, createBatch } from "./task";
import { getUsableHosts } from "lib/batch-helper";
import { mostProfitableServer } from "/lib/profit-functions";
import { disableLogs } from "/lib/helper-functions";

export interface Controller {
  target: Server,
  hosts: Server[],
  portIndex: number,
  ports: NetscriptPort[],
  spacer: number
}

export async function main(ns: NS): Promise<void> {
  const functionNames: string[] = ['getServerMaxRam', 'getServerUsedRam]'];
  disableLogs(ns, functionNames);

  const controller: Controller = await init(ns);
  await deploy(ns, controller);
}

async function init(ns: NS): Promise<Controller> {
  const controller = {
    target: ns.getServer(mostProfitableServer(ns)),
    hosts: getUsableHosts(ns),
    portIndex: 0,
    ports: [],
    spacer: 20,
  };

  await prepareTarget(ns, controller);
  ns.print(`INFO Server is prepared`);

  return controller;
}

async function prepareTarget(ns: NS, controller: Controller) {
  if (targetIsPrepared(controller.target)) {
    return;
  }
  ns.print(`INFO Preparing target server...`);

  const tasks: Task[] = createBatch(ns, controller);
  dispatchWorkers(ns, tasks, controller);

  const prepTime = ns.getWeakenTime(controller.target.hostname) + controller.spacer;
  await ns.sleep(prepTime);
}

function targetIsPrepared(target: Server): boolean {
  const targetHasMaxMoney = target.moneyAvailable === target.moneyMax;
  const targetHasMinSec = target.hackDifficulty === target.minDifficulty;
  return targetHasMaxMoney && targetHasMinSec;
}

async function deploy(ns: NS, controller: Controller) {
  while (true) {
    controller.hosts = getUsableHosts(ns);
    const tasks: Task[] = createBatch(ns, controller);
    dispatchWorkers(ns, tasks, controller);

    const prepTime = ns.getWeakenTime(controller.target.hostname) + controller.spacer * 2;
    await ns.sleep(prepTime);
  }
}

function dispatchWorkers(ns: NS, tasks: Task[], controller: Controller) {
  tasks.forEach(task => {
    ns.run("hacking/worker.js", 1, controller.portIndex);

    const port: NetscriptPort = ns.getPortHandle(controller.portIndex);
    controller.ports.push(port);
    controller.ports[controller.portIndex].write(JSON.stringify(task))
    controller.portIndex++;
  })
}
