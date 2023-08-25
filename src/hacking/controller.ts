import { NS } from "@ns";
import { disableLogs } from "/lib/helper-functions";
import { Deployer } from "/hacking/deployer";

/**
 * Starts the deployer controller
 * @param {NS} ns - Mandatory to access netscript functions
 */
export async function main(ns: NS): Promise<void> {
  const functionNames = [
    "getServerMaxRam",
    "getServerUsedRam",
    "getServerSecurityLevel",
    "getServerSecurityLevel",
    "scan",
    "sleep",
  ];
  disableLogs(ns, functionNames);

  await controller(ns);
}

async function controller(ns: NS) {
  const deployer = new Deployer(ns);
  while (true) {
    deployer.update();

    await ns.sleep(1000);
  }
}
