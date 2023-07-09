import { NS } from "@ns";
import { findAllNeighbours } from "./lib/find-Neighbours";

/** @param {NS} ns */
export async function main(ns: NS) {
  ns.tprint("Neighbors of current server.");

  const neighbours = await findAllNeighbours(ns, "home", 'pserv', true);
  for (let neighbor of neighbours) {
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

