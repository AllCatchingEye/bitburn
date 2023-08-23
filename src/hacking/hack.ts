import { NS } from "../../NetscriptDefinitions";

/**
 * Runs hack on the given target
 * @param {NS} ns - Mandatory to access netscript functions
 * @argument {string} target - Server name of the target
 */
export async function main(ns: NS): Promise<void> {
    const target = ns.args[0] as string;
    await ns.hack(target);
}