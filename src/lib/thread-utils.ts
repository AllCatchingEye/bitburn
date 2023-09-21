import { NS } from "@ns";
import { Target } from "/hacking/target";
import { Scripts } from "/Scripts";

export function getThreadsForAllScripts(
  ns: NS,
  target: Target,
  stealPercent: number,
): number[] {
  const hackThreads = getHackThreads(ns, target, stealPercent);
  const hackWeakenThreads = Math.ceil(hackThreads / 25); // 1x weaken == 25x hacks
  target.update(Scripts.Weaken, hackWeakenThreads);

  const growThreads = getGrowThreads(ns, target);
  const growWeakenThreads = Math.ceil(growThreads / 12.5); // 1x grow == 12.5x hacks
  target.update(Scripts.Weaken, growWeakenThreads);

  return [hackThreads, hackWeakenThreads, growThreads, growWeakenThreads];
}

// Returns the amount of threads necessary,
// to grow money to maximum on a provided target
function getHackThreads(ns: NS, target: Target, stealPercent: number): number {
  let hackPercent = 0;
  if (ns.fileExists("Formulas.exe", "home")) {
    const player = ns.getPlayer();
    const server = target.server;
    hackPercent = ns.formulas.hacking.hackPercent(server, player);
  } else {
    hackPercent = getHackEffect(ns, target);
  }
  const hackThreads = Math.floor(stealPercent / hackPercent);

  target.update(Scripts.Hacking, hackThreads);
  return hackThreads;
}

// Calculates the percent of money stolen by hack in decimal form,
// based on a provided target
// Read source code for exact formula:
// https://github.com/bitburner-official/bitburner-src/blob/dev/src/Hacking.ts
function getHackEffect(ns: NS, target: Target): number {
  const hostname = target.server.hostname;

  const hackDifficulty = target.sec;
  const difficultyMultiplier = (100 - hackDifficulty) / 100;

  const hackStealMultiplier = ns.getPlayer().mults.hacking_money;

  const playerSkill = ns.getPlayer().skills.hacking;
  const requiredSkill = ns.getServerRequiredHackingLevel(hostname);
  const skillMultiplier = (playerSkill - (requiredSkill - 1)) / playerSkill;

  const balanceFactor = 240;
  const percentMoneyStolen =
    (difficultyMultiplier * skillMultiplier * hackStealMultiplier) /
    balanceFactor;

  return clamp(percentMoneyStolen, 0, 1);
}

// Returns the amount of threads necessary,
// to grow money to maximum on a provided target
export function getGrowThreads(ns: NS, target: Target): number {
  const maxMoney = target.maxMoney;
  const money = target.money;

  let growThreads = 0;
  if (ns.fileExists("Formulas.exe")) {
    const predictedServer = createMockServer(ns, target);
    growThreads = ns.formulas.hacking.growThreads(
      predictedServer,
      ns.getPlayer(),
      maxMoney,
    );
  } else {
    const multiplier = maxMoney / Math.max(money, 1);
    growThreads = growthAnalyzeDynamic(ns, target, multiplier);
  }
  growThreads = Math.ceil(growThreads);

  target.update(Scripts.Grow, growThreads);
  return growThreads; // Only whole threads exist
}

function clamp(val: number, min: number, max: number): number {
  const clampedVal = Math.min(max, Math.max(min, val));
  return clampedVal;
}

function createMockServer(ns: NS, target: Target) {
  let mockServer = ns.formulas.mockServer();
  mockServer = target.server;

  const money = target.money;
  const sec = target.sec;

  mockServer.moneyAvailable = money;
  mockServer.hackDifficulty = sec;

  return mockServer;
}

// Calculates growth threads based on provided target
// Read source code for exact formula:
// https://github.com/bitburner-official/bitburner-src/blob/dev/src/Server/ServerHelpers.ts#L6
function growthAnalyzeDynamic(
  ns: NS,
  target: Target,
  multiplier: number,
): number {
  const hostname = target.server.hostname;
  const hackDifficulty = ns.getServerSecurityLevel(hostname);
  const baseGrowthRate = 1.003;

  let adjustedGrowthRate = 1 + (baseGrowthRate - 1) / hackDifficulty;
  adjustedGrowthRate = Math.min(adjustedGrowthRate, 1.0035);

  const serverGrowthPercent = ns.getServerGrowth(hostname) / 100;

  const growMultiplier = ns.getPlayer().mults.hacking_grow;
  const threads =
    Math.log(multiplier) /
    (Math.log(adjustedGrowthRate) * growMultiplier * serverGrowthPercent);
  return threads;
}

// Returns the amount of threads necessary,
// to weaken a server to minimum Security
export function getMinSecThreads(ns: NS, target: Target): number {
  const hostname = target.server.hostname;
  const minSec = ns.getServerMinSecurityLevel(hostname);
  const sec = target.sec;
  const weakenEffect = ns.weakenAnalyze(1);

  const weakenThreads = Math.abs(sec - minSec) / weakenEffect;
  return Math.ceil(weakenThreads); // Only whole threads exist
}

export function getMaxPossibleThreads(
  ns: NS,
  script: string,
  hostname: string,
): number {
  const scriptRamCost = ns.getScriptRam(script);

  const maxRam = ns.getServerMaxRam(hostname);
  const usedRam = ns.getServerUsedRam(hostname);
  const availableRamOnHost = maxRam - usedRam;

  // Thread amount needs to be whole number
  const maxPossibleThreads = Math.floor(availableRamOnHost / scriptRamCost);
  return maxPossibleThreads;
}
