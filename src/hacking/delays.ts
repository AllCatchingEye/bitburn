import { NS, Server, Player } from '@ns';
import { Simulation } from './simulation';

export type Delays = {
  grow: number;
  hack: number;
  weaken: number;
};

type Timings = {
  hack: number;
  grow: number;
  weaken: number;
};

export function getDelays(ns: NS, baseDelay: number, sim: Simulation) {
  const timings = getTimings(ns, sim);
  const delays: Delays = {
    grow: timings.weaken + baseDelay - timings.grow,
    weaken: 2 * baseDelay,
    hack: timings.weaken - timings.hack - baseDelay,
  };
  return delays;
}

function getTimings(ns: NS, sim: Simulation) {
  const timings: Timings = ns.fileExists('Formulas.exe')
    ? getSimulatedTimings(ns, sim.server, sim.player)
    : getNormalTimings(ns, sim.server.hostname);

  return timings;
}

function getNormalTimings(ns: NS, host: string) {
  const timings: Timings = {
    hack: ns.getHackTime(host),
    grow: ns.getGrowTime(host),
    weaken: ns.getWeakenTime(host),
  };
  return timings;
}

function getSimulatedTimings(ns: NS, server: Server, player: Player) {
  const timings: Timings = {
    hack: ns.formulas.hacking.hackTime(server, player),
    grow: ns.formulas.hacking.growTime(server, player),
    weaken: ns.formulas.hacking.weakenTime(server, player),
  };
  return timings;
}
