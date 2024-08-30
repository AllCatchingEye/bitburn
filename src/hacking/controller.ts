import { NS } from '@ns';
import { getMostProfitableServer, getRunnableServers } from '../servers/server-search';
import { getAvailableRam, getTotalMaxRam } from '../utility/utility-functions';
import { Deployer } from './deployer';
import { Batch } from './batch';
import { log } from '@/logger/logger';
import { getRamCostThreads } from './threads';

export type Job = {
  script: string;
  target: string;
  threads: number;
  delay: number;
};

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

function getNextTarget(ns: NS, currentTarget: string) {
  const runnableServers = getRunnableServers(ns);
  const totalMaxRam = getTotalMaxRam(ns, runnableServers);
  const nextTarget = getMostProfitableServer(ns, runnableServers);

  //log(ns, 'batcher.txt', `Total ram available ${totalMaxRam}\n`, 'a');
  //log(ns, 'batcher.txt', `currentTarget target: ${currentTarget}\n`, 'a');
  //log(ns, 'batcher.txt', `Next target: ${nextTarget}\n`, 'a');

  return nextTarget;
}

function createBatch(hackPercentage: number, deployer: Deployer) {
  let batch;
  if (!deployer.simulation.server.isPrepped) {
    batch = deployer.simulation.planPrepBatch();
  } else {
    batch = deployer.simulation.planBatch(hackPercentage);
  }

  return batch;
}

function batchFits(ns: NS, batch: Batch) {
  const runnableServers = getRunnableServers(ns);
  const availableRam = getAvailableRam(ns, runnableServers);
  const batchRamCost = getRamCostThreads(ns, batch.threads);
  const batchFits = batchRamCost <= availableRam;

  //log(ns, 'batcher.txt', `Available ram: ${availableRam}\n`, 'a');
  //log(ns, 'batcher.txt', `Batch ram cost: ${batchRamCost}\n`, 'a');

  return batchFits;
}
