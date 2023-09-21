import { NS, Player, Server } from "@ns";
import { getMostProfitableServer } from "/lib/profit-functions";
import { Scripts } from "/Scripts";

export class Target {
  ns: NS;
  server: Server;
  player: Player;
  minSec: number;
  sec: number;
  maxMoney: number;
  money: number;

  constructor(ns: NS, server: Server) {
    this.ns = ns;
    this.server = server;
    this.player = this.ns.getPlayer();
    this.minSec = this.ns.getServerMinSecurityLevel(this.server.hostname);
    this.sec = this.ns.getServerSecurityLevel(this.server.hostname);
    this.money = this.ns.getServerMoneyAvailable(this.server.hostname);
    this.maxMoney = this.ns.getServerMaxMoney(this.server.hostname);
  }

  update(script: Scripts, threads: number): void {
    this.determineUpdateTypeOf(script, threads);
  }

  checkForNewTarget(): boolean {
    const mostProfitableServer: Server = getMostProfitableServer(this.ns);
    if (this.changed(mostProfitableServer)) {
      this.switchTarget(mostProfitableServer);
      return true;
    }
    return false;
  }

  changed(newTarget: Server): boolean {
    const targetChanged = this.server.hostname != newTarget.hostname;
    return targetChanged;
  }

  switchTarget(newTarget: Server): void {
    this.server = newTarget;
    this.minSec = this.server.minDifficulty ?? 0;
    this.sec = this.server.hackDifficulty ?? 0;
    this.maxMoney = this.server.moneyMax ?? 0;
    this.money = this.server.moneyAvailable ?? 0;
  }

  determineUpdateTypeOf(script: Scripts, threads: number): void {
    switch (script) {
      case Scripts.Hacking:
        this.hackUpdate(threads);
        break;
      case Scripts.Grow:
        this.growUpdate(threads);
        break;
      case Scripts.Weaken:
        this.weakenUpdate(threads);
        break;
      default:
        this.ns.print("WARN Unknown script type in task");
        break;
    }
  }

  hackUpdate(threads: number): void {
    // update money
    const hackEffect = this.ns.hackAnalyze(this.server.hostname);
    const hackChance = this.ns.hackAnalyzeChance(this.server.hostname);
    const hackPercent = hackEffect * threads * hackChance;
    this.money = Math.max(this.money - this.money * hackPercent, 0);

    // update security
    const hackSecIncrease = this.ns.hackAnalyzeSecurity(
      threads,
      this.server.hostname,
    );
    this.sec = Math.min(this.sec + hackSecIncrease, 100); // Max amount of security is 100
  }

  calculateHackExpGain(): number {
    const baseDifficulty = this.ns.getServerBaseSecurityLevel(
      this.server.hostname,
    );
    const baseExpGain = 3;
    const diffFactor = 0.3;

    let expGain = baseExpGain;
    expGain += baseDifficulty * diffFactor;
    expGain = expGain * this.player.mults.hacking_exp;

    return expGain;
  }

  weakenUpdate(threads: number): void {
    const weakenSecDecrease = this.ns.weakenAnalyze(threads);

    // Security cant go below minimum
    this.sec = Math.max(this.sec - weakenSecDecrease, this.minSec);
  }

  growUpdate(threads: number): void {
    // update money
    const growPercent = this.calculateGrowPercent(threads);
    this.money = Math.min((this.money + 1) * (1 + growPercent), this.maxMoney);

    // update security
    const growSecIncrease = this.ns.growthAnalyzeSecurity(
      threads,
      this.server.hostname,
    );
    this.sec = Math.min(this.sec + growSecIncrease, 100); // Max amount of security is 100
  }

  // Calculates the growPercent of a given grow Task
  // Chooses between Formulas based on if Formulas.exe is unlocked
  // Returns the percent in decimal numbers
  calculateGrowPercent(threads: number): number {
    let growPercent = 0;
    if (this.ns.fileExists("Formulas.exe", "home")) {
      growPercent = this.simpleFormula(threads);
    } else {
      growPercent = this.complicatedFormula(threads);
    }
    return growPercent / 100;
  }

  // Calculates the growPercent by using the by formulas provided function for it
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

  // Checks if a server is prepared for a batch
  isPrepped(): boolean {
    const moneyPrepped = this.moneyIsPrepped();
    const secPrepped = this.secIsPrepped();
    const isPrepped = moneyPrepped && secPrepped;

    return isPrepped;
  }

  moneyIsPrepped(): boolean {
    const moneyIsPrepped = this.money === this.maxMoney;
    return moneyIsPrepped;
  }

  secIsPrepped(): boolean {
    const secToFix = Math.abs(this.sec - this.minSec);

    const tolerance = 0.0001; // Fix for floating point accuracy
    const secIsPrepped = secToFix < tolerance;

    return secIsPrepped;
  }
}
