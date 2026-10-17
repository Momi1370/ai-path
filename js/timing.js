// Last index whose value is <= x (0 if x is before the first).
export function lastAtOrBefore(values, x) {
  let lo = 0, hi = values.length - 1, ans = 0;
  while (lo <= hi) { const mid = (lo + hi) >> 1; if (values[mid] <= x) { ans = mid; lo = mid + 1; } else hi = mid - 1; }
  return ans;
}
