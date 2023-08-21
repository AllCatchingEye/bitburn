import { NS } from "@ns";

/** @param {NS} ns */
export async function main(ns: NS) {
    const target: string = ns.args[0].toString();
    const moneyThresh = Number(ns.args[1]);
    const securityThresh = Number(ns.args[2]);

    while(true) {
        if (ns.getServerSecurityLevel(target) > securityThresh) {
            await ns.weaken(target);
        } else if (ns.getServerMoneyAvailable(target) < moneyThresh) {
            await ns.grow(target);
        } else {
            await ns.hack(target);
        }
    }
}