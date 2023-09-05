import { NetscriptPort, NS, Server } from "../../NetscriptDefinitions";
import { toNumber } from "lodash";
import { Task, ScriptType } from "./controller";
import { getMaxPossibleThreads } from "/lib/batch-helper";

export async function main(ns: NS): Promise<void> {
  const portNumber: number = toNumber(ns.args[0]);
  const port: NetscriptPort = ns.getPortHandle(portNumber);

  await port.nextWrite();
  const data: string = port.read() as string;
  const task: Task = JSON.parse(data);
  while (true) {
    const script = determineScript(task.script);
    task.hosts.forEach(host => {
      task.threads = startScripts(ns, script, host, task);
    })
  }
}

function startScripts(ns: NS, script: string, host: Server, task: Task) {
  let threadsLeft = task.threads;
  if (task.threads > 0) {
    const runnableThreadsOnHost = Math.min(getMaxPossibleThreads(ns, script, host.hostname), threadsLeft);

    ns.exec(script, host.hostname, threadsLeft, task.delay);
    threadsLeft -= runnableThreadsOnHost;
  }
  return threadsLeft;
}

function determineScript(scriptType: ScriptType) {
  let script = "";
  switch (scriptType) {
    case ScriptType.Hack:
      script = "hacking/hack.js";
      break;
    case ScriptType.Grow:
      script = "hacking/grow.js";
      break;
    case ScriptType.Weaken:
      script = "hacking/weaken.js";
      break;
    default:
      script = "unknown";
      break;
  }
  return script;
}
