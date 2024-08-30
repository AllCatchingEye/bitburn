import { NS, GangMemberInfo, Gang, Formulas, GangOtherInfo } from '@ns';
import { calculateTaskRespectGain, calculateWantedLevelGain, calculateTaskMoneyGain } from './gangStatsCalc';
import { shouldAscend } from './ascension';

let gang: Gang;
let formulas: Formulas | undefined = undefined;

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

async function manageGang(ns: NS) {
  const memberNames = gang.getMemberNames();
  for (const memberName of memberNames) {
    const member = gang.getMemberInformation(memberName);
    handleMember(ns, member);
  }
}

function shouldClash() {
  const minWinChance = 0.51;
  const clashWinChances = getClashWinChances();

  // If the average win Chance against every other faction is in our favour, activate clash
  const shouldClash = clashWinChances.every((winChance) => winChance >= minWinChance);
  return shouldClash;
}

function getClashWinChances() {
  const otherGangs: GangOtherInfo = gang.getOtherGangInformation();

  const clashWinChances: number[] = [];

  Object.keys(otherGangs).forEach((gangName) => {
    const clashWinChance = gang.getChanceToWinClash(gangName);
    clashWinChances.push(clashWinChance);
  });

  return clashWinChances;
}

function handleMember(ns: NS, member: GangMemberInfo) {
  tryEquipmentPurchase(ns, member);

  if (shouldAscend(ns, member)) {
    gang.ascendMember(member.name);
  } else {
    determineAndSetTask(ns, member);
  }
}

function tryEquipmentPurchase(ns: NS, member: GangMemberInfo) {
  const nextEquipment = getNextEquipment(ns, member);
  if (nextEquipment) gang.purchaseEquipment(member.name, nextEquipment);
}

function determineAndSetTask(ns: NS, member: GangMemberInfo) {
  const focusRespect = false;
  const task: string = calculateBestGangTask(ns, member, focusRespect);

  if (task === 'Unassigned') {
    gang.setMemberTask(member.name, 'Train Combat');
  } else {
    gang.setMemberTask(member.name, task);
  }
}

function calculateBestGangTask(ns: NS, member: GangMemberInfo, focusRespect: boolean) {
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

function getNextEquipment(ns: NS, member: GangMemberInfo) {
  const affordableEquipments = getAffordableEquipments(ns, member);

  // Sort for cheapest Equipment
  affordableEquipments.sort((a, b) => gang.getEquipmentCost(a) - gang.getEquipmentCost(b));

  // Return cheapest affordable equipment
  const nextEquipment = affordableEquipments.shift();
  return nextEquipment;
}

function getAffordableEquipments(ns: NS, member: GangMemberInfo) {
  const equipments = gang.getEquipmentNames();
  const affordableEquipments = equipments.filter((equipment) => canAfford(ns, equipment, member));

  return affordableEquipments;
}

function canAfford(ns: NS, equipment: string, member: GangMemberInfo) {
  const equipmentCost = gang.getEquipmentCost(equipment);
  const moneyAvailable = ns.getServerMoneyAvailable('home');

  const hasEnoughMoney = equipmentCost <= moneyAvailable;
  const hasPurchased = member.upgrades.includes(equipment) || member.augmentations.includes(equipment);
  const canAfford = hasEnoughMoney && !hasPurchased;
  return canAfford;
}
