import { NS } from "@ns";
import { Deployments } from "/hacking/deployments";
import { disableLogs } from "/lib/helper-functions";

/**
 * Starts the deployer
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

  const deployer = new Deployer(ns);
  await deployer.startDeployment();
}

export class Deployer {
  readonly ns: NS;
  deployments: Deployments;

  constructor(ns: NS) {
    this.ns = ns;
    this.deployments = new Deployments(this.ns);
  }

  async startDeployment(): Promise<void> {
    while (true) {
      this.deployments.update();
  
      await this.ns.sleep(1000);
    }
  }
}
