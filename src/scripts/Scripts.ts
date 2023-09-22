export enum hackingScripts {
  Hacking = "/scripts/hack.js",
  Grow = "/scripts/grow.js",
  Weaken = "/scripts/weaken.js",
}

export function getScriptsList(): string[] {
  const scripts: string[] = Object.values(hackingScripts);
  return scripts;
}

export function getBatchScripts(): string[] {
  const scripts: string[] = [
    hackingScripts.Hacking,
    hackingScripts.Weaken,
    hackingScripts.Grow,
    hackingScripts.Weaken,
  ];

  return scripts;
}
