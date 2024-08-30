import { NS, GangMemberInfo, Gang, Formulas, GangOtherInfo } from '@ns';
import { calculateTaskRespectGain, calculateWantedLevelGain, calculateTaskMoneyGain } from './gangStatsCalc';
import { shouldAscend } from './ascension';

let gang: Gang;
let formulas: Formulas | undefined = undefined;

/**
 * Main function to manage the gang. Initializes the gang and enters a loop to manage members and tasks.
 *
 * @param {NS} ns - The Netscript environment object providing access to game functions.
 */
export async function main(ns: NS) {
  await initilizeGang(ns);

  if (shouldClash()) {
    gang.setTerritoryWarfare(true);
  }

  while (true) {
    await manageGang(ns);
    await ns.sleep(1000);
  }
}

/**
 * Initializes the gang by checking if the player is in a gang, attempting to create one if not,
 * and checking if the formulas API is available.
 *
 * @param {NS} ns - The Netscript environment object providing access to game functions.
 */
async function initilizeGang(ns: NS) {
  gang = ns.gang;

  if (ns.fileExists('formulas.exe')) {
    formulas = ns.formulas;
  }

  while (!gang.inGang()) {
    const playerKarma = ns.getPlayer().karma;
    ns.print('INFO Player karma: ' + playerKarma);

    gang.createGang('Slum Snakes');
    await ns.sleep(1000);
  }
}

/**
 * Manages the gang by iterating over all members and determining actions for each.
 *
 * @param {NS} ns - The Netscript environment object providing access to game functions.
 */
async function manageGang(ns: NS) {
  const memberNames = gang.getMemberNames();
  for (const memberName of memberNames) {
    const member = gang.getMemberInformation(memberName);
    handleMember(ns, member);
  }
}

/**
 * Determines whether to engage in territory warfare by checking if the win chance
 * against all other gangs is above a minimum threshold.
 *
 * @returns {boolean} - True if the gang should engage in territory warfare, false otherwise.
 */
function shouldClash(): boolean {
  const minWinChance = 0.51;
  const clashWinChances = getClashWinChances();

  // If the average win Chance against every other faction is in our favour, activate clash
  const shouldClash = clashWinChances.every((winChance) => winChance >= minWinChance);
  return shouldClash;
}

/**
 * Retrieves the win chances for clashes with all other gangs.
 *
 * @returns {number[]} - An array of win chances against each gang.
 */
function getClashWinChances(): number[] {
  const otherGangs: GangOtherInfo = gang.getOtherGangInformation();

  const clashWinChances: number[] = [];

  Object.keys(otherGangs).forEach((gangName) => {
    const clashWinChance = gang.getChanceToWinClash(gangName);
    clashWinChances.push(clashWinChance);
  });

  return clashWinChances;
}

/**
 * Handles the actions for a single gang member, including purchasing equipment,
 * determining if they should ascend, and assigning tasks.
 *
 * @param {NS} ns - The Netscript environment object providing access to game functions.
 * @param {GangMemberInfo} member - The information about the gang member being managed.
 */
function handleMember(ns: NS, member: GangMemberInfo) {
  tryEquipmentPurchase(ns, member);

  if (shouldAscend(ns, member)) {
    gang.ascendMember(member.name);
  } else {
    determineAndSetTask(ns, member);
  }
}

/**
 * Attempts to purchase the next piece of equipment for a gang member if affordable.
 *
 * @param {NS} ns - The Netscript environment object providing access to game functions.
 * @param {GangMemberInfo} member - The information about the gang member being managed.
 */
function tryEquipmentPurchase(ns: NS, member: GangMemberInfo) {
  const nextEquipment = getNextEquipment(ns, member);
  if (nextEquipment) gang.purchaseEquipment(member.name, nextEquipment);
}

/**
 * Determines the best task for a gang member to perform based on either respect or money gain,
 * and assigns them to that task.
 *
 * @param {NS} ns - The Netscript environment object providing access to game functions.
 * @param {GangMemberInfo} member - The information about the gang member being managed.
 */
