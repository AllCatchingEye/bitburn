import { NS } from "/../NetscriptDefinitions";
import { Metrics } from "/hacking/metrics";
import { Target } from "/hacking/target";

export abstract class Job {
  ns: NS;
  target: Target;
  id: number;
  loggerPid: number;

  abstract end: number;
  abstract ramCost: number;

  constructor(ns: NS, metrics: Metrics, id: number) {
    this.ns = ns;
    this.target = metrics.target;
    this.id = id;
    this.loggerPid = metrics.loggerPid;
  }

  abstract calculateRamCost(): number;
  abstract deploy(): void;
  abstract shrink(reduction: number): void;
  abstract updateTarget(): void;
}
