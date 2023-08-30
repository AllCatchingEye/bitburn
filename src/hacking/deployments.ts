import { NS, Server } from "@ns";
import { Deployment } from "/hacking/deployment";
import { searchServers } from "/lib/searchServers";
import { mostProfitableServer } from "/lib/profit-functions";

export class Deployments {
  readonly ns: NS;
  deployments: Deployment[];
  target: string;

  constructor(ns: NS) {
    this.ns = ns;
    this.target = mostProfitableServer(this.ns);
    this.deployments = [];
  }

  update(): void {
    this.target = mostProfitableServer(this.ns);
    this.addNewHosts();

    this.deployScripts();
  }

  deployScripts(): void {
    const inactiveDeployments = this.getInactiveDeployments();
    inactiveDeployments.forEach((deployment) =>
      deployment.deployScript(this.ns, this.target)
    );
  }

  addNewHosts(): void {
    const newHosts: Server[] = this.findNewHosts();
    newHosts.forEach((newHost) => this.addHostToDeployments(newHost));
  }

  addHostToDeployments(host: Server): void {
    if (!this.includes(host)) {
      const newDeployment: Deployment = new Deployment(
        this.ns,
        host,
      );
      this.deployments.push(newDeployment);
    }
  }

  getInactiveDeployments(): Deployment[] {
    const inactiveDeployments = this.deployments.filter(
      (deployment) => !deployment.isActive(this.ns)
    );
    return inactiveDeployments;
  }

  includes(host: Server): boolean {
    return this.deployments.map((deployment) => deployment.host.hostname).includes(host.hostname);
  }

  findNewHosts(): Server[] {
    const foundHosts: Server[] = this.findHosts();
    const deployedHosts: Server[] = this.deployments.map(
      (deployment) => deployment.host
    );

    const isNewHost = (host: Server): boolean => {
      return !deployedHosts.includes(host);
    };

    const newHosts: Server[] = foundHosts.filter((foundHost) =>
      isNewHost(foundHost)
    );
    return newHosts;
  }

  findHosts(): Server[] {
    const foundHosts: Server[] = searchServers(this.ns, "home")
      .map((serverName) => this.ns.getServer(serverName))
      .filter((server) => server.hostname !== "home")
      .filter((server) => server.hasAdminRights)
      .filter((server) => server.maxRam !== 0);

    return foundHosts;
  }
}