function determineAndSetTask(ns: NS, member: GangMemberInfo) {
  const focusRespect = false;
  const task: string = calculateBestGangTask(ns, member, focusRespect);

  if (task === 'Unassigned') {
    gang.setMemberTask(member.name, 'Train Combat');
  } else {
    gang.setMemberTask(member.name, task);
  }
}

/**
 * Calculates the best gang task for a member based on the focus (respect or money gain).
 *
 * @param {NS} ns - The Netscript environment object providing access to game functions.
 * @param {GangMemberInfo} member - The information about the gang member being managed.
 * @param {boolean} focusRespect - If true, prioritize respect gain over money gain.
 * @returns {string} - The name of the best task for the member to perform.
 */
function calculateBestGangTask(ns: NS, member: GangMemberInfo, focusRespect: boolean): string {
  const tasks = gang.getTaskNames();

  let bestTask = 'Unassigned';
  let bestMoneyGain = 0;
  let bestRespectGain = 0;

  for (const task of tasks) {
    if (task === 'Unassigned') continue;

    let wantedGain = 0;
    let respectGain = 0;
    let moneyGain = 0;

    const taskStats = gang.getTaskStats(task);
    if (formulas) {
      const gangInfo = gang.getGangInformation();
      respectGain = formulas.gang.respectGain(gangInfo, member, taskStats);
      moneyGain = formulas.gang.moneyGain(gangInfo, member, taskStats);
    } else {
      const gangSoftcap = 1;
      wantedGain = calculateWantedLevelGain(ns, member, taskStats);
      respectGain = calculateTaskRespectGain(ns, gangSoftcap, member, taskStats);
      moneyGain = calculateTaskMoneyGain(ns, gangSoftcap, member, taskStats);
    }

    if (wantedGain > respectGain / 2) continue;

    if (focusRespect) {
      if (bestRespectGain < respectGain) {
        bestRespectGain = respectGain;
        bestTask = task;
      }
    } else {
      if (bestMoneyGain < moneyGain) {
        bestMoneyGain = moneyGain;
        bestTask = task;
      }
    }
  }

  return bestTask;
}

/**
 * Retrieves the next piece of equipment that a member can afford and has not yet purchased.
 *
 * @param {NS} ns - The Netscript environment object providing access to game functions.
 * @param {GangMemberInfo} member - The information about the gang member being managed.
 * @returns {string | undefined} - The name of the next piece of equipment to purchase, or undefined if none are available.
 */
function getNextEquipment(ns: NS, member: GangMemberInfo): string | undefined {
  const affordableEquipments = getAffordableEquipments(ns, member);

  // Sort for cheapest Equipment
  affordableEquipments.sort((a, b) => gang.getEquipmentCost(a) - gang.getEquipmentCost(b));

  // Return cheapest affordable equipment
  const nextEquipment = affordableEquipments.shift();
  return nextEquipment;
}

/**
 * Retrieves a list of equipment that the gang member can afford and has not yet purchased.
 *
 * @param {NS} ns - The Netscript environment object providing access to game functions.
 * @param {GangMemberInfo} member - The information about the gang member being managed.
 * @returns {string[]} - An array of equipment names that are affordable and not yet owned.
 */
function getAffordableEquipments(ns: NS, member: GangMemberInfo): string[] {
  const equipments = gang.getEquipmentNames();
  const affordableEquipments = equipments.filter((equipment) => canAfford(ns, equipment, member));

  return affordableEquipments;
}

/**
 * Determines if the gang member can afford a specific piece of equipment and hasn't already purchased it.
 *
 * @param {NS} ns - The Netscript environment object providing access to game functions.
 * @param {string} equipment - The name of the equipment to check.
 * @param {GangMemberInfo} member - The information about the gang member being managed.
 * @returns {boolean} - True if the member can afford the equipment and hasn't purchased it, false otherwise.
 */
function canAfford(ns: NS, equipment: string, member: GangMemberInfo): boolean {
  const equipmentCost = gang.getEquipmentCost(equipment);
  const moneyAvailable = ns.getServerMoneyAvailable('home');

  const hasEnoughMoney = equipmentCost <= moneyAvailable;
  const hasPurchased = member.upgrades.includes(equipment) || member.augmentations.includes(equipment);
  const canAfford = hasEnoughMoney && !hasPurchased;
  return canAfford;
}
