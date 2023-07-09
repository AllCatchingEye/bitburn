import { NS } from "@ns";

export async function findAllNeighbours(ns: NS, target: string, filter?: string, lookRecursive?: Boolean) {
  let neighbors = new Set<string>(ns.scan(target));
  if(filter) {
    neighbors = await filterNeighbours(neighbors, filter);
  }  

  if (lookRecursive) {
    //Get all neighbours recursivly and append to neighbours already found
    for (let neighbor of neighbors) {
      const subNeighbours = await findAllNeighbours(ns, neighbor, filter, lookRecursive);
      neighbors = new Set([...neighbors, ...subNeighbours]);
    }
  }

  return neighbors;
}

export async function filterNeighbours(neighbors: Set<string>, filter: string) {
  const filteredNeighbours = new Set<string>();
  for (let neighbor of neighbors) {
    if (!neighbor.includes(filter)) {
      filteredNeighbours.add(neighbor);
    }
  }
  return filteredNeighbours;
}
