import { NS, Server} from "@ns";

/** @param {NS} ns */
export async function main(ns: NS, src: string) {
	let nodes: string[] = await ns.scan(src);
    await ns.print(`Found nodes: ${nodes}`);

    for (let node of nodes) {
        const server: Server = ns.getServer(node)
        const target = server.hostname;

        const hackLevelRequired = ns.getServerRequiredHackingLevel(target);
        const hackLevel = ns.getHackingLevel();

        if(hackLevel > hackLevelRequired) {
            const scriptRam = ns.getScriptRam("hack.js");
            const availableRam = server.maxRam - server.ramUsed;

            // a threadAmount < 1 causes a runtime error on ns.exec
            const threadAmount = Math.max(Math.floor(availableRam / scriptRam), 1);

            await init(ns, target);

            await ns.print(`Hacking server ${target} ${threadAmount} times...`);
            ns.exec("hack.js", target, threadAmount, target);
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