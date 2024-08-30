import { getRunnableServers } from '@/servers/server-search';
import { getTotalMaxRam } from '@/utility/utility-functions';
import { NS } from '@ns';

/**
 * Main function that continuously monitors the available RAM across all servers
 * and starts specified scripts when conditions are met.
 *
 * @param {NS} ns - The Netscript environment object providing access to game functions.
 */
export async function main(ns: NS) {
  const hackScripts = ['hacking/controller.js', 'servers/server-prepper.js', 'servers/server-upgrader.js'];
  const gangScripts = ['gang/recruiter.js', 'gang/gang.js'];
  while (true) {
    if (getTotalMaxRam(ns, getRunnableServers(ns)) > 512) startScripts(ns, gangScripts);
    startScripts(ns, hackScripts);

    await ns.sleep(1000);
  }
}

/**
 * Starts the given scripts if they are not already running.
 *
 * @param {NS} ns - The Netscript environment object providing access to game functions.
 * @param {string[]} scripts - An array of script file paths to start.
 */
function startScripts(ns: NS, scripts: string[]) {
  const scriptsNotRunning = scripts.filter((script) => !ns.isRunning(script));
  scriptsNotRunning.forEach((script) => ns.run(script));
}
