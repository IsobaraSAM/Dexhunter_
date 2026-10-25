// Generation for the 3s discovery poll. A tick keeps the number it opened
// with. The next browse change opens a new number, and a response from the
// previous number must not merge.

/** @param {number} generation */
export function openDiscoveryPoll(generation) {
  return (generation || 0) + 1;
}

/**
 * @param {number} opened
 * @param {number} generation
 * @param {boolean} serverPaged
 * @param {boolean} wantServerPaged
 * @param {number} tokenCount
 */
export function acceptDiscoveryPoll(opened, generation, serverPaged, wantServerPaged, tokenCount) {
  if (opened !== generation) return false;
  if (Boolean(serverPaged) !== Boolean(wantServerPaged)) return false;
  return tokenCount > 0;
}
