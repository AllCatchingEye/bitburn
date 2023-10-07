import { Target } from "./target";
import { NS } from "/../NetscriptDefinitions";
import { Metrics } from "/hacking/metrics";

export abstract class Job {
  ns: NS;
  target: Target;
  id: number;

  abstract end: number;
  abstract ramCost: number;

  constructor(ns: NS, metrics: Metrics, id: number) {
    this.ns = ns;
    this.target = metrics.target;
    this.id = id;
  }

  abstract calculateRamCost(): number;
  abstract deploy(): void;
  abstract shrink(reduction: number): void;
  abstract updateTarget(): void;
}
