import { log } from '@/logger/logger';
import { GROW_SCRIPT_PATH, HACK_SCRIPT_PATH, WEAKEN_SCRIPT_PATH } from '@/utility/utility-functions';
import { NS } from '@ns';
import { MockServer } from './mockServer';
import { Simulation } from './simulation';

enum BatchType {
  Security,
  Grow,
  Hack,
}

export type Threads = {
  hack: number;
  grow: number;
  weakenHack: number;
  weakenGrow: number;
};

/**
 * Creates a Threads object with the specified number of threads for each operation.
 *
 * @param weakenGrowThreads - Number of threads for weakening after grow operations.
 * @param growThreads - Number of threads for growth operations.
 * @param weakenHackThreads - Number of threads for weakening after hack operations.
 * @param hackThreads - Number of threads for hack operations.
 * @returns The Threads object.
 */
export function createThreads(weakenGrowThreads: number, growThreads = 0, weakenHackThreads = 0, hackThreads = 0) {
  const threads: Threads = {
    hack: hackThreads,
    grow: growThreads,
    weakenHack: weakenHackThreads,
    weakenGrow: weakenGrowThreads,
  };
  return threads;
}

/**
 * Plans the number of threads needed for a security batch.
 *
 * @param ns - The Netscript environment object.
 * @param server - The MockServer instance representing the target server.
 * @returns The Threads object for the security batch.
 */
export function planThreadsSecurityBatch(ns: NS, server: MockServer) {
  const weakenThreads = calculateWeakenThreads(ns, server, BatchType.Security);
  const threads = createThreads(weakenThreads);
  return threads;
}

/**
 * Plans the number of threads needed for a grow batch.
 *
 * @param ns - The Netscript environment object.
 * @param simulation - The Simulation instance.
 * @returns The Threads object for the grow batch.
 */
export function planThreadsGrowBatch(ns: NS, simulation: Simulation) {
  const growThreads = calculateGrowThreads(ns, simulation);
  const weakenThreads = calculateWeakenThreads(ns, simulation.server, BatchType.Grow, growThreads);
  const threads = createThreads(weakenThreads, growThreads);
  return threads;
}

/**
 * Plans the number of threads needed for a normal batch, including hacking, growing, and weakening.
 *
 * @param ns - The Netscript environment object.
 * @param simulation - The Simulation instance.
 * @param hackPercentage - The percentage of the server's money to hack.
 * @returns The Threads object for the normal batch.
 */
export function planThreadsNormalBatch(ns: NS, simulation: Simulation, hackPercentage: number) {
  const hackThreads = calculateHackThreads(ns, hackPercentage, simulation.server);
  const hackWeakenThreads = calculateWeakenThreads(ns, simulation.server, BatchType.Hack, hackThreads);

  const growThreads = calculateGrowThreads(ns, simulation, hackPercentage);
  const growWeakenThreads = calculateWeakenThreads(ns, simulation.server, BatchType.Grow, growThreads);

  const threads = createThreads(growWeakenThreads, growThreads, hackWeakenThreads, hackThreads);
  return threads;
}

/**
 * Calculates the number of threads needed for hacking based on the desired hack percentage.
 *
 * @param ns - The Netscript environment object.
 * @param hackPercentage - The percentage of the server's money to hack.
 * @param server - The MockServer instance representing the target server.
 * @returns The number of hack threads needed.
 */
export function calculateHackThreads(ns: NS, hackPercentage: number, server: MockServer) {
  const hackEffect = ns.hackAnalyze(server.hostname);
  const hackThreads = Math.floor(hackPercentage / hackEffect);
  return hackThreads;
}

/**
 * Calculates the number of threads needed for growth based on the hack percentage and simulation state.
 *
 * @param ns - The Netscript environment object.
 * @param simulation - The Simulation instance.
 * @param hackPercentage - The percentage of the server's money to hack.
 * @returns The number of grow threads needed.
 */
export function calculateGrowThreads(ns: NS, simulation: Simulation, hackPercentage = 0) {
  if (ns.fileExists('Formulas.exe')) {
    return calculateGrowThreadsSimulated(ns, simulation, hackPercentage);
  } else {
    return calculateGrowThreadsNormal(ns, simulation.server, hackPercentage);
  }
}

