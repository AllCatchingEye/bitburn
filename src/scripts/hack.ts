import { NS } from "../../NetscriptDefinitions";

export async function main(ns: NS): Promise<void> {
  const target = ns.args[0] as string;
  const delay = ns.args[1] as number;
  await ns.hack(target, { additionalMsec: delay });
}
