import { NS, GangMemberInfo } from '@ns';

/**
 * Determines whether a gang member should ascend based on their current multipliers
 * and earned respect relative to the gang's total respect.
 *
 * @param {NS} ns - The Netscript environment object providing access to game functions.
 * @param {GangMemberInfo} member - The information about the gang member being evaluated.
 * @returns {boolean} - True if the gang member should ascend, false otherwise.
 */
export function shouldAscend(ns: NS, member: GangMemberInfo) {
  const ascensionTreshold: number = calculateAscendTreshold(member);
  const ascensionMultiplier = calculateAscensionMultiplier(ns, member);
  const gangRespect = ns.gang.getGangInformation().respect;

  return ascensionMultiplier >= ascensionTreshold && member.earnedRespect < gangRespect;
}

/**
 * Calculates the threshold multiplier for a gang member to be eligible for ascension.
 *
 * @param {GangMemberInfo} member - The information about the gang member being evaluated.
 * @returns {number} - The calculated ascension threshold multiplier.
 */
function calculateAscendTreshold(member: GangMemberInfo): number {
  const mult = getSmallestMultiplier(member);

  // The formula is derived from community discussion to estimate the optimal ascension threshold.
  const asc_tresh = 1.66 - 0.62 / Math.exp((2 / mult) ** 2.24);
  return asc_tresh;
}

/**
 * Calculates the average ascension multiplier increase for a gang member
 * based on their potential stat gains after ascension.
 *
 * @param {NS} ns - The Netscript environment object providing access to game functions.
 * @param {GangMemberInfo} member - The information about the gang member being evaluated.
 * @returns {number} - The average ascension multiplier increase.
 */
function calculateAscensionMultiplier(ns: NS, member: GangMemberInfo): number {
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

/**
 * Gets the smallest current stat multiplier of a gang member.
 * This is used to calculate the ascension threshold.
 *
 * @param {GangMemberInfo} member - The information about the gang member being evaluated.
 * @returns {number} - The smallest stat multiplier of the gang member.
 */
function getSmallestMultiplier(member: GangMemberInfo): number {
// Find and return the smallest multiplier among the member's stats.
  return Math.min(
      member.str_mult,
      member.def_mult,
      member.agi_mult,
      member.dex_mult,
      member.cha_mult
  );
}
