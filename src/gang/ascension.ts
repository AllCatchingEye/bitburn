import { NS, GangMemberInfo } from '@ns';

export function shouldAscend(ns: NS, member: GangMemberInfo) {
  const ascensionTreshold: number = calculateAscendTreshold(member);
  const ascensionMultiplier = calculateAscensionMultiplier(ns, member);
  const gangRespect = ns.gang.getGangInformation().respect;

  return ascensionMultiplier >= ascensionTreshold && member.earnedRespect < gangRespect;
}

function calculateAscendTreshold(member: GangMemberInfo) {
  const mult = getSmallestMultiplier(member);

  // Got the formula from discord
  // Calculates the best ascension multiplier
  const asc_tresh = 1.66 - 0.62 / Math.exp((2 / mult) ** 2.24);
  return asc_tresh;
}

function calculateAscensionMultiplier(ns: NS, member: GangMemberInfo) {
  const memberAscension = ns.gang.getAscensionResult(member.name);

  // const hackMult = memberAscension?.hack ?? 0;
  let avgMult = 1;
  if (memberAscension) {
    const strMultIncr = memberAscension.str ?? 0;
    const agiMultIncr = memberAscension.agi ?? 0;
    const defMultIncr = memberAscension.def ?? 0;
    const dexMultIncr = memberAscension.dex ?? 0;
    const chaMultIncr = memberAscension.cha ?? 0;

    avgMult = (strMultIncr + agiMultIncr + defMultIncr + dexMultIncr + chaMultIncr) / 5;
  }

  return avgMult;
}

function getSmallestMultiplier(member: GangMemberInfo) {
  const strMult = member.str_mult;
  const defMult = member.def_mult;
  const agiMult = member.agi_mult;
  const dexMult = member.dex_mult;
  const chaMult = member.cha_mult;

  const smallestMult = Math.min(strMult, defMult, agiMult, dexMult, chaMult);

  return smallestMult;
}
