import { NS } from "@ns";

const SERVER_BASE_NAME: string = "pserv-"

/** @param {NS} ns */
export async function main(ns: NS) {  
    const ram = 2;
    await purchaseAllServers(ns, ram);
    await upgradeAllServers(ns, ram);
}

async function purchaseAllServers(ns: NS, ram: number) {
    for (let i = 0; i < ns.getPurchasedServerLimit(); i++) {
        
        const purchasedServerName = SERVER_BASE_NAME + i;
        if(ns.serverExists(purchasedServerName)) {
            continue;
        }

        if (canPurchaseServer(ns, ram)) {
            ns.purchaseServer(purchasedServerName, ram);
        }

        await ns.sleep(1000);
    }
}

async function upgradeAllServers(ns: NS, ram: number) {
    for (let exponent = 1; exponent < 20; exponent++) {
        const ramUpgradeSize = Math.pow(ram, exponent);
        await upgradeServer(ns, ramUpgradeSize);

        await ns.sleep(1000);
    }
}

async function upgradeServer(ns: NS, ramUpgradeSize: number) {
    for (let i = 0; i < ns.getPurchasedServerLimit(); i++) {
        const serverName = SERVER_BASE_NAME + i;
        if (canUpgradeServer(ns, serverName, ramUpgradeSize)) {
            ns.upgradePurchasedServer(serverName, ramUpgradeSize);
        }

        await ns.sleep(1000);
    }
}

function canPurchaseServer(ns: NS, ram: number) {
    const availableMoney = ns.getServerMoneyAvailable("home");
    const serverPrice = ns.getPurchasedServerCost(ram);
    return availableMoney > serverPrice;
}

function canUpgradeServer(ns: NS, serverName: string, ram: number) {
    const availableMoney = ns.getServerMoneyAvailable("home");
    const upgradePrice = ns.getPurchasedServerUpgradeCost(serverName, ram);
    return availableMoney > upgradePrice;
}