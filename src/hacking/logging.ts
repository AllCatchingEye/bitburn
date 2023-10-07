import { NS, NetscriptPort } from "@ns";
import { preventFreeze } from "/lib/misc";

export async function main(ns: NS): Promise<void> {
  const logger: Logger = new Logger(ns);
  await logger.start();
}

export interface Logger {
  ns: NS;
  port: NetscriptPort;

  start(): void;
}

export class Logger implements Logger {
  constructor(ns: NS) {
    this.ns = ns;
    this.port = this.ns.getPortHandle(ns.pid);
  }

  async start(): Promise<void> {
    await this.ns.write("log.txt", "", "w");
    while (true) {
      await this.log();

      // Prevents freeze
      await preventFreeze(this.ns);
    }
  }

  async log(): Promise<void> {
    while (!this.port.empty()) {
      const portData: string = this.port.read() as string;

      await this.ns.write("log.txt", portData, "a");

      // Prevents freeze
      await preventFreeze(this.ns);
    }
  }
}
