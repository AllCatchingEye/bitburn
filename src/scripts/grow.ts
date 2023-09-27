import { NS } from "../../NetscriptDefinitions";
import { Task } from "/hacking/task";

/**
 * Runs grow on the given target
 * @param {NS} ns - Mandatory to access netscript functions
 * @argument {string} target - Server name of the target
 */
export async function main(ns: NS): Promise<void> {
  const task: Task = JSON.parse(ns.args[0] as string);

  let delay = task.end - task.time - Date.now();
  if (delay < 0) {
    ns.writePort(
      task.loggerPid,
      `WARN: Batch ${task.batchId} ${task.script} was ${-delay}ms too late. (${
        task.end
      })\n`,
    );
    delay = 0;
  }

  await ns.grow(task.target.hostname, { additionalMsec: delay });
  //const end = Date.now();
}
