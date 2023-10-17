import { NS } from "../../NetscriptDefinitions";
import { Task } from "/hacking/task";
import { log } from "/lib/misc";

/**
 * Runs grow on the given target
 * @param {NS} ns - Mandatory to access netscript functions
 * @argument {string} target - Server name of the target
 */
export async function main(ns: NS): Promise<void> {
  const task: Task = JSON.parse(ns.args[0] as string);

  let delay = task.end - task.time - Date.now();
  delay = await checkIfOnTime(task, delay);

  await ns.grow(task.target.name, { additionalMsec: delay });
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
