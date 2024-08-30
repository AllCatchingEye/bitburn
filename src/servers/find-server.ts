import { NS } from '@ns';

export async function main(ns: NS) {
  const target = String(ns.args[0]);
  const serverPath = findServer(ns, 'home', target, [], []);

  ns.tprint(serverPath);
}

function findServer(ns: NS, host: string, target: string, path: string[], visited: string[]): string[] {
  if (visited.includes(host)) return [];

  visited.push(host);

  const newPath: string[] = path.concat(host);

  const servers = ns.scan(host);
  for (const server of servers) {
    if (server === target) {
      return newPath.concat(target);
    } else {
      const nextPath = findServer(ns, server, target, newPath, visited);

      if (nextPath.length > 0 && nextPath.includes(target)) {
        return nextPath;
      }
    }
  }

  return [];
}
