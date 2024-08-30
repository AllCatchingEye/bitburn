import { log } from '@/logger/logger';
import { clamp } from '@/utility/utility-functions';
import { NS, Server } from '@ns';

export interface MockServer extends Server {
  ns: NS;
  moneyAvailable: number;
  moneyMax: number;
  hackDifficulty: number;
  minDifficulty: number;

  changeMoney(moneyChange: number): void;
  changeSecurity(securityChange: number): void;
  logSecurity(): void;
  logMoney(): void;
  getCopy(): Server;
}

export class MockServer implements MockServer {
  constructor(ns: NS, hostname: string) {
    this.ns = ns;

    const originalServer = structuredClone(ns.getServer(hostname));
    Object.assign(this, originalServer);
  }

  getGrowthSecurityIncrease(ns: NS, threads: number) {
    const growthSecurityEffect = ns.growthAnalyzeSecurity(1);
    const securityIncrease = growthSecurityEffect * threads;
    return securityIncrease;
  }

  getHackSecurityIncrease(ns: NS, threads: number) {
    const hackSecurityEffect = ns.hackAnalyzeSecurity(1);
    const securityIncrease = hackSecurityEffect * threads;
    return securityIncrease;
  }

  changeMoney(moneyChange: number) {
    const newMoney = this.moneyAvailable + moneyChange;
    this.moneyAvailable = clamp(0, this.moneyAvailable, newMoney);
  }

  changeSecurity(securityChange: number) {
    const newDifficulty = this.hackDifficulty + securityChange;
    this.hackDifficulty = clamp(this.minDifficulty, 0, newDifficulty);
  }

  set money(money: number) {
    this.moneyAvailable = clamp(0, this.moneyMax, money);
  }

  set security(difficulty: number) {
    this.hackDifficulty = clamp(this.minDifficulty, 100, difficulty);
  }

  get isPrepped() {
    return this.hasMinDifficulty && this.hasMaxMoney;
  }

  get hasMinDifficulty() {
    const difficultyAtMin = this.hackDifficulty === this.minDifficulty;
    return difficultyAtMin;
  }

  get hasMaxMoney() {
    const availableMoney = this.moneyAvailable;
    const maxMoney = this.moneyMax;
    const hasMaxMoney = availableMoney == maxMoney;
    return hasMaxMoney;
  }

  get securityIncrease() {
    const securityIncrease = this.hackDifficulty - this.minDifficulty;
    return securityIncrease;
  }

  logSecurity() {
    log(this.ns, 'batcher.txt', `Min security of target ${this.minDifficulty}\n`, 'a');
    log(this.ns, 'batcher.txt', `Current security: ${this.hackDifficulty}\n`, 'a');
  }

  logMoney() {
    log(this.ns, 'batcher.txt', `Max money of target ${this.moneyMax}\n`, 'a');
    log(this.ns, 'batcher.txt', `Current money: ${this.moneyAvailable}\n`, 'a');
  }
}
