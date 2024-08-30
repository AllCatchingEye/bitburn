import { NS } from '@ns';

export async function main(ns: NS) {
  const plaintext = String(ns.args[0]);
  const leftShiftVal = Number(ns.args[1]);

  let ciphered = '';
  for (const char of plaintext) {
    if (char == ' ') continue;

    const charCode = char.charCodeAt(0);
    const shiftedCharCode = ((charCode - 65 - leftShiftVal) % 26) + 65;

    ciphered = ciphered.concat(String.fromCharCode(shiftedCharCode));
  }

  ns.tprintf(ciphered);
}
