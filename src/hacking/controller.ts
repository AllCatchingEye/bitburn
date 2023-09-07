import { NetscriptPort, NS, Server } from "@ns"
import { Task, createBatch } from "/hacking/task";
import { getUsableHosts, waitTillEnoughRamAvailable } from "/lib/batch-helper";
import { mostProfitableServer } from "/lib/profit-functions";
import { disableLogs } from "/lib/helper-functions";
import { hackingLog, HackLogType } from "./logger";

export interface Controller {
  target: Server,
  targetIsPrepared: boolean,
  hosts: Server[],
  portIndex: number,
  ports: NetscriptPort[],
  spacer: number
}

export async function main(ns: NS): Promise<void> {
  const functionNames: string[] = ['getServerMaxRam'];
  disableLogs(ns, functionNames);

  hackingLog(ns, HackLogType.start);

  const controller: Controller = await init(ns);
  await deploy(ns, controller);
}

async function init(ns: NS): Promise<Controller> {
  const target: Server = ns.getServer(mostProfitableServer(ns));
  const hosts: Server[] = getUsableHosts(ns);
  const controller: Controller = {
    target: target,
    targetIsPrepared: targetIsPrepared(target),
    hosts: hosts,
    portIndex: 1,
    ports: [],
    spacer: 20,
  };

  await prepareTarget(ns, controller);
  await hackingLog(ns, HackLogType.prepared, controller.target.hostname);

  return controller;
}

async function prepareTarget(ns: NS, controller: Controller): Promise<void> {
  if (targetIsPrepared(controller.target)) {
    return;
  }
  await hackingLog(ns, HackLogType.prepare, controller.target.hostname);

  const tasks: Task[] = createBatch(ns, controller);
  const prepTasks: Task[] = tasks.slice(2);

  await waitTillEnoughRamAvailable(ns, prepTasks);
  await dispatchWorkers(ns, prepTasks, controller);

  const prepTime: number = ns.getWeakenTime(controller.target.hostname) + controller.spacer;
  await ns.sleep(prepTime);
}

function targetIsPrepared(target: Server): boolean {
  const targetHasMaxMoney: boolean = target.moneyAvailable === target.moneyMax;
  const targetHasMinSec: boolean = target.hackDifficulty === target.minDifficulty;
  return targetHasMaxMoney && targetHasMinSec;
}

async function deploy(ns: NS, controller: Controller): Promise<void> {
  while (true) {
    await hackingLog(ns, HackLogType.newDeployment);
    controller.hosts = getUsableHosts(ns);

    const tasks: Task[] = createBatch(ns, controller);
    await waitTillEnoughRamAvailable(ns, tasks);
    await dispatchWorkers(ns, tasks, controller);

    const prepTime: number = ns.getWeakenTime(controller.target.hostname) + controller.spacer * 2;
    await ns.sleep(prepTime);
  }
}

async function dispatchWorkers(ns: NS, tasks: Task[], controller: Controller): Promise<void> {
  for (const task of tasks) {
    ns.run("hacking/tWorker.js", 1, controller.portIndex);
    await hackingLog(ns, HackLogType.dispatch, controller.portIndex);

    sendTask(ns, task, controller);
  }
}

async function sendTask(ns: NS, task: Task, controller: Controller): Promise<void> {
  const port: NetscriptPort = ns.getPortHandle(controller.portIndex);
  port.clear();

  const data: string = JSON.stringify(task);
  await port.write(data);
  hackingLog(ns, HackLogType.sendTask, controller.portIndex);

  controller.ports.push(port);
  controller.portIndex++;

}
