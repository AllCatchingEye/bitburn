import { NS } from '@ns';

export type Job = {
  script: string;
  target: string;
  threads: number;
  delay: number;
};

export async function main(ns: NS) {
  const port = ns.getPortHandle(ns.pid);

  while (true) {
    if (port.empty()) await port.nextWrite();

    const data = port.read();
    if (data != 'NULL PORT DATA') {
      const job: Job = JSON.parse(data);
      ns.run(job.script, job.threads, job.target, job.delay);
    }
  }
}
