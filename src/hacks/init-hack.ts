import { NS, Server } from "@ns";

/** @param {NS} ns */
export async function main(ns: NS) {
    var target: string | undefined = String(ns.args[0]);

    if (target != undefined){
        if (ns.fileExists("BruteSSH.exe", "home")) {
            await ns.brutessh(target);
        }
    
        await ns.nuke(target);
    }

    return true;
}
