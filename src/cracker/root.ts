import { NS } from "../../NetscriptDefinitions";
import { canOpenAllRequiredPorts, openPorts } from "/cracker/Ports";

export async function main(ns: NS): Promise<void> {
  const host = ns.args[0] as string;
  if (!ns.hasRootAccess(host)) root(ns, host);
}

async function root(ns: NS, host: string) {
  while (!canRoot(ns, host)) {
    await ns.sleep(1000);
  }

  openPorts(ns, host);
  ns.nuke(host);
}

function canRoot(ns: NS, host: string) {
  const canOpenPorts = canOpenAllRequiredPorts(ns, ns.getServer(host));

  const hackSkill = ns.getPlayer().skills.hacking;
  const requiredSkill = ns.getServer().requiredHackingSkill ?? 0;
  const skillEnough = hackSkill >= requiredSkill;

  return skillEnough && canOpenPorts;
}


