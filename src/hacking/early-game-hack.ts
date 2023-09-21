import { earlyTarget } from "/hacking/early-game-target";
import { getUsableHosts } from "/lib/searchServers";
import { Scripts } from "/Scripts";

/**
 * Startup routine for scripts
 * @param {NS} ns - Mandatory to access netscript functions
 */
export async function main(ns: NS): Promise<void> {
  await hack(ns);
}

async function hack(ns: NS) {
  const server = ns.getServer("foodnstuff");
  const target = new earlyTarget(ns, server);
  while (true) {
    const script = decideScript(target);

    const host = getFreeHost(ns, script);

    if (host != "") {
      ns.exec(script, host, 1, target.server.hostname);

      target.update(script);
    }

    await ns.sleep(5);
  }
}

function decideScript(target: earlyTarget) {
  const moneyThresh = target.maxMoney * 0.75;
  const money = target.money;
  const securityThresh = target.minSec + 5;
  const security = target.sec;

  let script = "";
  if (security > securityThresh) {
    // If the server's security level is above our threshold, weaken it
    script = Scripts.Weaken;
  } else if (money < moneyThresh) {
    // If the server's money is less than our threshold, grow it
    script = Scripts.Grow;
  } else {
    // Otherwise, hack it
    script = Scripts.Hacking;
  }
  return script;
}

function canRunScript(ns: NS, script: string, host: string) {
  const fileExists = ns.fileExists(script, host);
  const enoughRam = hasEnoughRam(ns, script, host);
  const canRunScript = fileExists && enoughRam;

  return canRunScript;
}

function getFreeHost(ns: NS, script: string) {
  const hosts: string[] = getUsableHosts(ns).map((host) => host.hostname);
  const host: string =
    hosts.find((host) => canRunScript(ns, script, host)) ?? "";
  return host;
}

function hasEnoughRam(ns: NS, script: string, host: string) {
  const availableRam = getAvailableRam(ns, host);
  const scriptRam = ns.getScriptRam(script);
  const hasEnoughRam = availableRam >= scriptRam;

  return hasEnoughRam;
}

function getAvailableRam(ns: NS, host: string) {
  const availableRam = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
  return availableRam;
}
