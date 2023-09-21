export enum Scripts {
  Hacking = "/hacking/hack.js",
  Grow = "/hacking/grow.js",
  Weaken = "/hacking/weaken.js",
}

export function getScriptsList(): string[] {
  const scripts: string[] = Object.values(Scripts);
  return scripts;
}
