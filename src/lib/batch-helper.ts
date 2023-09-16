import { NS } from "@ns";
import { getMaxPossibleThreads } from "./thread-utils";


export enum Scripts {
  Hacking = "/hacking/hack.js",
  Grow = "/hacking/grow.js",
  Weaken = "/hacking/weaken.js",
}

export function distributeScript(ns: NS, script: string,
  hosts: string[], threads: number, target: string) {

  let threadsLeft = threads;
  hosts.forEach(host => {
    threadsLeft = execute(ns, script, host, threadsLeft, target);
  })
}

function execute(ns: NS, script: string, host: string, threads: number, target: string) {
  const maxPossibleThreads = getMaxPossibleThreads(ns, script, host);
  const runnableThreads = Math.floor(Math.min(threads, maxPossibleThreads));

  if (runnableThreads > 0) {
    ns.exec(script, host, runnableThreads, target);
    ns.print(`INFO Starting ${script} ${runnableThreads} times on ${host} for ${target}`);
  }

  return Math.floor(threads) - runnableThreads;
}

