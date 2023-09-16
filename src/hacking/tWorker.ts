import { NetscriptPort, NS } from "../../NetscriptDefinitions";
import { hackingLog, HackLogType } from "/hacking/logger";
import { Task } from "/hacking/task";
import { getMaxPossibleThreads } from "/lib/thread-utils";

export async function main(ns: NS): Promise<void> {
  const [port, portNumber] = getPort(ns);
  const task: Task = await getTask(ns, port);
  await hackingLog(ns, HackLogType.receivedTask, portNumber);

  await deployTasks(ns, task, portNumber);
}

function getPort(ns: NS): [NetscriptPort, number] {
  const portNumber: number = (ns.args[0]) as number;
  const port: NetscriptPort = ns.getPortHandle(portNumber);
  return [port, portNumber];
}

async function getTask(ns: NS, port: NetscriptPort): Promise<Task> {
  while (port.empty()) {
    await ns.sleep(1000);
  }
  const data: string = port.read() as string;

  const task: Task = JSON.parse(data);
  return task;
}

async function deployTasks(ns: NS, task: Task, portNumber: number): Promise<void> {
  await hackingLog(ns, HackLogType.deployTasks, portNumber, task.script, task.threads);
  for (const host of task.hosts) {
    if (task.threads > 0) {
      startScript(ns, host.hostname, task);
    } else {
      break;
    }
  }
  await hackingLog(ns, HackLogType.tasksDeployed, portNumber);
}

function startScript(ns: NS, hostname: string, task: Task): void {
  const runnableThreadsOnHost = calculateRunnableThreads(ns, task, hostname);
  if (runnableThreadsOnHost > 0) {
    ns.exec(task.script, hostname, runnableThreadsOnHost, task.target.hostname, task.delay);
    task.threads = task.threads - runnableThreadsOnHost;
  }
}

function calculateRunnableThreads(ns: NS, task: Task, hostname: string): number {
  const runnableThreadsOnHost = Math.min(getMaxPossibleThreads(ns, task.script, hostname), task.threads);
  return runnableThreadsOnHost;
}
