import { NS, Player } from '@ns';
import { MockServer } from './mockServer';
import { Threads } from './threads';
import { planThreadsGrowBatch, planThreadsSecurityBatch, planThreadsNormalBatch, logThreads } from './threads';
import { getDelays } from './delays';
import { log } from '@/logger/logger';
import { Batch, batchHasEnoughRam, resizeBatch } from './batch';

export class Simulation {
  ns: NS;
  baseDelay: number;
  player: Player;
  server: MockServer;

  constructor(ns: NS, serverName: string, baseDelay: number) {
    this.ns = ns;
    this.baseDelay = baseDelay;
    this.player = this.ns.getPlayer();
    this.server = new MockServer(ns, serverName);
  }

  getPrepThreads() {
    const threads = this.server.hasMinDifficulty
      ? planThreadsGrowBatch(this.ns, this)
      : planThreadsSecurityBatch(this.ns, this.server);
    return threads;
  }

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

  calculateEffects(threads: Threads) {
    this.calculateServerEffects(threads);
    this.calculatePlayerEffects(threads);
  }

  calculateServerEffects(threads: Threads) {
    this.calculateHackEffects(threads.hack);
    this.calculateWeakenEffects(threads.weakenHack);
    this.calculateGrowEffects(threads.grow);
    this.calculateWeakenEffects(threads.weakenGrow);

    //this.server.logMoney();
    //this.server.logSecurity();
  }

  calculatePlayerEffects(threads: Threads) {
    if (this.player != undefined && this.ns.fileExists('Formulas.exe')) {
      let totalExpGain = 0;
      totalExpGain = this.calculateBatchExp(threads);

      this.player.exp.hacking + totalExpGain;
    }
  }

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

  calculateHackEffects(hackThreads: number) {
    const moneyDecrease = hackThreads * this.ns.hackAnalyze(this.server.hostname);
    const secIncrease = this.ns.hackAnalyzeSecurity(hackThreads);
    this.server.changeMoney(-moneyDecrease);
    this.server.changeSecurity(secIncrease);
  }

  calculateGrowEffects(growThreads: number) {
    if (this.ns.fileExists('Formulas.exe')) {
      this.server.money = this.ns.formulas.hacking.growAmount(this.server, this.player, growThreads);
    } else {
      this.server.money = this.calculateGrowMoney(growThreads, this.server.cpuCores);
    }

    const secIncrease = this.server.getGrowthSecurityIncrease(this.ns, growThreads);
    this.server.changeSecurity(secIncrease);
  }

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

  calculateWeakenEffects(weakenThreads: number) {
    const secDecrease = weakenThreads * this.ns.weakenAnalyze(1);
    this.server.changeSecurity(-secDecrease);
  }
}
