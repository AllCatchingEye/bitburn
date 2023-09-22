import { NS } from "../../NetscriptDefinitions";
import { Task } from "/hacking/task";
import { calculateRunnableThreads } from "/lib/thread-utils";

export async function main(ns: NS): Promise<void> {
  const data: string = ns.args[0] as string;
  const task: Task = JSON.parse(data);

  await deployTasks(ns, task);
}

async function deployTasks(ns: NS, task: Task): Promise<void> {
  for (const host of task.hosts) {
    if (task.threads > 0) {
      startScript(ns, host.hostname, task);
    } else {
      break;
    }
  }
}

function startScript(ns: NS, hostname: string, task: Task): void {
  const runnableThreadsOnHost = calculateRunnableThreads(ns, task, hostname);
  if (runnableThreadsOnHost > 0) {
    ns.exec(
      task.script,
      hostname,
      runnableThreadsOnHost,
      task.target.hostname,
      task.delay,
    );
    task.threads = task.threads - runnableThreadsOnHost;
  }
}
