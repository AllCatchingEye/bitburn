import { log } from '@/logger/logger';
import { getRunnableServers } from '@/servers/server-search';
import { NS } from '@ns';
import { getAvailableRam } from '../utility/utility-functions';
import { Delays } from './delays';
import { Threads, getRamCostThreads, logThreads } from './threads';

export interface Batch {
  threads: Threads;
  delays: Delays;
}

export function batchHasEnoughRam(ns: NS, batch: Batch) {
  const servers = getRunnableServers(ns);
  const availableRam = getAvailableRam(ns, servers);
  const batchRamCost = getRamCostThreads(ns, batch.threads);
  return availableRam < batchRamCost;
}

export function resizeBatch(ns: NS, threads: Threads) {
  const servers = getRunnableServers(ns);
  const availableRam = getAvailableRam(ns, servers);
  const batchRamCost = getRamCostThreads(ns, threads);

  const resizePercent = availableRam / batchRamCost;
  //log(ns, 'Batcher.txt', `PrepBatch too big with ${batchRamCost}`, 'a');
  //log(ns, 'Batcher.txt', `Batch too big, reduce size of batch to ${resizePercent}\n`, 'a');

  threads.grow = Math.floor(threads.grow * resizePercent);
  threads.weakenGrow = Math.ceil(threads.weakenGrow * resizePercent);

  //logThreads(ns, threads);
}
