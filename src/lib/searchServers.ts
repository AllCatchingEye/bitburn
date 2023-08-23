import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
    const root: string = ns.args[0].toString();
    const foundServers = searchServers(ns, root);

    ns.tprint(`Found ${foundServers.length} servers:`);
    ns.tprint(foundServers);
}

/**
 * Searches for all servers it can find starting from root
 * @param {NS} ns - Mandatory to access netscript functions
 * @param {string} root - Server name from which the search starts
 * @returns A list of the server names of all servers that were found
 */
export function searchServers(ns: NS, root: string): string[] {
    const serverFilter = new Set<string>();
    const searchResult = scanServer(ns, root, serverFilter);
    return searchResult;
}

/**
 * Scans a server for connected servers, filters already found servers away and returns 
 * @param {NS} ns - Mandatory to access netscript functions
 * @param {string} scanTarget - Name of server which will be scanned 
 * @param {Set<string>} foundServersFilter - A set of already found server names, 
 * which is used to filter these away
 * @returns List containing the search result for the given server name
 */
function scanServer(ns: NS, scanTarget: string, foundServersFilter: Set<string>): string[] {
    foundServersFilter.add(scanTarget);
    const foundServers = ns.scan(scanTarget);

    const newServers = filterFoundServers(ns, foundServers, foundServersFilter);
    const newServerFilter = addServersToFilter(newServers, foundServersFilter);

    const serverSearchResult: string[] = [...newServers];
    for (const newServer of newServers) {
        const newServerSearchResults = scanServer(ns, newServer, newServerFilter);
        serverSearchResult.push(...newServerSearchResults);
    }

    return serverSearchResult;
}

/**
 * Adds server name to a filter set of server names
 * @param {string[]} servers - List of server names should be added
 * @param {Set<string>} serverFilter - Filter set of server names that are being used to filter
 * @returns New filter set with added server names
 */
function addServersToFilter(servers: string[], serverFilter: Set<string>) {
    servers.forEach(server => serverFilter.add(server));
    return serverFilter;
}

/**
 * Applies a filter set on a list of server names 
 * @param {NS} ns - Mandatory to access netscript functions
 * @param {string[]} servers - A list with server names
 * @param {Set<string>} serverFilter - Set of server names that will be filtered
 * @returns The filtered list of server names
 */
function filterFoundServers(ns: NS, servers: string[], serverFilter: Set<string>): string[] {
    const filteredServers = servers.filter(server => !serverFilter.has(server));
    return filteredServers;
}