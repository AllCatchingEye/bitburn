import { NS } from "../../NetscriptDefinitions";

export enum HackLogType {
  start,
  prepare,
  prepared,
  newDeployment,
  dispatch,
  sendTask,
  receivedTask,
}

export async function hackingLog(ns: NS, logType: HackLogType, ...args: any): Promise<void> {
  switch (logType) {
    case HackLogType.start:
      await ns.write("log.txt", "Startet new controller\n", "w");
      break;
    case HackLogType.prepare:
      await ns.write("log.txt", `INFO Preparing target server ${args}...\n`, "a");
      break;
    case HackLogType.prepared:
      await ns.write("log.txt", `INFO Target ${args} is prepared\n`, "a");
      break;
    case HackLogType.newDeployment:
      await ns.write("log.txt", `Deploying new batch...`, "a");
      break;
    case HackLogType.dispatch:
      await ns.write("log.txt",
        `Giving worker on port ${args} task...\n`,
        "a");
      break;
    case HackLogType.sendTask:
      await ns.write("log.txt",
        `Send task to worker on port ${args}\n`,
        "a");
      break;
    case HackLogType.receivedTask:
      await ns.write("log.txt",
        `Worker on port ${args} received task from controller`,
        "a");
      break;
    default:
      break;
  }
}
