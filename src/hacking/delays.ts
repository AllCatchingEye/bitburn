import { NS, Server, Player } from '@ns';
import { Simulation } from './simulation';

/**
 * Represents the delays between different operations (grow, hack, weaken).
 */
export type Delays = {
  grow: number;
  hack: number;
  weaken: number;
};

/**
 * Represents the timings for different operations (hack, grow, weaken).
 */
type Timings = {
  hack: number;
  grow: number;
  weaken: number;
};

/**
 * Calculates the delays between operations based on the base delay and simulation data.
 *
 * @param ns - The Netscript environment object provided by the game.
 * @param baseDelay - The base delay value to use for calculations.
 * @param sim - The simulation object containing server and player data.
 * @returns An object containing the calculated delays for grow, hack, and weaken operations.
 */
export function getDelays(ns: NS, baseDelay: number, sim: Simulation) {
  const timings = getTimings(ns, sim);
  const delays: Delays = {
    grow: timings.weaken + baseDelay - timings.grow,
    weaken: 2 * baseDelay,
    hack: timings.weaken - timings.hack - baseDelay,
  };
  return delays;
}

/**
 * Retrieves the timings for the operations based on the presence of 'Formulas.exe'.
 *
 * @param ns - The Netscript environment object provided by the game.
 * @param sim - The simulation object containing server and player data.
 * @returns An object containing the timings for hack, grow, and weaken operations.
 */
function getTimings(ns: NS, sim: Simulation) {
  const timings: Timings = ns.fileExists('Formulas.exe')
    ? getSimulatedTimings(ns, sim.server, sim.player)
    : getNormalTimings(ns, sim.server.hostname);

  return timings;
}

/**
 * Retrieves the normal timings for operations based on server hostname.
 *
 * @param ns - The Netscript environment object provided by the game.
 * @param host - The hostname of the server.
 * @returns An object containing the normal timings for hack, grow, and weaken operations.
 */
function getNormalTimings(ns: NS, host: string) {
  const timings: Timings = {
    hack: ns.getHackTime(host),
    grow: ns.getGrowTime(host),
    weaken: ns.getWeakenTime(host),
  };
  return timings;
}


/**
 * Retrieves the simulated timings for operations based on the server and player data from the simulation.
 *
 * @param ns - The Netscript environment object provided by the game.
 * @param server - The server object from the simulation.
 * @param player - The player object from the simulation.
 * @returns An object containing the simulated timings for hack, grow, and weaken operations.
 */
function getSimulatedTimings(ns: NS, server: Server, player: Player) {
  const timings: Timings = {
    hack: ns.formulas.hacking.hackTime(server, player),
    grow: ns.formulas.hacking.growTime(server, player),
    weaken: ns.formulas.hacking.weakenTime(server, player),
  };
  return timings;
}
