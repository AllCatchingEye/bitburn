import { NS } from '@ns';
import { Batch } from './batch';
import { HACK_SCRIPT_PATH, GROW_SCRIPT_PATH, WEAKEN_SCRIPT_PATH } from '../utility/utility-functions';
import { log } from '@/logger/logger';
import { Simulation } from './simulation';
import { Job } from './controller';

/**
 * The Deployer class manages the deployment of scripts to servers and handles the execution of batches.
 */
export class Deployer {
  ns: NS;
  target: string;        // The target server for the deployment
  simulation: Simulation; // The simulation object for the target server
  delay: number;         // The delay between script executions

  /**
   * Creates a new Deployer instance.
   *
   * @param ns - The Netscript environment object.
   * @param target - The target server for deployment.
   * @param delay - The delay between script executions.
   */
  constructor(ns: NS, target: string, delay: number) {
    this.ns = ns;
    this.target = target;
    this.delay = delay;
    this.simulation = new Simulation(this.ns, target, this.delay);
  }

  /**
   * Changes the target server and updates the simulation.
   *
   * @param target - The new target server.
   */
  changeTarget(target: string) {
    this.target = target;
    this.simulation = new Simulation(this.ns, target, this.delay);
  }

  /**
   * Executes a batch of scripts on the provided servers.
   *
   * @param batch - The batch of scripts to execute.
   * @param pidServerMap - A map of server to process ID for script execution.
   */
  executeBatch(batch: Batch, pidServerMap: Map<string, number>) {
    this.deployScript(pidServerMap, WEAKEN_SCRIPT_PATH, batch.threads.weakenHack, 0);
    this.deployScript(pidServerMap, WEAKEN_SCRIPT_PATH, batch.threads.weakenGrow, batch.delays.weaken);
    this.deployScript(pidServerMap, GROW_SCRIPT_PATH, batch.threads.grow, batch.delays.grow);
    this.deployScript(pidServerMap, HACK_SCRIPT_PATH, batch.threads.hack, batch.delays.hack);

    this.simulation.calculateEffects(batch.threads);
  }

  /**
   * Deploys a script to servers, managing the number of threads and delay.
   *
   * @param pids - A map of server to process ID for script execution.
   * @param script - The script to deploy.
   * @param threads - The number of threads to use.
   * @param delay - The delay before executing the script.
   */
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

  /**
   * Calculates the number of threads that can be run on a server given the script's RAM cost.
   *
   * @param script - The script to run.
   * @param server - The server to run the script on.
   * @param threads - The total number of threads required.
   * @returns The number of threads that can be run on the server.
   */
  calculateThreadsToRun(script: string, server: string, threads: number) {
    const scriptRamCost = this.ns.getScriptRam(script);
    const availableRam: number = this.ns.getServerMaxRam(server) - this.ns.getServerUsedRam(server);

    const runnableThreads = Math.floor(availableRam / scriptRamCost);
    const threadsToRun = Math.min(runnableThreads, threads);
    return threadsToRun;
  }

  /**
   * Sends a job to a specific server by writing to the port.
   *
   * @param pid - The process ID of the server.
   * @param job - The job details to send.
   */
  sendJob(pid: number, job: Job) {
    const port = this.ns.getPortHandle(pid);
    const data = JSON.stringify(job);
    port.write(data);

    //log(this.ns, 'deployer.txt', `Send data: \n${data}\n`, 'a');
  }
}
