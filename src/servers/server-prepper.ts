import { NS } from '@ns';
import { DepthFirstServerScan } from './server-search';
import { canHack } from '../utility/utility-functions';
import { HACK_SCRIPT_PATH, GROW_SCRIPT_PATH, WEAKEN_SCRIPT_PATH } from '../utility/utility-functions';

export async function main(ns: NS) {
  await prepareServers(ns);
}

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

function gainRootAccess(ns: NS, servers: string[]) {
  servers
    .filter((server) => !ns.hasRootAccess(server) && openedEnoughPorts(ns, server))
    .forEach((server) => ns.nuke(server));
}

function copyScripts(ns: NS, files: string[], servers: string[]) {
  servers.forEach((server) => {
    files.forEach((file) => {
      ns.scp(file, server);
      ns.printf('Copied file %s to %s', file, server);
    });
  });
}

function openedEnoughPorts(ns: NS, host: string) {
  const server = ns.getServer(host);
  return (server.openPortCount ?? 0) >= (server.numOpenPortsRequired ?? 0);
}
