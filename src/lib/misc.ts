// Simple clamp function
export function clamp(val: number, min: number, max: number): number {
  const clampedVal = Math.min(max, Math.max(min, val));
  return clampedVal;
}
