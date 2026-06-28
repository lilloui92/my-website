const fs = require("fs");

const appText = fs.readFileSync("app.js", "utf8");
const seed = JSON.parse(fs.readFileSync("seed-data.json", "utf8"));
const state = JSON.parse(fs.readFileSync("state.json", "utf8"));
const monthNumbers = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6 };
const failures = [];

function fail(message) {
  failures.push(message);
}

function readConst(name) {
  const match = appText.match(new RegExp(`const ${name} = ([\\s\\S]*?);\\n`));
  if (!match) throw new Error(`Missing ${name}`);
  return Function(`return ${match[1]}`)();
}

function kickoffToUtcMs(kickoff) {
  const match = String(kickoff || "").match(/^(\w{3}) (\d{1,2}) - (\d{1,2}):(\d{2}) (AM|PM)$/);
  if (!match) return null;
  const [, monthName, dayText, hourText, minuteText, suffix] = match;
  let hour = Number(hourText) % 12;
  if (suffix === "PM") hour += 12;
  return Date.UTC(2026, monthNumbers[monthName], Number(dayText), hour - 4, Number(minuteText));
}

const knockoutDisplayOrder = readConst("knockoutDisplayOrder");
const knockoutKickoffs = readConst("knockoutKickoffs");
const thirdPlaceAllocationRules = readConst("thirdPlaceAllocationRules");

if (seed.matches.length !== 72) fail(`Expected 72 group matches, got ${seed.matches.length}`);
const matchIds = new Set(seed.matches.map(match => String(match.id)));
if (matchIds.size !== seed.matches.length) fail("Duplicate group match ids found");
for (const group of "ABCDEFGHIJKL") {
  const count = seed.matches.filter(match => match.group === group).length;
  if (count !== 6) fail(`Group ${group} has ${count} matches, expected 6`);
}

const kickoffIds = Object.keys(knockoutKickoffs).map(Number).sort((a, b) => a - b);
if (kickoffIds.length !== 32 || kickoffIds[0] !== 73 || kickoffIds.at(-1) !== 104) fail("Knockout kickoffs must cover FIFA matches 73-104");
for (const [id, kickoff] of Object.entries(knockoutKickoffs)) {
  if (kickoffToUtcMs(kickoff) === null) fail(`Bad knockout kickoff format for ${id}: ${kickoff}`);
}

const chronologicalKnockouts = kickoffIds.sort((a, b) => kickoffToUtcMs(knockoutKickoffs[a]) - kickoffToUtcMs(knockoutKickoffs[b]) || a - b);
if (JSON.stringify(knockoutDisplayOrder) !== JSON.stringify(chronologicalKnockouts)) {
  fail(`Knockout display order is not UAE kickoff order. Expected ${chronologicalKnockouts.join(",")}, got ${knockoutDisplayOrder.join(",")}`);
}

const display = new Map(knockoutDisplayOrder.map((id, index) => [id, index + 1]));
const expectedPairs = new Map([
  [89, [74, 77]], [90, [73, 75]], [91, [76, 78]], [92, [79, 80]],
  [93, [83, 84]], [94, [81, 82]], [95, [86, 88]], [96, [85, 87]],
  [97, [89, 90]], [98, [93, 94]], [99, [91, 92]], [100, [95, 96]],
  [101, [97, 98]], [102, [99, 100]],
]);
for (const [id, pair] of expectedPairs) {
  const pattern = `{ id: ${id}, pair: [${pair[0]}, ${pair[1]}] }`;
  if (!appText.includes(pattern)) fail(`Missing/changed official bracket pair ${pattern}`);
}
const match17 = [...expectedPairs].find(([id]) => display.get(id) === 17);
if (!match17 || display.get(match17[1][0]) !== 1 || display.get(match17[1][1]) !== 4) {
  fail("Displayed Match 17 must be Winner Match 1 vs Winner Match 4 by UAE kickoff order");
}

if (Object.keys(thirdPlaceAllocationRules).length !== 495) fail("Third-place allocation table must contain all 495 FIFA combinations");
for (const [key, values] of Object.entries(thirdPlaceAllocationRules)) {
  if (key.length !== 8 || values.length !== 8) fail(`Bad third-place rule shape for ${key}`);
  for (const group of values) if (!key.includes(group)) fail(`Rule ${key} assigns non-qualified group ${group}`);
}

for (const player of seed.players) {
  if (!state.predictions[player]) fail(`Missing predictions for ${player}`);
}
for (const [matchId, actual] of Object.entries(state.actuals || {})) {
  if (!matchIds.has(matchId)) fail(`Actual score for unknown group match ${matchId}`);
  if (!/^\d{0,2}$/.test(String(actual.home ?? "")) || !/^\d{0,2}$/.test(String(actual.away ?? ""))) fail(`Bad actual score for match ${matchId}`);
}
for (const [matchId, result] of Object.entries(state.knockoutResults || {})) {
  const numeric = Number(matchId);
  if (numeric < 73 || numeric > 104) fail(`Knockout result for unknown match ${matchId}`);
  if (result.winner && result.winner !== "home" && result.winner !== "away") fail(`Bad knockout winner for match ${matchId}`);
}

if (!appText.includes("function knockoutResultComplete") || !appText.includes("select.winnerSelect")) {
  fail("Knockout tied-result winner selector is missing");
}

if (failures.length) {
  console.error("Audit failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("Audit passed: schedule, knockout numbering, bracket pairs, third-place table, state shape, and tied knockout winner support.");
console.log("Displayed Match 17 = Winner Match 1 vs Winner Match 4.");