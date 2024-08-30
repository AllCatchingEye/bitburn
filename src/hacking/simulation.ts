import { NS, Player } from '@ns';
import { MockServer } from './mockServer';
import { Threads } from './threads';
import { planThreadsGrowBatch, planThreadsSecurityBatch, planThreadsNormalBatch, logThreads } from './threads';
import { getDelays } from './delays';
import { log } from '@/logger/logger';
import { Batch, batchHasEnoughRam, resizeBatch } from './batch';

/**
 * Handles the simulation of server hacking and growth operations.
 */
export class Simulation {
  ns: NS;
  baseDelay: number;
  player: Player;
  server: MockServer;

  /**
   * Constructs a Simulation instance.
   *
   * @param ns - The Netscript environment object.
   * @param serverName - The hostname of the server to simulate.
   * @param baseDelay - Base delay between operations.
   */
  constructor(ns: NS, serverName: string, baseDelay: number) {
    this.ns = ns;
    this.baseDelay = baseDelay;
    this.player = this.ns.getPlayer();
    this.server = new MockServer(ns, serverName);
  }

  /**
   * Determines the number of threads needed for a preparation batch.
   *
   * @returns The number of threads required for preparation.
   */
  getPrepThreads() {
    const threads = this.server.hasMinDifficulty
      ? planThreadsGrowBatch(this.ns, this)
      : planThreadsSecurityBatch(this.ns, this.server);
    return threads;
  }

  /**
   * Plans and returns a preparation batch for the server.
   *
   * @returns A Batch object containing the planned threads and delays.
   */
  planPrepBatch() {
    //log(this.ns, 'batcher.txt', '===== Prep Batch =====\n', 'a');

    const batch: Batch = {
      threads: this.getPrepThreads(),
      delays: getDelays(this.ns, this.baseDelay, this),
    };

    //logThreads(this.ns, batch.threads);

    if (batchHasEnoughRam(this.ns, batch)) {
      resizeBatch(this.ns, batch.threads);
    }

    return batch;
  }

  /**
   * Plans and returns a normal hacking batch based on the hack percentage.
   *
   * @param hackPercentage - The percentage of the server's money to hack.
   * @returns A Batch object containing the planned threads and delays.
   */
  planBatch(hackPercentage: number) {
    //log(this.ns, 'batcher.txt', '===== HWGW Batch =====\n', 'a');

    //this.server.logMoney();
    //this.server.logSecurity();

    const delays = getDelays(this.ns, this.baseDelay, this);

    const batch: Batch = {
      threads: planThreadsNormalBatch(this.ns, this, hackPercentage),
      delays: delays,
    };

    //logThreads(this.ns, batch.threads);

    return batch;
  }

  /**
   * Calculates the effects of a batch of threads on the server and player.
   *
   * @param threads - The Threads object representing the number of threads used.
   */
  calculateEffects(threads: Threads) {
    this.calculateServerEffects(threads);
    this.calculatePlayerEffects(threads);
  }

  /**
   * Calculates the effects of a batch of threads on the server.
   *
   * @param threads - The Threads object representing the number of threads used.
   */
  calculateServerEffects(threads: Threads) {
    this.calculateHackEffects(threads.hack);
    this.calculateWeakenEffects(threads.weakenHack);
    this.calculateGrowEffects(threads.grow);
    this.calculateWeakenEffects(threads.weakenGrow);

    //this.server.logMoney();
    //this.server.logSecurity();
  }

  /**
   * Calculates the effects of a batch of threads on the player.
   *
   * @param threads - The Threads object representing the number of threads used.
   */
  calculatePlayerEffects(threads: Threads) {
    if (this.player != undefined && this.ns.fileExists('Formulas.exe')) {
      let totalExpGain = 0;
      totalExpGain = this.calculateBatchExp(threads);

      this.player.exp.hacking + totalExpGain;
    }
  }

  /**
   * Calculates the total experience gained by the player from a batch of threads.
   *
   * @param threads - The Threads object representing the number of threads used.
   * @returns The total experience gained.
   */
  calculateBatchExp(threads: Threads) {
    const server = this.server;
    const singleThreadExp = this.ns.formulas.hacking.hackExp(server, this.player);

    const hackExp = threads.hack * singleThreadExp;
    const weakenHackExp = threads.weakenHack * singleThreadExp;
    const growExp = threads.grow * singleThreadExp;
    const weakenGrowExp = threads.weakenGrow * singleThreadExp;

    const totalExpGain = hackExp + weakenHackExp + growExp + weakenGrowExp;
    return totalExpGain;
  }

  /**
   * Calculates the effects of hack threads on the server.
   *
   * @param hackThreads - The number of hack threads.
   */
  calculateHackEffects(hackThreads: number) {
    const moneyDecrease = hackThreads * this.ns.hackAnalyze(this.server.hostname);
    const secIncrease = this.ns.hackAnalyzeSecurity(hackThreads);
    this.server.changeMoney(-moneyDecrease);
    this.server.changeSecurity(secIncrease);
  }

  /**
   * Calculates the effects of grow threads on the server.
   *
   * @param growThreads - The number of grow threads.
   */
  calculateGrowEffects(growThreads: number) {
    if (this.ns.fileExists('Formulas.exe')) {
      this.server.money = this.ns.formulas.hacking.growAmount(this.server, this.player, growThreads);
    } else {
      this.server.money = this.calculateGrowMoney(growThreads, this.server.cpuCores);
    }

    const secIncrease = this.server.getGrowthSecurityIncrease(this.ns, growThreads);
    this.server.changeSecurity(secIncrease);
  }

  /**
   * Calculates the increase in money due to grow threads.
   *
   * @param threads - The number of grow threads.
   * @param coreBonus - The core bonus multiplier (default is 1).
   * @returns The amount of money gained.
   */
  calculateGrowMoney(threads: number, coreBonus = 1) {
    const serverGrowth = this.ns.getServerGrowth(this.server.hostname);
    const hackingGrow = this.player.mults.hacking_grow;

    const moneyAvailable = this.server.moneyAvailable;
    const hackDifficulty = this.server.hackDifficulty;

    const moneyAfterDelta = Math.min(
      (moneyAvailable + threads) *
        Math.min(1 + 0.03 / hackDifficulty, 1.0035) ** (threads * (serverGrowth / 100) * hackingGrow * coreBonus * 1),
      this.server.moneyMax,
    );
    const moneyDelta = moneyAfterDelta - moneyAvailable;
    return moneyDelta;
  }

  /**
   * Calculates the effects of weaken threads on the server.
   *
   * @param weakenThreads - The number of weaken threads.
   */
  calculateWeakenEffects(weakenThreads: number) {
    const secDecrease = weakenThreads * this.ns.weakenAnalyze(1);
    this.server.changeSecurity(-secDecrease);
  }
}
