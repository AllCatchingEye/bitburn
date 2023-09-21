import { NS, Server } from "@ns";
import { getMostProfitableServer } from "/lib/profit-functions";
import { Scripts } from "/Scripts";

export class earlyTarget {
  ns: NS;
  server: Server;
  minSec: number;
  sec: number;
  maxMoney: number;
  money: number;

  constructor(ns: NS, server: Server) {
    this.ns = ns;
    this.server = server;
    this.minSec = this.ns.getServerMinSecurityLevel(this.server.hostname);
    this.sec = this.ns.getServerSecurityLevel(this.server.hostname);
    this.money = this.ns.getServerMoneyAvailable(this.server.hostname);
    this.maxMoney = this.ns.getServerMaxMoney(this.server.hostname);
  }

  update(script: string): void {
    this.determineUpdateTypeOf(script);
  }

  checkForNewTarget(): void {
    const mostProfitableServer: Server = getMostProfitableServer(this.ns);
    if (this.changed(mostProfitableServer)) {
      this.switchTarget(mostProfitableServer);
    }
  }

  changed(mostProfitableServer: Server): boolean {
    const targetChanged = this.server != mostProfitableServer;
    return targetChanged;
  }

  switchTarget(server: Server): void {
    this.server = server;
    this.minSec = this.server.minDifficulty ?? 0;
    this.sec = this.server.hackDifficulty ?? 0;
    this.maxMoney = this.server.moneyMax ?? 0;
    this.money = this.server.moneyAvailable ?? 0;
  }

  determineUpdateTypeOf(script: string): void {
    switch (script) {
      case Scripts.Hacking:
        this.hackUpdate();
        break;
      case Scripts.Grow:
        this.growUpdate();
        break;
      case Scripts.Weaken:
        this.weakenUpdate();
        break;
      default:
        this.ns.print("WARN Unknown script type in task");
        break;
    }
  }

  hackUpdate(): void {
    // update money
    const hackEffect = this.ns.hackAnalyze(this.server.hostname);
    const hackChance = this.ns.hackAnalyzeChance(this.server.hostname);
    const hackPercent = hackEffect * hackChance;
    this.money = Math.max(this.money - this.money * hackPercent, 0);

    // update security
    const hackSecIncrease = this.ns.hackAnalyzeSecurity(
      1,
      this.server.hostname,
    );
    this.sec = Math.min(this.sec + hackSecIncrease, 100); // Max amount of security is 100
  }

  weakenUpdate(): void {
    const weakenSecDecrease = this.ns.weakenAnalyze(1);
    // Security cant go below minimum
    this.sec = Math.max(this.sec - weakenSecDecrease, this.minSec);
  }

  growUpdate(): void {
    // update money
    const growPercent = this.calculateGrowPercent();
    this.money = Math.min((this.money + 1) * (1 + growPercent), this.maxMoney);

    // update security
    const growSecIncrease = this.ns.growthAnalyzeSecurity(
      1,
      this.server.hostname,
    );
    this.sec = Math.min(this.sec + growSecIncrease, 100); // Max amount of security is 100
  }

  // Calculates the growPercent of a given grow Task
  // Chooses between Formulas based on if Formulas.exe is unlocked
  // Returns the percent in decimal numbers
  calculateGrowPercent(): number {
    let growPercent = 0;
    if (this.ns.fileExists("Formulas.exe", "home")) {
      growPercent = this.simpleFormula();
    } else {
      growPercent = this.complicatedFormula();
    }
    return growPercent / 100;
  }

  // Calculates the growPercent by using the by formulas provided function for it
  simpleFormula(): number {
    const player = this.ns.getPlayer();
    const server = this.ns.getServer(this.server.hostname);
    const growPercent = this.ns.formulas.hacking.growPercent(server, 1, player);

    return growPercent;
  }

  // Uses a more complitated Formula to calculate grow percent
  complicatedFormula(): number {
    const difficulty =
      this.ns.getServerSecurityLevel(this.server.hostname) / 100;
    const baseGrowth = Math.min(1 + 0.03 / difficulty, 1.0035); // Rate capped at 1.0035

    const serverGrowth = this.ns.getServerGrowth(this.server.hostname) / 100;
    const hackMultiplier = this.ns.getPlayer().mults.hacking_grow;
    const adjustedGrowth = serverGrowth * hackMultiplier;

    const growPercent = baseGrowth ** (adjustedGrowth * 1);
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
