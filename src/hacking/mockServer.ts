import { log } from '@/logger/logger';
import { clamp } from '@/utility/utility-functions';
import { NS, Server } from '@ns';

/**
 * Extends the basic Server interface with additional properties and methods
 * for simulating server behavior in tests or simulations.
 */
export interface MockServer extends Server {
  ns: NS;
  moneyAvailable: number;
  moneyMax: number;
  hackDifficulty: number;
  minDifficulty: number;

  /**
   * Changes the amount of money available on the server.
   *
   * @param moneyChange - The amount to change the money by (can be positive or negative).
   */
  changeMoney(moneyChange: number): void;

  /**
   * Changes the security level of the server.
   *
   * @param securityChange - The amount to change the security level by (can be positive or negative).
   */
  changeSecurity(securityChange: number): void;

  /**
   * Logs the current and minimum security levels of the server.
   */

  logSecurity(): void;

  /**
   * Logs the current amount and maximum amount of money available on the server.
   */
  logMoney(): void;

  /**
   * Creates a copy of the current server state.
   *
   * @returns A copy of the server object.
   */
  getCopy(): Server;
}

/**
 * MockServer class for simulating server behavior in tests or simulations.
 */
export class MockServer implements MockServer {

  /**
   * Constructs a MockServer instance, initializing with data from the actual server.
   *
   * @param ns - The Netscript environment object.
   * @param hostname - The hostname of the server to mock.
   */
  constructor(ns: NS, hostname: string) {
    this.ns = ns;

    const originalServer = structuredClone(ns.getServer(hostname));
    Object.assign(this, originalServer);
  }

  /**
   * Calculates the increase in security due to a specified number of growth threads.
   *
   * @param ns - The Netscript environment object.
   * @param threads - The number of growth threads.
   * @returns The increase in security.
   */
  getGrowthSecurityIncrease(ns: NS, threads: number) {
    const growthSecurityEffect = ns.growthAnalyzeSecurity(1);
    const securityIncrease = growthSecurityEffect * threads;
    return securityIncrease;
  }

  /**
   * Calculates the increase in security due to a specified number of hack threads.
   *
   * @param ns - The Netscript environment object.
   * @param threads - The number of hack threads.
   * @returns The increase in security.
   */
  getHackSecurityIncrease(ns: NS, threads: number) {
    const hackSecurityEffect = ns.hackAnalyzeSecurity(1);
    const securityIncrease = hackSecurityEffect * threads;
    return securityIncrease;
  }

  /**
   * Changes the amount of money available on the server.
   *
   * @param moneyChange - The amount to change the money by (can be positive or negative).
   */
  changeMoney(moneyChange: number) {
    const newMoney = this.moneyAvailable + moneyChange;
    this.moneyAvailable = clamp(0, this.moneyAvailable, newMoney);
  }

  /**
   * Changes the security level of the server.
   *
   * @param securityChange - The amount to change the security level by (can be positive or negative).
   */
  changeSecurity(securityChange: number) {
    const newDifficulty = this.hackDifficulty + securityChange;
    this.hackDifficulty = clamp(this.minDifficulty, 0, newDifficulty);
  }

  /**
   * Sets the money available on the server, clamping it between 0 and the maximum money.
   *
   * @param money - The amount of money to set.
   */
  set money(money: number) {
    this.moneyAvailable = clamp(0, this.moneyMax, money);
  }

  /**
   * Sets the security difficulty of the server, clamping it between the minimum difficulty and 100.
   *
   * @param difficulty - The security difficulty to set.
   */
  set security(difficulty: number) {
    this.hackDifficulty = clamp(this.minDifficulty, 100, difficulty);
  }

  /**
   * Checks if the server is fully prepared, i.e., has minimum difficulty and maximum money.
   *
   * @returns True if the server is prepped, otherwise false.
   */
  get isPrepped() {
    return this.hasMinDifficulty && this.hasMaxMoney;
  }

  /**
   * Checks if the server's security is at its minimum value.
   *
   * @returns True if the security is at its minimum, otherwise false.
   */
  get hasMinDifficulty() {
    const difficultyAtMin = this.hackDifficulty === this.minDifficulty;
    return difficultyAtMin;
  }

  /**
   * Checks if the server's money is at its maximum value.
   *
   * @returns True if the money is at its maximum, otherwise false.
   */
  get hasMaxMoney() {
    const availableMoney = this.moneyAvailable;
    const maxMoney = this.moneyMax;
    const hasMaxMoney = availableMoney == maxMoney;
    return hasMaxMoney;
  }

  /**
   * Calculates the increase in security from the server's minimum difficulty to its current difficulty.
   *
   * @returns The increase in security.
   */
  get securityIncrease() {
    const securityIncrease = this.hackDifficulty - this.minDifficulty;
    return securityIncrease;
  }

  /**
   * Logs the current and minimum security levels of the server to a file.
   */
  logSecurity() {
    log(this.ns, 'batcher.txt', `Min security of target ${this.minDifficulty}\n`, 'a');
    log(this.ns, 'batcher.txt', `Current security: ${this.hackDifficulty}\n`, 'a');
  }

  /**
   * Logs the current and maximum money available on the server to a file.
   */
  logMoney() {
    log(this.ns, 'batcher.txt', `Max money of target ${this.moneyMax}\n`, 'a');
    log(this.ns, 'batcher.txt', `Current money: ${this.moneyAvailable}\n`, 'a');
  }
}
