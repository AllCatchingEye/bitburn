import { log } from '@/logger/logger';
import { getRunnableServers } from '@/servers/server-search';
import { NS } from '@ns';
import { getAvailableRam } from '../utility/utility-functions';
import { Delays } from './delays';
import { Threads, getRamCostThreads, logThreads } from './threads';

/**
 * Interface representing a batch of operations including thread counts and delays.
 */
export interface Batch {
  threads: Threads;
  delays: Delays;
}

/**
 * Determines if there is enough available RAM to execute the given batch of operations.
 * Compares the available RAM to the RAM required for the batch.
 *
 * @param ns - The Netscript environment object provided by the game.
 * @param batch - The batch of operations to check.
 * @returns True if there is not enough RAM for the batch, otherwise false.
 */
export function batchHasEnoughRam(ns: NS, batch: Batch) {
  const servers = getRunnableServers(ns);
  const availableRam = getAvailableRam(ns, servers);
  const batchRamCost = getRamCostThreads(ns, batch.threads);
  return availableRam < batchRamCost;
}

/**
 * Resizes the batch of operations to fit within the available RAM.
 * Adjusts the number of threads for each operation based on the available RAM.
 *
 * @param ns - The Netscript environment object provided by the game.
 * @param threads - The initial thread counts for the batch.
 */
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