/**
 * Calculates the number of grow threads using simulated formulas.
 *
 * @param ns - The Netscript environment object.
 * @param simulation - The Simulation instance.
 * @param hackPercentage - The percentage of the server's money to hack.
 * @returns The number of grow threads needed.
 */
function calculateGrowThreadsSimulated(ns: NS, simulation: Simulation, hackPercentage: number) {
  const serverCopy = ns.getServer(simulation.server.hostname);
  const hackAmount = simulation.server.moneyAvailable * hackPercentage;
  serverCopy.moneyAvailable = simulation.server.moneyAvailable - hackAmount;

  const growThreads = ns.formulas.hacking.growThreads(serverCopy, simulation.player, simulation.server.moneyMax);
  return growThreads;
}

/**
 * Calculates the number of grow threads using normal formulas.
 *
 * @param ns - The Netscript environment object.
 * @param server - The MockServer instance representing the target server.
 * @param hackPercentage - The percentage of the server's money to hack.
 * @returns The number of grow threads needed.
 */
function calculateGrowThreadsNormal(ns: NS, server: MockServer, hackPercentage: number) {
  const hackAmount = server.moneyAvailable * hackPercentage;
  const postHackMoney = Math.max(1, server.moneyAvailable - hackAmount);
  const growMultiplicator = server.moneyMax / postHackMoney;
  //log(ns, 'batcher.txt', `Grow multiplicator calculated: ${growMultiplicator}\n`, 'a');

  const growThreads = Math.ceil(ns.growthAnalyze(server.hostname, growMultiplicator));
  return growThreads;
}

/**
 * Calculates the number of weaken threads needed based on the batch type and number of threads.
 *
 * @param ns - The Netscript environment object.
 * @param server - The MockServer instance representing the target server.
 * @param batchType - The type of batch (Security, Grow, Hack).
 * @param threads - The number of threads (default is 0).
 * @returns The number of weaken threads needed.
 */
function calculateWeakenThreads(ns: NS, server: MockServer, batchType: BatchType, threads = 0) {
  const weakenEffect = ns.weakenAnalyze(1);
  let securityIncrease = 0;

  switch (batchType) {
    case BatchType.Security:
      securityIncrease = server.securityIncrease;
      break;
    case BatchType.Grow:
      securityIncrease = server.getGrowthSecurityIncrease(ns, threads);
      break;
    case BatchType.Hack:
      securityIncrease = server.getHackSecurityIncrease(ns, threads);
      break;
    default:
      break;
  }

  const weakenThreads = Math.ceil(securityIncrease / weakenEffect);
  return weakenThreads;
}

/**
 * Calculates the total RAM cost for running a batch of threads.
 *
 * @param ns - The Netscript environment object.
 * @param threads - The Threads object representing the number of threads for each operation.
 * @returns The total RAM cost.
 */
export function getRamCostThreads(ns: NS, threads: Threads) {
  const hackRamCost = threads.hack * ns.getScriptRam(HACK_SCRIPT_PATH);
  const growRamCost = threads.grow * ns.getScriptRam(GROW_SCRIPT_PATH);
  const weaken1RamCost = threads.weakenHack * ns.getScriptRam(WEAKEN_SCRIPT_PATH);
  const weaken2RamCost = threads.weakenGrow * ns.getScriptRam(WEAKEN_SCRIPT_PATH);

  const batchRamCost = hackRamCost + weaken1RamCost + growRamCost + weaken2RamCost;
  return batchRamCost;
}

/**
 * Logs the number of threads used for each operation.
 *
 * @param ns - The Netscript environment object.
 * @param threads - The Threads object representing the number of threads for each operation.
 */
export function logThreads(ns: NS, threads: Threads) {
  log(ns, 'batcher.txt', `Hack threads calculated: ${threads.hack}\n`, 'a');
  log(ns, 'batcher.txt', `Hack weaken threads calculated: ${threads.weakenHack}\n`, 'a');
  log(ns, 'batcher.txt', `Grow threads calculated: ${threads.grow}\n`, 'a');
  log(ns, 'batcher.txt', `Grow weaken threads calculated: ${threads.weakenGrow}\n`, 'a');
}
