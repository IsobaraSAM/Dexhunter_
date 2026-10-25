// @ts-nocheck
// Rolling counters. Rates use a real window. They are never total-tokens / uptime.

const HOUR = 60 * 60 * 1000;

export function createMetrics(now = Date.now()) {
  return {
    startedAt: now,
    cumulative: {
      uniqueTokens: 0,
      liveLaunches: 0,
      searchInserts: 0,
      updates: 0,
      rejected: 0,
      enrichOk: 0,
      enrichFail: 0,
    },
    liveLaunchTimes: [],
    searchInsertTimes: [],
    updateTimes: [],
    rejectedTimes: [],
    enrichOkTimes: [],
    enrichFailTimes: [],
  };
}

function prune(list, now) {
  const floor = now - HOUR;
  while (list.length && list[0] < floor) list.shift();
}

function ratePerMin(list, now, windowMs) {
  if (!windowMs || windowMs <= 0) return 0;
  const floor = now - windowMs;
  let count = 0;
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i] < floor) break;
    count += 1;
  }
  return Math.round((count / windowMs) * 60_000 * 10) / 10;
}

export function recordUnique(metrics, kind, now = Date.now()) {
  metrics.cumulative.uniqueTokens += 1;
  if (kind === "onchain") {
    metrics.cumulative.liveLaunches += 1;
    metrics.liveLaunchTimes.push(now);
  } else if (kind === "backfill") {
    metrics.cumulative.liveLaunches += 1;
  } else {
    metrics.cumulative.searchInserts += 1;
    metrics.searchInsertTimes.push(now);
  }
}

export function recordUpdate(metrics, now = Date.now()) {
  metrics.cumulative.updates += 1;
  metrics.updateTimes.push(now);
}

export function recordRejected(metrics, now = Date.now()) {
  metrics.cumulative.rejected += 1;
  metrics.rejectedTimes.push(now);
}

export function recordEnrichment(metrics, ok, now = Date.now()) {
  if (ok) {
    metrics.cumulative.enrichOk += 1;
    metrics.enrichOkTimes.push(now);
  } else {
    metrics.cumulative.enrichFail += 1;
    metrics.enrichFailTimes.push(now);
  }
}

export function snapshot(metrics, now = Date.now()) {
  for (const list of [
    metrics.liveLaunchTimes,
    metrics.searchInsertTimes,
    metrics.updateTimes,
    metrics.rejectedTimes,
    metrics.enrichOkTimes,
    metrics.enrichFailTimes,
  ]) {
    prune(list, now);
  }
  const windowMs = 60_000;
  return {
    observationWindowMs: windowMs,
    cumulative: { ...metrics.cumulative },
    liveLaunchesPerMin: ratePerMin(metrics.liveLaunchTimes, now, windowMs),
    searchInsertsPerMin: ratePerMin(metrics.searchInsertTimes, now, windowMs),
    updatesPerMin: ratePerMin(metrics.updateTimes, now, windowMs),
    rejectedPerMin: ratePerMin(metrics.rejectedTimes, now, windowMs),
    enrichOkPerMin: ratePerMin(metrics.enrichOkTimes, now, windowMs),
    enrichFailPerMin: ratePerMin(metrics.enrichFailTimes, now, windowMs),
    liveLaunchesLastHour: metrics.liveLaunchTimes.length,
  };
}

export function exportMetrics(metrics) {
  return {
    startedAt: metrics.startedAt,
    cumulative: metrics.cumulative,
    liveLaunchTimes: metrics.liveLaunchTimes.slice(-5000),
    searchInsertTimes: metrics.searchInsertTimes.slice(-2000),
    updateTimes: metrics.updateTimes.slice(-2000),
    rejectedTimes: metrics.rejectedTimes.slice(-2000),
    enrichOkTimes: metrics.enrichOkTimes.slice(-2000),
    enrichFailTimes: metrics.enrichFailTimes.slice(-2000),
  };
}

export function restoreMetrics(raw, now = Date.now()) {
  const metrics = createMetrics(raw?.startedAt || now);
  if (raw?.cumulative) Object.assign(metrics.cumulative, raw.cumulative);
  const copy = (key) => {
    if (Array.isArray(raw?.[key])) metrics[key] = raw[key].filter((t) => typeof t === "number");
  };
  copy("liveLaunchTimes");
  copy("searchInsertTimes");
  copy("updateTimes");
  copy("rejectedTimes");
  copy("enrichOkTimes");
  copy("enrichFailTimes");
  snapshot(metrics, now);
  return metrics;
}
