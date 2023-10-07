import { NS, Server } from "@ns";
import { Deployment } from "/hacking/deployment";
import { Task } from "/hacking/task";
import { hackingScripts } from "/scripts/Scripts";

export interface Target {
  /** Provides access to Netscript functions */
  ns: NS;

  server: Server;

  name: string;

  /** How much money currently resides on the server and can be hacked */
  moneyAvailable: number;

  /** Maximum amount of money that this server can hold */
  moneyMax: number;

  /** Server Security Level */
  hackDifficulty: number;

  /** Minimum server security level that this server can be weakened to */
  minDifficulty: number;

  updateJob(job: Deployment): void;
  hackUpdate(threads: number): void;
  weakenUpdate(threads: number): void;
  growUpdate(threads: number): void;

  calculateGrowPercent(threads: number): number;
  complicatedFormula(threads: number): number;
  simpleFormula(threads: number): number;

  isPrepped(): boolean;
  moneyIsPrepped(): boolean;
  secIsPrepped(): boolean;
}

export class Target implements Target {
  constructor(ns: NS, server: Server) {
    this.ns = ns;
    this.server = server;
    this.name = server.hostname;
    this.moneyAvailable = server.moneyAvailable ?? 0;
    this.moneyMax = server.moneyMax ?? 0;
    this.hackDifficulty = server.hackDifficulty ?? 0;
    this.minDifficulty = server.minDifficulty ?? 0;
  }

  /**
   * Determines which type of update should be executed and executes it,
   * based on the script used in task
   * @param task - Task which was executed
   */
  update(task: Task): void {
    switch (task.script) {
      case hackingScripts.Hacking:
        this.hackUpdate(task.threads);
        break;
      case hackingScripts.Grow:
        this.growUpdate(task.threads);
        break;
      case hackingScripts.Weaken:
        this.weakenUpdate(task.threads);
        break;
      default:
        this.ns.print("WARN Unknown script type in task");
        break;
    }
  }

  /**
   * Updates money and security on the target,
   * after a hack script has been executed
   * @param threads - Amount of threads used by hack script
   */
  hackUpdate(threads: number): void {
    // update money
    const hackEffect = this.ns.hackAnalyze(this.server.hostname);
    const hackChance = this.ns.hackAnalyzeChance(this.server.hostname);
    const hackPercent = hackEffect * threads * hackChance;
    this.moneyAvailable = Math.max(
      this.moneyAvailable - this.moneyAvailable * hackPercent,
      0,
    );

    // update security
    const hackSecIncrease = this.ns.hackAnalyzeSecurity(
      threads,
      this.server.hostname,
    );
    this.hackDifficulty = Math.min(this.hackDifficulty + hackSecIncrease, 100); // Max amount of security is 100
  }

  /**
   * Updates security on the target,
   * after a weaken script has been executed
   * @param threads - Amount of threads used by weaken script
   */
  weakenUpdate(threads: number): void {
    const weakenSecDecrease = this.ns.weakenAnalyze(threads);

    // Security cant go below minimum
    this.hackDifficulty = Math.max(
      this.hackDifficulty - weakenSecDecrease,
      this.minDifficulty,
    );
  }

  /**
   * Updates money and security on the target,
   * after a grow script has been executed
   * @param threads - Amount of threads used by grow script
   */
  growUpdate(threads: number): void {
    // update money
    const growPercent = this.calculateGrowPercent(threads);
    this.moneyAvailable = Math.min(
      (this.moneyAvailable + 1) * (1 + growPercent),
      this.moneyMax,
    );

    // update security
    const growSecIncrease = this.ns.growthAnalyzeSecurity(
      threads,
      this.server.hostname,
    );
    this.hackDifficulty = Math.min(this.hackDifficulty + growSecIncrease, 100); // Max amount of security is 100
  }

  /**
   * Calculates the growPercent of a given grow Task
   * Chooses between Formulas based on if Formulas.exe is unlocked
   * @param threads - The amount of threads used for grow
   * @returns Returns the percent in decimal numbers
   */
  calculateGrowPercent(threads: number): number {
    let growPercent = 0;
    if (this.ns.fileExists("Formulas.exe", "home")) {
      growPercent = this.simpleFormula(threads);
    } else {
      growPercent = this.complicatedFormula(threads);
    }
    return growPercent / 100;
  }

  // Uses a more complitated Formula to calculate grow percent
  complicatedFormula(threads: number): number {
    const difficulty =
      this.ns.getServerSecurityLevel(this.server.hostname) / 100;
    const baseGrowth = Math.min(1 + 0.03 / difficulty, 1.0035); // Rate capped at 1.0035

    const serverGrowth = this.ns.getServerGrowth(this.server.hostname) / 100;
    const hackMultiplier = this.ns.getPlayer().mults.hacking_grow;
    const adjustedGrowth = serverGrowth * hackMultiplier;

    const growPercent = baseGrowth ** (adjustedGrowth * threads);
    return growPercent;
  }

  /**
   * Calculates the grow percent by using the by formulas provided function for it
   * @param threads - The amount of threads used for grow
   * @returns Grow percent in decimal by provided thread amount
   */
  simpleFormula(threads: number): number {
    const player = this.ns.getPlayer();
    const server = this.ns.getServer(this.server.hostname);
    const growPercent = this.ns.formulas.hacking.growPercent(
      server,
      threads,
      player,
    );

    return growPercent;
  }

  /**
   * Checks if the target is prepared for batching.
   * Its prepared if its money is at the maximum
   * and security at the minimum
   * @returns If the server is prepared for batching
   */
  isPrepped(): boolean {
    const moneyPrepped = this.moneyAvailableIsPrepped();
    const secPrepped = this.hackDifficultyIsPrepped();
    const isPrepped = moneyPrepped && secPrepped;

    return isPrepped;
  }

  /**
   * Checks if the money of the target lies at maximum for batching
   * @returns If the money is prepared
   */
  moneyAvailableIsPrepped(): boolean {
    const moneyIsPrepped = this.moneyAvailable === this.moneyMax;
    return moneyIsPrepped;
  }

  /**
   * Checks if the security of the target is a the minimum for batching
   * @returns If the security is prepared
   */
  hackDifficultyIsPrepped(): boolean {
    const secToFix = Math.abs(this.hackDifficulty - this.minDifficulty);

    const tolerance = 0.0001; // Fix for floating point accuracy
    const secIsPrepped = secToFix < tolerance;

    return secIsPrepped;
  }
}
