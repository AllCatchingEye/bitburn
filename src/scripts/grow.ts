import { NS } from "../../NetscriptDefinitions";

/**
 * Runs grow on the given target
 * @param {NS} ns - Mandatory to access netscript functions
 * @argument {string} target - Server name of the target
 */
export async function main(ns: NS): Promise<void> {
  const target = ns.args[0] as string;
  const delay = ns.args[1] as number;
  await ns.grow(target, { additionalMsec: delay });
}
