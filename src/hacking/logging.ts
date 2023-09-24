import { NS, NetscriptPort } from "@ns";

export async function main(ns: NS): Promise<void> {
  const logger: Logger = new Logger(ns);
  logger.listen();
}

export interface Logger {
  ns: NS;
  port: NetscriptPort;
  filename: string;

  listen(): void;
}

export class Logger implements Logger {
  constructor(ns: NS) {
    this.ns = ns;
    this.port = this.ns.getPortHandle(ns.pid);
  }

  async listen(): Promise<void> {
    await this.ns.write(this.filename, "", "w");
    while (true) {
      await this.port.nextWrite();

      const portData: string = this.port.read() as string;

      await this.ns.write("log.txt", portData, "a");

      await this.ns.sleep(100);
    }
  }
}
