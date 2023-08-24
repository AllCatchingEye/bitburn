import { NS, Server } from "@ns";
import { disableLogs, calculateThreadAmount } from "/lib/helper-functions";
import { mostProfitableServer } from "/lib/profit-functions";
import { searchServers } from "/lib/searchServers";
import { hostname } from "os";
import { Script } from "vm";

type activeHost = {
  hostname: string;
  pid: number;
};

/**
 * Starts the deployer controller
 * @param {NS} ns - Mandatory to access netscript functions
 */
export async function main(ns: NS): Promise<void> {
  await deploymentController(ns);
}

/**
 * Controlls the deployment for hacking-scripts
 * @param {NS} ns - Mandatory to access netscript functions
 */
async function deploymentController(ns: NS) {
  const functionNames = [
    "getServerMaxRam",
    "getServerUsedRam",
    "getServerSecurityLevel",
    "getServerSecurityLevel",
    "scan",
    "sleep",
  ];
  disableLogs(ns, functionNames);

  const activeHosts: activeHost[] = [];
  while (true) {
    const useableServers: string[] = getUseableServers(ns);
    const target = mostProfitableServer(ns);

    await deployer(ns, activeHosts, useableServers, target);

    await ns.sleep(1000);
  }
}

/**
 * Starts deployments of hacking scripts for a target on rooted servers
 * @param {NS} ns - Mandatory to access netscript functions
 * @param {activeHost[]} activeHosts - Map of hosts with started script pid
 * @param {string[]} useableServers - List of rooted servers
 * @param {string} target - Which server should be targeted by the hacking scripts
 */
async function deployer(
  ns: NS,
  activeHosts: activeHost[],
  useableServers: string[],
  target: string
) {
  deployNewServers(useableServers, activeHosts, ns, target);
  updateDeployedServers(activeHosts, ns, target);
}

function deployNewServers(
  useableServers: string[],
  activeHosts: activeHost[],
  ns: NS,
  target: string
) {
  const activeHostNames = activeHosts.map((activeHost) => activeHost.hostname);
  const newServers = useableServers.filter(
    (useableServer) => !activeHostNames.includes(useableServer)
  );
  newServers.forEach((newServer) => {
    const pid = deployScript(ns, newServer, target);
    const newActiveHost: activeHost = {
      hostname: newServer,
      pid: pid,
    };
    activeHosts.push(newActiveHost);
  });
}

function updateDeployedServers(
  activeHosts: activeHost[],
  ns: NS,
  target: string
) {
  activeHosts
    .filter((activeHost) => !ns.isRunning(activeHost.pid))
    .forEach(
      (inactiveHost) =>
        (inactiveHost.pid = deployScript(ns, inactiveHost.hostname, target))
    );
}

/**
 * Determines the hacking script and starts it on the given host for target
 * @param {NS} ns - Mandatory to access netscript functions
 * @param {string} host - Host on which the hacking scripts will be deployed
 * @param {string} target - Which host the scripts will target
 * @returns Which script was started on host
 */
function deployScript(ns: NS, host: string, target: string): number {
  const script = determineScript(ns, target);

  const threadAmount: number = calculateThreadAmount(ns, script, host);
  const pid = ns.exec(script, host, threadAmount, target);
  return pid;
}

/**
 * Finds servers which have been rooted and dont have zero ram,
 * and returns a list of them
 * @param {NS} ns - Mandatory to access netscript functions
 * @returns List of useable servers for running scripts
 */
function getUseableServers(ns: NS) {
  const root = "home";
  const useableServers: string[] = searchServers(ns, root)
    .map((serverName) => ns.getServer(serverName))
    .filter((server) => server.hostname !== "home")
    .filter((server) => server.hasAdminRights)
    .filter((server) => server.maxRam !== 0)
    .map((server) => server.hostname);

  return useableServers;
}

/**
 * Determines which script should be executed on the given target
 * @param {NS} ns - Mandatory to access netscript functions
 * @param {string} target - Target of the hacking scripts
 * @returns Which hacking script should be executed on the target
 */
function determineScript(ns: NS, target: string): string {
  const moneyThresh = ns.getServerMaxMoney(target) * 0.75;
  const securityThresh = ns.getServerMinSecurityLevel(target) + 5;

  let script = "";
  if (ns.getServerSecurityLevel(target) > securityThresh) {
    script = "hacking/weaken.js";
  } else if (ns.getServerMoneyAvailable(target) < moneyThresh) {
    script = "hacking/grow.js";
  } else {
    script = "hacking/hack.js";
  }
  return script;
}
