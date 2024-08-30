import { NS, GangMemberInfo, GangTaskStats } from '@ns';

/**
 * Calculates the respect gain for a gang member performing a specific task.
 *
 * @param {NS} ns - The Netscript environment object providing access to game functions.
 * @param {number} gangSoftcap - A value representing the gang's respect softcap, used in calculations.
 * @param {GangMemberInfo} member - The information about the gang member performing the task.
 * @param {GangTaskStats} task - The statistics of the task being performed.
 * @returns {number} - The calculated respect gain from the task.
 */
export function calculateTaskRespectGain(
  ns: NS,
  gangSoftcap: number,
  member: GangMemberInfo,
  task: GangTaskStats,
): number {
  if (task.baseRespect === 0) return 0;

  const gangInfo = ns.gang.getGangInformation();

  let statWeight =
    (task.hackWeight / 100) * member.hack +
    (task.strWeight / 100) * member.str +
    (task.defWeight / 100) * member.def +
    (task.dexWeight / 100) * member.dex +
    (task.agiWeight / 100) * member.agi +
    (task.chaWeight / 100) * member.cha;
  statWeight -= 4 * task.difficulty;
  if (statWeight <= 0) return 0;
  const territoryMult = Math.max(0.005, Math.pow(gangInfo.territory * 100, task.territory.respect) / 100);
  const territoryPenalty = (0.2 * gangInfo.territory + 0.8) * gangSoftcap;
  if (isNaN(territoryMult) || territoryMult <= 0) return 0;

  const respectMult = calculateWantedPenalty(ns);
  const taskRespectGain = Math.pow(11 * task.baseRespect * statWeight * territoryMult * respectMult, territoryPenalty);

  return taskRespectGain;
}

/**
 * Calculates the wanted level gain for a gang member performing a specific task.
 *
 * @param {NS} ns - The Netscript environment object providing access to game functions.
 * @param {GangMemberInfo} member - The information about the gang member performing the task.
 * @param {GangTaskStats} task - The statistics of the task being performed.
 * @returns {number} - The calculated wanted level gain from the task.
 */
export function calculateWantedLevelGain(ns: NS, member: GangMemberInfo, task: GangTaskStats): number {
  if (task.baseWanted === 0) return 0;

  const gangInfo = ns.gang.getGangInformation();

  let statWeight =
    (task.hackWeight / 100) * member.hack +
    (task.strWeight / 100) * member.str +
    (task.defWeight / 100) * member.def +
    (task.dexWeight / 100) * member.dex +
    (task.agiWeight / 100) * member.agi +
    (task.chaWeight / 100) * member.cha;
  statWeight -= 3.5 * task.difficulty;
  if (statWeight <= 0) return 0;
  const territoryMult = Math.max(0.005, Math.pow(gangInfo.territory * 100, task.territory.wanted) / 100);
  if (isNaN(territoryMult) || territoryMult <= 0) return 0;
  if (task.baseWanted < 0) {
    return 0.4 * task.baseWanted * statWeight * territoryMult;
  }
  const calc = (7 * task.baseWanted) / Math.pow(3 * statWeight * territoryMult, 0.8);

  // Put an arbitrary cap on this to prevent wanted level from rising too fast if the
  // denominator is very small. Might want to rethink formula later
  return Math.min(100, calc);
}

/**
 * Calculates the money gain for a gang member performing a specific task.
 *
 * @param {NS} ns - The Netscript environment object providing access to game functions.
 * @param {number} gangSoftcap - A value representing the gang's money softcap, used in calculations.
 * @param {GangMemberInfo} member - The information about the gang member performing the task.
 * @param {GangTaskStats} task - The statistics of the task being performed.
 * @returns {number} - The calculated money gain from the task.
 */
export function calculateTaskMoneyGain(
  ns: NS,
  gangSoftcap: number,
  member: GangMemberInfo,
  task: GangTaskStats,
): number {
  if (task.baseMoney === 0) return 0;

  const gangInfo = ns.gang.getGangInformation();

  let statWeight =
    (task.hackWeight / 100) * member.hack +
    (task.strWeight / 100) * member.str +
    (task.defWeight / 100) * member.def +
    (task.dexWeight / 100) * member.dex +
    (task.agiWeight / 100) * member.agi +
    (task.chaWeight / 100) * member.cha;
  statWeight -= 3.2 * task.difficulty;
  if (statWeight <= 0) return 0;

  const territoryMult = Math.max(0.005, Math.pow(gangInfo.territory * 100, task.territory.money) / 100);
  const territoryPenalty = (0.2 * gangInfo.territory + 0.8) * gangSoftcap;
  if (isNaN(territoryMult) || territoryMult <= 0) return 0;

  const respectMult = calculateWantedPenalty(ns);
  const moneyGain = Math.pow(5 * task.baseMoney * statWeight * territoryMult * respectMult, territoryPenalty);

  return moneyGain;
}

/**
 * Calculates the penalty applied to gang activities based on the gang's wanted level.
 *
 * @param {NS} ns - The Netscript environment object providing access to game functions.
 * @returns {number} - The calculated penalty factor affecting gang activities.
 */
function calculateWantedPenalty(ns: NS): number {
  const gangInfo = ns.gang.getGangInformation();
  return gangInfo.respect / (gangInfo.respect + gangInfo.wantedLevel);
}
