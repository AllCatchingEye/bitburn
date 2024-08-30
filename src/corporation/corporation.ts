import { NS, CityName, Office } from '@ns';

interface OfficeAssignments {
  Business: number;
  Operations: number;
  Management: number;
  Engineer: number;
  Intern: number;
  Research: number;
}

export async function main(ns: NS) {
  if (ns.corporation.hasCorporation()) ns.corporation.createCorporation('Arasaka', false);

  const divisionNames = ['Arasaka - Agriculture'];
  const cities = Object.values(CityName);

  // Expand every divison in every city and ensure they have warehouses
  for (const city of cities) {
    // Open a branch of every divsion in this city
    openDivisionsInEveryCity(ns, city, divisionNames);

    // Purchase warehouses for all divisions
    purchaseWarehousesForAllDivisions(ns, city, divisionNames);

    // Expand office size from 3 to 4
    expandOfficeSize(ns, city, 4, divisionNames);

    // Hire as many employees as possible
    await hireEmployees(ns, city, divisionNames);

    // Set employees to work on R&D until 55 Research Points have been accumulated
    const maxRP = 55;
    const divisionToFinishResearch = divisionNames
      .map((divisionName) => ns.corporation.getDivision(divisionName))
      .filter((division) => division.researchPoints < maxRP);

    const offices = divisionToFinishResearch.map((divison) => ns.corporation.getOffice(divison.name, city));
    const officeAssignments: OfficeAssignments = {
      Business: 0,
      Operations: 0,
      Management: 0,
      Engineer: 0,
      Intern: 0,
      Research: ns.corporation.getOffice(divisionName, city).numEmployees,
    };

    setEmployeeJobs(offices, officeAssignments);
  }
}

function openDivisionsInEveryCity(ns: NS, city: CityName, divisionNames: string[]) {
  divisionNames.forEach((divisionName) => ns.corporation.expandCity(divisionName, city));
}

function purchaseWarehousesForAllDivisions(ns: NS, city: CityName, divisionNames: string[]) {
  divisionNames
    .filter((divisionName) => ns.corporation.hasWarehouse(divisionName, city))
    .forEach((divisionName) => ns.corporation.purchaseWarehouse(divisionName, city));
}

function expandOfficeSize(ns: NS, city: CityName, expansionSize: number, divisionNames: string[]) {
  divisionNames.forEach((divisionName) => ns.corporation.upgradeOfficeSize(divisionName, city, expansionSize));
}

async function hireEmployees(ns: NS, city: CityName, divisionNames: string[]) {
  const divisionHiring = divisionNames.filter((divisionName) => canHireEmployees(ns, divisionName, city));

  for (const divisionName of divisionHiring) {
    while (canHireEmployees(ns, divisionName, city)) {
      ns.corporation.hireEmployee(divisionName, city);
      await ns.sleep(1000);
    }
  }
}

function setEmployeeJobs(offices: Office[], assignments: OfficeAssignments) {
  offices.forEach((office) => {
    const positions = office.employeeJobs;
    positions.Business = assignments.Business;
    positions.Operations = assignments.Operations;
    positions.Management = assignments.Management;
    positions.Engineer = assignments.Engineer;
    positions.Intern = assignments.Intern;
    positions['Research & Development'] = assignments.Research;
  });
}

function canHireEmployees(ns: NS, divisionName: string, city: CityName) {
  const office = ns.corporation.getOffice(divisionName, city);
  const canHireEmployees = office.numEmployees < office.size;
  return canHireEmployees;
}
