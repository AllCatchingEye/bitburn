import { NS } from "@ns";

/** @param {NS} ns */
export async function main(ns: NS) {
  const serverName = ns.args[0] as string;
  const server = ns.getServer(serverName);

  ns.tprint(`${JSON.stringify(server, null, 2)}`);
}
