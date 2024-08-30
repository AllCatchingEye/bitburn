import { NS } from '@ns';
import { DepthFirstServerScan } from './server-search';
import { canHack } from '../utility/utility-functions';
import { HACK_SCRIPT_PATH, GROW_SCRIPT_PATH, WEAKEN_SCRIPT_PATH } from '../utility/utility-functions';


/**
 * The main entry point of the script.
 * Calls the `prepareServers` function to set up servers and handle scripts.
 *
 * @param ns - The Netscript environment object provided by the game.
 */
export async function main(ns: NS) {
  await prepareServers(ns);
}

/**
 * Prepares the servers by scanning, opening ports, gaining root access,
 * and copying necessary scripts.
 *
 * @param ns - The Netscript environment object provided by the game.
 */
export async function prepareServers(ns: NS) {
  ns.disableLog('getHackingLevel');
  ns.disableLog('getServerRequiredHackingLevel');

  while (true) {
    const host = 'home';
    const servers = DepthFirstServerScan(ns, host, []);

    preparePorts(ns, servers);
    gainRootAccess(ns, servers);

    const scriptList = [HACK_SCRIPT_PATH, GROW_SCRIPT_PATH, WEAKEN_SCRIPT_PATH, 'hacking/worker.js'];
    copyScripts(ns, scriptList, servers);

    await ns.sleep(1000);
  }
}

/**
 * Prepares the ports on the servers by opening the necessary ports for hacking.
 *
 * @param ns - The Netscript environment object provided by the game.
 * @param servers - An array of server hostnames to prepare.
 */
function preparePorts(ns: NS, servers: string[]) {
  servers.filter((server) => canHack(ns, server)).forEach((server) => openPorts(ns, server));
}

function openPorts(ns: NS, server: string) {
  const portPrograms = new Map<string, (host: string) => void>([
    ['BruteSSH.exe', ns.brutessh],
    ['FTPCrack.exe', ns.ftpcrack],
    ['relaySMTP.exe', ns.relaysmtp],
    ['HTTPWorm.exe', ns.httpworm],
    ['SQLInject.exe', ns.sqlinject],
  ]);

  portPrograms.forEach((openPort, program) => {
    if (ns.fileExists(program)) openPort(server);
  });
}

/**
 * Gains root access on servers by using 'nuke' if enough ports are opened.
 *
 * @param ns - The Netscript environment object provided by the game.
 * @param servers - An array of server hostnames to gain root access on.
 */
function gainRootAccess(ns: NS, servers: string[]) {
  servers
    .filter((server) => !ns.hasRootAccess(server) && openedEnoughPorts(ns, server))
    .forEach((server) => ns.nuke(server));
}


/**
 * Copies a list of scripts to each server.
 *
 * @param ns - The Netscript environment object provided by the game.
 * @param files - An array of script file paths to be copied.
 * @param servers - An array of server hostnames to copy scripts to.
 */
function copyScripts(ns: NS, files: string[], servers: string[]) {
  servers.forEach((server) => {
    files.forEach((file) => {
      ns.scp(file, server);
      ns.printf('Copied file %s to %s', file, server);
    });
  });
}

/**
 * Checks if the server has opened enough ports to gain root access.
 *
 * @param ns - The Netscript environment object provided by the game.
 * @param host - The hostname of the server to check.
 * @returns True if the number of opened ports is sufficient; otherwise, false.
 */
function openedEnoughPorts(ns: NS, host: string) {
  const server = ns.getServer(host);
  return (server.openPortCount ?? 0) >= (server.numOpenPortsRequired ?? 0);
}
