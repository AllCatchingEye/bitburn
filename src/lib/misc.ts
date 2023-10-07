// Simple clamp function
export function clamp(val: number, min: number, max: number): number {
  const clampedVal = Math.min(max, Math.max(min, val));
  return clampedVal;
}

export async function preventFreeze(ns: NS, time = 5): Promise<void> {
  await ns.sleep(time);
}

export function disableNSLogs(ns: NS, functionNames: string[]): void {
  functionNames.forEach((functionName) => {
    ns.disableLog(functionName);
  });
}

export function log(ns: NS, message: string, loggerPid: number): void {
  ns.writePort(loggerPid, message);
}
