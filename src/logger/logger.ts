import { NS } from '@ns';

export function log(ns: NS, file: string, txt: string, mode: string) {
  ns.write(file, txt, mode);
}
