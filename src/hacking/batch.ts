import { NS, Server } from "@ns";
import { Target } from "/hacking/target";
import { Controller } from "/hacking/controller";
import { Task, createBatchTasks } from "/hacking/task";
import { getUsableHosts } from "/lib/searchServers";

export interface Batch {
  target: Target;
  hosts: Server[];
  tasks: Task[];
}

export function isBatch(job: Batch | Task): job is Batch {
  return (job as Batch).tasks !== undefined;
}

export function createBatch(ns: NS, controller: Controller): Batch {
  const tasks: Task[] = createBatchTasks(ns, controller);
  const batch: Batch = {
    target: controller.metrics.target,
    hosts: getUsableHosts(ns),
    tasks: tasks,
  };

  return batch;
}
