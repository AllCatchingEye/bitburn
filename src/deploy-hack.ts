import { NS, Server} from "@ns";

/** @param {NS} ns */
export async function main(ns: NS) {
  const src = ns.args[0].toString();
  const target = ns.args[1].toString();

	let nodes: string[] = await ns.scan(src);
    ns.print(`Found nodes: ${nodes}`);

    for (let node of nodes) {
        const server: Server = ns.getServer(node)

        const hackLevelRequired = ns.getServerRequiredHackingLevel(server.hostname);
        const hackLevel = ns.getHackingLevel();

        if(hackLevel > hackLevelRequired) {
            const scriptRam = ns.getScriptRam("hack.js");
            const availableRam = server.maxRam - server.ramUsed;

            // a threadAmount < 1 causes a runtime error on ns.exec
            const threadAmount = Math.max(Math.floor(availableRam / scriptRam), 1);

            await init(ns, server.hostname);

            ns.print(`Hacking server ${server.hostname} ${threadAmount} times...`);
            ns.exec("hack.js", server.hostname, threadAmount, target);
        }
    }
}

/** @param {NS} ns */
export async function init(ns:NS, target: string) {
    await ns.scp("hack.js", target);
    
    const sshPortsOpen: boolean = ns.getServer(target).sshPortOpen;
    const ftpPortsOpen: boolean = ns.getServer(target).ftpPortOpen;

    if (ns.fileExists("BruteSSH.exe", "home") && !sshPortsOpen) {
        ns.brutessh(target);
    }

    if (ns.fileExists("FTPCrack.exe", "home") && !ftpPortsOpen) {
        ns.ftpcrack(target);
    }

    ns.nuke(target);
}

function findServers(ns: NS, src: string, found: string[] | undefined = undefined): string[] {
  let target = src;
  let foundServers = ns.scan(target);

  for (let server of foundServers) {
    if (server in foundServers) {
      continue;
    }

    foundServers.concat(ns.scan(server));
  }

  return foundServers;
}