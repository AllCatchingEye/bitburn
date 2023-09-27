import { NS } from "/../NetscriptDefinitions";

export async function main(ns: NS) {
  const n = ns.args[0] as number;
  const biggestPrimeFactor = primeFactor(n);
  ns.tprint(biggestPrimeFactor);
}

function primeFactor(n: number) {
  let n_copy: number = n;

  n_copy = removePrimeFactor(n_copy, 2);

  // Prime must be odd at this point
  let i = 3;
  while (i <= Math.floor(Math.sqrt(n_copy))) {
    n_copy = removePrimeFactor(n_copy, i);
    i += 2;
  }

  if (n_copy > 2) {
    return n_copy;
  } else {
    return i;
  }
}

function removePrimeFactor(n: number, i: number) {
  let n_copy = n;
  while (n_copy % i === 0) {
    n_copy = Math.floor(n_copy / i);
  }

  return n_copy;
}
