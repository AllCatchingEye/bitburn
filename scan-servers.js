/** @param {NS} ns */
export async function main(ns) {
  ns.tprint("Neighbors of current server.");
  const neighbor = ns.scan();
  let filteredNeighbours = await filterPserver(neighbor)

  for (let neighbor of filteredNeighbours) {
    ns.tprint(neighbor);
  }
  
//   // All neighbors of n00dles.
//   var target = "n00dles";
//   neighbor = ns.scan(target);
//   ns.tprintf("Neighbors of %s.", target);
//   for (var i = 0; i < neighbor.length; i++) {
//     ns.tprint(neighbor[i]);
//   }
}

export async function filterPserver(neighbors) {
    const filteredNeighbours = [];

    for (let neighbor of neighbors) {
        if (!neighbor.includes('pserv')){
            filteredNeighbours.push(neighbor);
        }
    }

    return filteredNeighbours
}