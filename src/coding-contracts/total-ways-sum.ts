function totalWaysSum(sum: number): number {
  const ways: number = numberOfWays(sum, sum - 1);
  return ways;
}

function numberOfWays(n: number, k: number): number {
  if (n === 0) return 1;
  if (n < 0 || k <= 0) return 0;

  return numberOfWays(n - k, k) + numberOfWays(n, k - 1);
}
