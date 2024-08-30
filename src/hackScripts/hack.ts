import { NS } from '@ns';

export async function main(ns: NS) {
  const server = String(ns.args[0]);
  const delay = Number(ns.args[1]);
  await ns.hack(server, { additionalMsec: delay });
}
