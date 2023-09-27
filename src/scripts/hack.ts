import { NS } from "../../NetscriptDefinitions";
import { Task } from "/hacking/task";

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

  await ns.hack(task.target.hostname, { additionalMsec: delay });
  //const end = Date.now();
}
