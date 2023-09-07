import { NetscriptPort, NS } from "../../NetscriptDefinitions";
import { hackingLog, HackLogType } from "./logger";
import { Task } from "/hacking/task";
import { getMaxPossibleThreads } from "/lib/batch-helper";

export async function main(ns: NS): Promise<void> {
  const [port, portNumber] = getPort(ns);
  const task: Task = await getTask(port);
  await hackingLog(ns, HackLogType.receivedTask, portNumber);

  runTask(ns, task);
}

function getPort(ns: NS): [NetscriptPort, number] {
  const portNumber: number = (ns.args[0]) as number;
  const port: NetscriptPort = ns.getPortHandle(portNumber);
  return [port, portNumber];
}

async function getTask(port: NetscriptPort): Promise<Task> {
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

function startScripts(ns: NS, hostname: string, task: Task): void {
  const runnableThreadsOnHost = calculateRunnableThreads(ns, task, hostname);
  ns.exec(task.script, hostname, runnableThreadsOnHost, task.target.hostname, task.delay);
  task.threads - runnableThreadsOnHost;
}

function calculateRunnableThreads(ns: NS, task: Task, hostname: string): number {
  const runnableThreadsOnHost = Math.min(getMaxPossibleThreads(ns, task.script, hostname), task.threads);
  return runnableThreadsOnHost;
}
