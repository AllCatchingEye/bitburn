import { NS } from "../../NetscriptDefinitions";
import { Task } from "/hacking/task";
import { log } from "/lib/misc";

export async function main(ns: NS): Promise<void> {
  const task: Task = JSON.parse(ns.args[0] as string);

  let delay = task.end - task.time - Date.now();
  delay = await checkIfOnTime(task, delay);

  await ns.hack(task.target.name, { additionalMsec: delay });
  //const end = Date.now();
}

async function checkIfOnTime(task: Task, delay: number) {
  if (delay < 0) {
    const message = `WARN: Batch ${task.id} ${
      task.script
    } was ${-delay}ms too late. (${task.end})\n`;

    await log(task.ns, message, task.loggerPid);
    return 0;
  } else {
    return delay;
  }
}
