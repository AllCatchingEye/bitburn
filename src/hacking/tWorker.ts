import { NetscriptPort, NS } from "../../NetscriptDefinitions";
import { toNumber } from "lodash";
import { Task } from "./task";
import { getMaxPossibleThreads } from "/lib/batch-helper";

export async function main(ns: NS): Promise<void> {
  const port: NetscriptPort = getPort(ns);
  const task: Task = await getTask(port);
  while (true) {
    runTask(ns, task);
  }
}

function getPort(ns: NS): NetscriptPort {
  const portNumber: number = toNumber(ns.args[0]);
  const port: NetscriptPort = ns.getPortHandle(portNumber);
  return port;
}

async function getTask(port: NetscriptPort) {
  await port.nextWrite();
  const data: string = port.read() as string;
  const task: Task = JSON.parse(data);
  return task;
}

function runTask(ns: NS, task: Task): void {
  task.hosts.forEach(host => {
    if (task.threads > 0) {
      startScripts(ns, host.hostname, task);
    }
  })
}

function startScripts(ns: NS, hostname: string, task: Task) {
  const runnableThreadsOnHost = calculateRunnableThreads(ns, task, hostname);
  ns.exec(task.script, hostname, runnableThreadsOnHost, task.delay);
  task.threads - runnableThreadsOnHost;
}

function calculateRunnableThreads(ns: NS, task: Task, hostname: string): number {
  const runnableThreadsOnHost = Math.min(getMaxPossibleThreads(ns, task.script, hostname), task.threads);
  return runnableThreadsOnHost;
}
