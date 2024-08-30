import { NS } from '@ns';
import { Batch } from './batch';
import { HACK_SCRIPT_PATH, GROW_SCRIPT_PATH, WEAKEN_SCRIPT_PATH } from '../utility/utility-functions';
import { log } from '@/logger/logger';
import { Simulation } from './simulation';
import { Job } from './controller';

export class Deployer {
  ns: NS;
  target: string;
  simulation: Simulation;
  delay: number;

  constructor(ns: NS, target: string, delay: number) {
    this.ns = ns;
    this.target = target;
    this.delay = delay;
    this.simulation = new Simulation(this.ns, target, this.delay);
  }

  changeTarget(target: string) {
    this.target = target;
    this.simulation = new Simulation(this.ns, target, this.delay);
  }

  executeBatch(batch: Batch, pidServerMap: Map<string, number>) {
    this.deployScript(pidServerMap, WEAKEN_SCRIPT_PATH, batch.threads.weakenHack, 0);
    this.deployScript(pidServerMap, WEAKEN_SCRIPT_PATH, batch.threads.weakenGrow, batch.delays.weaken);
    this.deployScript(pidServerMap, GROW_SCRIPT_PATH, batch.threads.grow, batch.delays.grow);
    this.deployScript(pidServerMap, HACK_SCRIPT_PATH, batch.threads.hack, batch.delays.hack);

    this.simulation.calculateEffects(batch.threads);
  }

  deployScript(pids: Map<string, number>, script: string, threads: number, delay: number) {
    for (const [server, pid] of pids.entries()) {
      const threadsToRun = this.calculateThreadsToRun(script, server, threads);
      if (threadsToRun > 0) {
        const job: Job = {
          script: script,
          target: this.target,
          threads: threads,
          delay: delay,
        };
        this.sendJob(pid, job);
      }

      threads -= threadsToRun;
    }
  }

  calculateThreadsToRun(script: string, server: string, threads: number) {
    const scriptRamCost = this.ns.getScriptRam(script);
    const availableRam: number = this.ns.getServerMaxRam(server) - this.ns.getServerUsedRam(server);

    const runnableThreads = Math.floor(availableRam / scriptRamCost);
    const threadsToRun = Math.min(runnableThreads, threads);
    return threadsToRun;
  }

  sendJob(pid: number, job: Job) {
    const port = this.ns.getPortHandle(pid);
    const data = JSON.stringify(job);
    port.write(data);

    //log(this.ns, 'deployer.txt', `Send data: \n${data}\n`, 'a');
  }
}
