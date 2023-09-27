import { NS } from "@ns";
import { Target } from "/hacking/target";
import { Task, createTasks, createTask } from "/hacking/task";
import { Metrics } from "/hacking/metrics";
import { calculateRamCost } from "/lib/ram-helper";

export interface Job {
  target: Target;
  tasks: Task[] | Task;
  batchId: number;
  ramCost: number;
  end: number;
}

export function isBatch(tasks: Task[] | Task): tasks is Task[] {
  return (tasks as Task[]).length !== undefined;
}

export function createJob(
  ns: NS,
  metrics: Metrics,
  prep = false,
  script = "",
  threads = 0,
): Job {
  const batchId: number = metrics.batchId;

  let tasks: Task[] | Task;
  let end = 0;
  if (prep) {
    tasks = createTask(ns, metrics, batchId, script, threads);
    end = tasks.end;
  } else {
    tasks = createTasks(ns, metrics, batchId);
    end = tasks[3].end;
  }

  const ramCost = calculateRamCost(ns, tasks);

  const batch: Job = {
    target: metrics.target,
    tasks: tasks,
    batchId: batchId,
    ramCost: ramCost,
    end: end,
  };

  return batch;
}
