import { NS } from "../../NetscriptDefinitions";

export async function main(ns: NS, target: string) {
    ns.hack(target);
}