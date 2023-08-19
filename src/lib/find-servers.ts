import { NS } from "@ns";

export async function findServers(ns: NS, src: string, maxDepth: number | undefined = undefined) {
  const serversFound: string[] = scanServers(ns, src, maxDepth);
  return serversFound
}

function scanServers(ns: NS, src: string, maxDepth: number | undefined): string[] {
  let result = ns.scan(src);

  const filter = [src];
  for (let server of result) {
    const subServers: string[] = scanServer(ns, server, filter, maxDepth, 2);
    result = [...result, ...subServers];
  }

  return result;
}

function scanServer(ns: NS, src: string, filter: string[], 
  maxDepth: number | undefined, currentDepth: number) {
  let result: string[] = ns.scan(src);

  if (cancelConditions(result.length, maxDepth, currentDepth)) {
    return [];
  }

  let newFilter;
  ({ result, newFilter } = filterServers(result, filter));

  for (let server of result) {
    const subServers: string[] = scanServer(ns, server, newFilter, maxDepth, currentDepth + 1);
    result = [...result, ...subServers];
  }

  return result;
}

function cancelConditions(length: number, maxDepth: number | undefined, currentDepth: number) {
  const tooDeep = maxDepth ? currentDepth > maxDepth : false;
  const noNewServersFound = length == 0;
  return tooDeep || noNewServersFound;
}

function filterServers(result: string[], filter: string[]) {
  result = result.filter(server => !filter.includes(server));
  const newFilter = filter.concat(result);
  return { result, newFilter };
}