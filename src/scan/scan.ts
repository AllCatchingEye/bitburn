import { NS } from "@ns";

export async function main(ns: NS) {
    //const root: string = ns.args[0].toString();
    //const foundServers = searchServers(ns, root);

    const foundServers = searchServers(ns, "home");
    ns.tprint(`Found ${foundServers.length} servers:`);
    ns.tprint(foundServers);
}

export function searchServers(ns: NS, root: string): string[] {
    const serverFilter = new Set<string>();
    const searchResult = searchForServers(ns, root, serverFilter);
    return searchResult;
}

function searchForServers(ns: NS, root: string, serverFilter: Set<string>): string[] {
    serverFilter.add(root);
    const foundServers = ns.scan(root);

    const newServers = filterFoundServers(ns, foundServers, serverFilter);
    const newServerFilter = addNewServersToFilter(newServers, serverFilter);

    const serverSearchResult: string[] = [...newServers];
    for (const newServer of newServers) {
        const newServerSearchResults = searchForServers(ns, newServer, newServerFilter);
        serverSearchResult.push(...newServerSearchResults);
    }

    return serverSearchResult;
}

function addNewServersToFilter(newServers: string[], foundServers: Set<string>) {
    newServers.forEach(server => foundServers.add(server));
    return foundServers;
}

function filterFoundServers(ns: NS, servers: string[], serverFilter: Set<string>): string[] {
    const filteredServers = servers.filter(server => !serverFilter.has(server));
    return filteredServers;
}