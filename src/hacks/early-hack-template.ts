import { NS, Server } from "@ns";

/** @param {NS} ns */
export async function main(ns: NS) {
  var target: Server | undefined = ns.getServer();

  if (target != undefined) {
    var moneyThresh = ns.getServerMaxMoney(target.hostname) * 0.75;
    var securityThresh = ns.getServerMinSecurityLevel(target.hostname) + 5;

    while (true) {
      if (ns.getServerSecurityLevel(target.hostname) > securityThresh) {
        await ns.weaken(target.hostname);
      } else if (ns.getServerMoneyAvailable(target.hostname) < moneyThresh) {
        await ns.grow(target.hostname);
      } else {
        await ns.hack(target.hostname);
      }
    }
  }
}
