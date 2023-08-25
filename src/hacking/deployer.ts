import { NS, Server } from "@ns";
import { Deployment } from "/hacking/deployment";
import { mostProfitableServer } from "/lib/profit-functions";
import { searchServers } from "/lib/searchServers";

export class Deployer {
  ns: NS;
  target: string;
  deployments: Deployment[];

  constructor(ns: NS) {
    this.ns = ns;
    this.target = mostProfitableServer(this.ns);
    this.deployments = [];
  }

  update(): void {
    this.target = mostProfitableServer(this.ns);

    this.addNewHosts();

    const inactiveDeployments = this.getInactiveDeployments();
    inactiveDeployments.forEach((deployment) =>
      deployment.deployScript(this.ns, this.target)
    );
  }

  getInactiveDeployments(): Deployment[] {
    const inactiveDeployments = this.deployments.filter(
      (deployment) => !this.ns.isRunning(deployment.pid)
    );
    return inactiveDeployments;
  }


  addNewHosts(): void {
    const newHosts: Server[] = this.findNewHosts();
    newHosts.forEach(newHost => this.addHostToDeployment(newHost));
  }

  findNewHosts(): Server[] {
    const hosts: Server[] = this.getHosts(this.ns);
    const deployedHosts: Server[] = this.getDeployedHosts();

    const newHosts: Server[] = hosts.filter(host => !deployedHosts.includes(host));
    return newHosts;
  }

  addHostToDeployment(host: Server): void {
    if (!this.hasDeploymentForHost(host)) {
      const newDeployment: Deployment = new Deployment(this.ns, host, this.target);
      this.deployments.push(newDeployment);
    }
  }

  getHosts(ns: NS): Server[] {
    const useableServers: Server[] = searchServers(ns, "home")
      .map((serverName) => ns.getServer(serverName))
      .filter((server) => server.hostname !== "home")
      .filter((server) => server.hasAdminRights)
      .filter((server) => server.maxRam !== 0);

    return useableServers;
  }

  getDeployedHosts(): Server[] {
    return this.deployments.map((deployment) => deployment.host);
  }

  hasDeploymentForHost(host: Server): boolean {
    const deployedHosts = this.getDeployedHosts();
    const hostHasDeployment = deployedHosts.includes(host);
    return hostHasDeployment;
  }
}
