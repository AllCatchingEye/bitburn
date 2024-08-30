import { NS } from '@ns';

export async function main(ns: NS) {
  let memberCount = 0;

  while (true) {
    if (ns.gang.inGang() && ns.gang.canRecruitMember()) {
      const name = 'Jane-' + memberCount;
      ns.gang.recruitMember(name);
      memberCount += 1;
    }
    await ns.sleep(10000);
  }
}
