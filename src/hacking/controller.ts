import { NS } from '@ns';
import { getMostProfitableServer, getRunnableServers } from '../servers/server-search';
import { getAvailableRam, getTotalMaxRam } from '../utility/utility-functions';
import { Deployer } from './deployer';
import { Batch } from './batch';
import { log } from '@/logger/logger';
import { getRamCostThreads } from './threads';

/**
 * Represents a job to be executed, including the script, target server, number of threads, and delay.
 */
export type Job = {
  script: string;
  target: string;
  threads: number;
  delay: number;
};

/**
 * Main entry point of the script.
 * Manages the deployment of batches to the most profitable server and handles target switching.
 *
 * @param ns - The Netscript environment object provided by the game.
 */
export async function main(ns: NS) {
  //log(ns, 'batcher.txt', 'Started controller\n', 'w');
  let target = getMostProfitableServer(ns, getRunnableServers(ns));
  const delay = 5;
  const deployer = new Deployer(ns, target, delay);

  while (true) {
    const pidServerMap = spawnWorkers(ns);

    const nextTarget = getNextTarget(ns, target);
    if (target != nextTarget) {
      //log(ns, 'batcher.txt', `Target changed, create new simulated server\n`, 'a');
      target = nextTarget;
      deployer.changeTarget(nextTarget);
    }

    const hackPercentage = 0.1;
    const batch = createBatch(hackPercentage, deployer);
    if (batchFits(ns, batch)) {
      deployer.executeBatch(batch, pidServerMap);
    }

    await ns.sleep(delay);
  }
}

/**
 * Starts worker scripts on all runnable servers and returns a map of server hostnames to process IDs.
 *
 * @param ns - The Netscript environment object provided by the game.
 * @returns A map where keys are server hostnames and values are the process IDs of the running worker scripts.
 */
function spawnWorkers(ns: NS) {
  const servers = getRunnableServers(ns);
  const pidServerMap = new Map<string, number>();

  for (const server of servers) {
    let pid;
    if (ns.isRunning('hacking/worker.js', server)) {
      const workerScript = ns.getRunningScript('hacking/worker.js', server);
      pid = workerScript?.pid;
    } else {
      pid = ns.exec('hacking/worker.js', server);
    }

    pid = pid ?? 0;
    if (pid != 0) pidServerMap.set(server, pid);
  }

  return pidServerMap;
}

/**
 * Determines the next target server based on profitability and total available RAM.
 *
 * @param ns - The Netscript environment object provided by the game.
 * @param currentTarget - The currently targeted server.
 * @returns The hostname of the next most profitable server.
 */
function getNextTarget(ns: NS, currentTarget: string) {
  const runnableServers = getRunnableServers(ns);
  const totalMaxRam = getTotalMaxRam(ns, runnableServers);
  const nextTarget = getMostProfitableServer(ns, runnableServers);

  //log(ns, 'batcher.txt', `Total ram available ${totalMaxRam}\n`, 'a');
  //log(ns, 'batcher.txt', `currentTarget target: ${currentTarget}\n`, 'a');
  //log(ns, 'batcher.txt', `Next target: ${nextTarget}\n`, 'a');

  return nextTarget;
}

/**
 * Creates a batch of operations based on the hack percentage and deployer state.
 *
 * @param hackPercentage - The percentage of hacking to perform in the batch.
 * @param deployer - The deployer instance responsible for planning the batch.
 * @returns The created batch of operations.
 */
function createBatch(hackPercentage: number, deployer: Deployer) {
  let batch;
  if (!deployer.simulation.server.isPrepped) {
    batch = deployer.simulation.planPrepBatch();
  } else {
    batch = deployer.simulation.planBatch(hackPercentage);
  }

  return batch;
}

/**
 * Checks if the batch of operations fits within the available RAM.
 *
 * @param ns - The Netscript environment object provided by the game.
 * @param batch - The batch of operations to check.
 * @returns True if the batch fits within the available RAM, otherwise false.
 */
function batchFits(ns: NS, batch: Batch) {
  const runnableServers = getRunnableServers(ns);
  const availableRam = getAvailableRam(ns, runnableServers);
  const batchRamCost = getRamCostThreads(ns, batch.threads);
  const batchFits = batchRamCost <= availableRam;

  //log(ns, 'batcher.txt', `Available ram: ${availableRam}\n`, 'a');
  //log(ns, 'batcher.txt', `Batch ram cost: ${batchRamCost}\n`, 'a');

  return batchFits;
}
