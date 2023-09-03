import { NS, Server } from "@ns";
import { Deployment } from "/hacking/deployment";
import { searchServers } from "/lib/searchServers";

export class Deployments {
  readonly ns: NS;
  deployedHosts: Set<string>;
  deployments: Deployment[];

  constructor(ns: NS) {
    this.ns = ns;
    this.deployedHosts = new Set<string>();
    this.deployments = [];
  }

  update(): void {
    this.addNewHosts();
  }

  addNewHosts(): void {
    const newHosts: Server[] = this.findNewHosts();
    newHosts
      .filter((host) => !this.deployedHosts.has(host.hostname)) // new hosts
      .forEach((host) => this.addHostToDeployments(host));
  }

  addHostToDeployments(host: Server): void {
    if (this.deployedHosts.has(host.hostname)) {
      const newDeployment: Deployment = new Deployment(
        this.ns,
        host,
      );
      this.deployments.push(newDeployment);
      newDeployment.start();
    }
  }

  findNewHosts(): Server[] {
    const hosts: Server[] = this.findHosts();
    const newHosts: Server[] = hosts.filter((host) =>
      this.deployedHosts.has(host.hostname)
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
