export enum hackingScripts {
  Hacking = "/scripts/hack.js",
  Grow = "/scripts/grow.js",
  Weaken = "/scripts/weaken.js",
}

export enum startupScripts {
  startup = "startup.js",
  Cracker = "/hacking/server-cracker.js",
  Watcher = "watcher.js",
  Controller = "/hacking/controller.js",
  Expander = "expand-server.js",
}

export function getStartupScriptsList(): string[] {
  const scripts: string[] = Object.values(startupScripts);
  return scripts;
}

export function getHackingScriptsList(): string[] {
  const scripts: string[] = Object.values(hackingScripts);
  return scripts;
}

export function getBatchScripts(): string[] {
  const scripts = getHackingScriptsList();
  scripts.push(hackingScripts.Weaken);
  return scripts;
}
