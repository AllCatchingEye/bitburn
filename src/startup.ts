import { getRunnableServers } from '@/servers/server-search';
import { getTotalMaxRam } from '@/utility/utility-functions';
import { NS } from '@ns';

export async function main(ns: NS) {
  const hackScripts = ['hacking/controller.js', 'servers/server-prepper.js', 'servers/server-upgrader.js'];
  const gangScripts = ['gang/recruiter.js', 'gang/gang.js'];
  while (true) {
    if (getTotalMaxRam(ns, getRunnableServers(ns)) > 512) startScripts(ns, gangScripts);
    startScripts(ns, hackScripts);

    await ns.sleep(1000);
  }
}

function startScripts(ns: NS, scripts: string[]) {
  scripts.filter((script) => !ns.isRunning(script)).forEach((script) => ns.run(script));
}
