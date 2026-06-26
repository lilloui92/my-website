let appState;
try { localStorage.removeItem("selectedPlayer"); } catch {}
let selectedPlayer = "";
let resultMode = false;
let stage = "groups";
const saveTimers = new Map();
let pendingRemoteState = null;
let lockTimer = null;
let refreshInFlight = null;
let lastRefreshAt = 0;

const startScreen = document.querySelector("#startScreen");
const playerStartList = document.querySelector("#playerStartList");
const playerSelect = document.querySelector("#playerSelect");
const leaderboardEl = document.querySelector("#leaderboard");
const groupsView = document.querySelector("#groupsView");
const knockoutView = document.querySelector("#knockoutView");
const resultModeButton = document.querySelector("#resultMode");
const resultEntryPanel = document.querySelector("#resultEntryPanel");
const resultEntryList = document.querySelector("#resultEntryList");
const knockoutEditor = document.querySelector("#knockoutEditor");
const knockoutList = document.querySelector("#knockoutList");
const standingsView = document.querySelector("#standingsView");
const autoKnockoutList = document.querySelector("#autoKnockoutList");

const monthNumbers = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

const lockIcon = "\uD83D\uDD12";

const teamFlags = {
  MEX: "MX", RSA: "ZA", KOR: "KR", CZE: "CZ", CAN: "CA", BIH: "BA", QAT: "QA", SUI: "CH",
  BRA: "BR", MAR: "MA", HAI: "HT", SCO: "GB", USA: "US", PAR: "PY", AUS: "AU", TUR: "TR",
  GER: "DE", CUR: "CW", CIV: "CI", ECU: "EC", NED: "NL", JPN: "JP", SWE: "SE", TUN: "TN",
  BEL: "BE", EGY: "EG", IRN: "IR", NZL: "NZ", ESP: "ES", CPV: "CV", SAU: "SA", URU: "UY",
  FRA: "FR", SEN: "SN", IRQ: "IQ", NOR: "NO", ARG: "AR", ALG: "DZ", AUT: "AT", JOR: "JO",
  POR: "PT", COD: "CD", UZB: "UZ", COL: "CO", ENG: "GB", CRO: "HR", GHA: "GH", PAN: "PA",
};

const knockoutKickoffs = {
  73: "Jun 28 - 11:00 PM",
  74: "Jun 30 - 12:30 AM",
  75: "Jun 30 - 5:00 AM",
  76: "Jun 29 - 9:00 PM",
  77: "Jul 1 - 1:00 AM",
  78: "Jun 30 - 9:00 PM",
  79: "Jul 1 - 5:00 AM",
  80: "Jul 1 - 8:00 PM",
  81: "Jul 2 - 4:00 AM",
  82: "Jul 2 - 12:00 AM",
  83: "Jul 3 - 3:00 AM",
  84: "Jul 2 - 11:00 PM",
  85: "Jul 3 - 7:00 AM",
  86: "Jul 4 - 2:00 AM",
  87: "Jul 4 - 5:30 AM",
  88: "Jul 3 - 10:00 PM",
  89: "Jul 5 - 1:00 AM",
  90: "Jul 4 - 9:00 PM",
  91: "Jul 6 - 12:00 AM",
  92: "Jul 6 - 4:00 AM",
  93: "Jul 6 - 11:00 PM",
  94: "Jul 7 - 4:00 AM",
  95: "Jul 7 - 8:00 PM",
  96: "Jul 8 - 12:00 AM",
  97: "Jul 10 - 12:00 AM",
  98: "Jul 10 - 11:00 PM",
  99: "Jul 12 - 1:00 AM",
  100: "Jul 12 - 5:00 AM",
  101: "Jul 14 - 11:00 PM",
  102: "Jul 15 - 11:00 PM",
  103: "Jul 19 - 1:00 AM",
  104: "Jul 19 - 11:00 PM",
};

refreshState({ force: true });

async function refreshState(options = {}) {
  const now = Date.now();
  const minimumGap = options.force ? 0 : 900;
  if (refreshInFlight) return refreshInFlight;
  if (now - lastRefreshAt < minimumGap) return null;
  lastRefreshAt = now;
  refreshInFlight = fetch("/api/state")
    .then(response => response.json())
    .then(state => {
      if (isEditingScore() && !options.forceRender) {
        pendingRemoteState = state;
        return state;
      }
      applyState(state);
      return state;
    })
    .catch(() => null)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

function refreshFromActivity() {
  if (lockActiveStartedPrediction()) return;
  refreshState();
}

function enforceVisibleMatchLocks() {
  if (!appState) return;
  const openLatePrediction = [...document.querySelectorAll('input.score[data-kind="prediction"]:not(:disabled)')]
    .some(input => hasMatchStarted(matchById(input.dataset.match)?.kickoff));
  if (!openLatePrediction) return;
  render();
  refreshState({ force: true });
}

function lockActiveStartedPrediction() {
  const active = document.activeElement;
  if (!active?.matches?.('input.score[data-kind="prediction"]')) return false;
  if (!hasMatchStarted(matchById(active.dataset.match)?.kickoff)) return false;
  render();
  return true;
}

const events = new EventSource("/events");
events.onmessage = event => {
  const state = JSON.parse(event.data);
  if (isEditingScore()) {
    pendingRemoteState = state;
    return;
  }
  applyState(state);
};

events.onerror = () => {
  setTimeout(refreshState, 1000);
};

setInterval(refreshState, 3000);
setInterval(enforceVisibleMatchLocks, 1000);
document.addEventListener("pointerdown", refreshFromActivity, true);
document.addEventListener("focusin", refreshFromActivity, true);
document.addEventListener("keydown", refreshFromActivity, true);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) refreshState({ force: true });
});
window.addEventListener("focus", () => refreshState({ force: true }));
window.addEventListener("online", () => refreshState({ force: true }));

playerSelect.addEventListener("change", () => {
  selectedPlayer = playerSelect.value;
  render();
});

resultModeButton.addEventListener("click", () => {
  resultMode = !resultMode;
  render();
});

document.querySelectorAll(".tabs button").forEach(button => {
  button.addEventListener("click", () => {
    stage = button.dataset.stage;
    render();
  });
});

const saveKnockoutButton = document.querySelector("#saveKnockout");
if (saveKnockoutButton) {
  saveKnockoutButton.addEventListener("click", async () => {
    const knockout = knockoutEditor.value.split("\n").map(line => line.trim()).filter(Boolean);
    await post("/api/knockout", { knockout });
  });
}

async function post(url, body, options = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    alert(data?.error || "Could not save");
    return null;
  }
  if (data) {
    appState = data;
    if (options.render !== false && !isEditingScore()) render();
  }
  return data;
}

function applyState(state) {
  appState = state;
  if (selectedPlayer && !appState.players.includes(selectedPlayer)) selectedPlayer = "";
  render();
}

function isEditingScore() {
  return document.activeElement?.matches?.("input.score");
}

function render() {
  if (!appState) return;
  appState.knockoutResults ||= {};
  renderStartScreen();
  scheduleNextKickoffLock();
  playerSelect.innerHTML = appState.players.map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join("");
  playerSelect.value = selectedPlayer || appState.players[0];
  resultModeButton.classList.toggle("active", resultMode);
  resultModeButton.textContent = resultMode ? "Close results" : "Enter results";
  document.querySelectorAll(".tabs button").forEach(button => button.classList.toggle("active", button.dataset.stage === stage));
  groupsView.classList.toggle("hidden", stage !== "groups");
  knockoutView.classList.toggle("hidden", stage !== "knockout");
  renderLeaderboard();
  renderResultEntry();
  renderGroups();
  renderKnockout();
  bindScoreInputs();
  bindKnockoutInputs();
}

function renderStartScreen() {
  const needsPlayer = !selectedPlayer;
  document.body.classList.toggle("needsPlayer", needsPlayer);
  startScreen.classList.toggle("hidden", !needsPlayer);
  playerStartList.innerHTML = appState.players.map(player => `<button type="button" data-player="${escapeHtml(player)}">${escapeHtml(player)}</button>`).join("");
  playerStartList.querySelectorAll("button").forEach(button => {
    button.addEventListener("click", () => {
      selectedPlayer = button.dataset.player;
      render();
    });
  });
}

function scheduleNextKickoffLock() {
  clearTimeout(lockTimer);
  const matches = [
    ...appState.matches,
    ...getKnockoutRounds(getStandings()).flatMap(round => round.matches),
  ];
  const nextTime = matches
    .map(match => kickoffToUtcMs(match.kickoff))
    .filter(time => time !== null && time > Date.now())
    .sort((a, b) => a - b)[0];
  if (!nextTime) return;
  const delay = Math.min(nextTime - Date.now() + 50, 2_147_483_647);
  lockTimer = setTimeout(() => {
    const active = document.activeElement;
    if (active?.matches?.('input.score') && active.dataset.kind !== 'prediction') {
      scheduleNextKickoffLock();
      return;
    }
    render();
    refreshState();
  }, delay);
}

function compareMatchTime(a, b) {
  return (kickoffToUtcMs(a.kickoff) ?? Number.MAX_SAFE_INTEGER) - (kickoffToUtcMs(b.kickoff) ?? Number.MAX_SAFE_INTEGER) || a.id - b.id;
}

function hasMatchStarted(kickoff) {
  const startedAt = kickoffToUtcMs(kickoff);
  return startedAt !== null && Date.now() >= startedAt;
}

function kickoffToUtcMs(kickoff) {
  const match = String(kickoff || "").match(/^(\w{3}) (\d{1,2}) - (\d{1,2}):(\d{2}) (AM|PM)$/);
  if (!match) return null;
  const [, monthName, dayText, hourText, minuteText, suffix] = match;
  let hour = Number(hourText) % 12;
  if (suffix === "PM") hour += 12;
  return Date.UTC(2026, monthNumbers[monthName], Number(dayText), hour - 4, Number(minuteText));
}

function renderLeaderboard() {
  leaderboardEl.innerHTML = leaderboard().map((row, index) => `
    <div class="leader">
      <span>${index + 1}. ${escapeHtml(row.player)}</span>
      <strong>${row.points}</strong>
    </div>
  `).join("");
}

function leaderboard() {
  const knockoutMatches = getKnockoutRounds(getStandings()).flatMap(round => round.matches);
  return appState.players.map(player => ({
    player,
    points: appState.matches.reduce((total, match) => total + pointsFor(player, match), 0) +
      knockoutMatches.reduce((total, match) => total + pointsFor(player, match, appState.knockoutResults?.[String(match.id)] || {}), 0),
  })).sort((a, b) => b.points - a.points || a.player.localeCompare(b.player));
}

function renderGroups() {
  const groups = Object.groupBy ? Object.groupBy(appState.matches, m => m.group) : groupBy(appState.matches, m => m.group);
  groupsView.innerHTML = Object.entries(groups).map(([group, matches]) => `
    <article class="group group-${group}">
      <div class="groupHead">
        <h3>Group ${group}</h3>
        <div class="teams">${(appState.teams[group] || []).map(t => `${t.flag} ${escapeHtml(t.name)}`).join(" - ")}</div>
      </div>
      ${matches.map(renderMatch).join("")}
    </article>
  `).join("");
}

function renderResultEntry() {
  if (!resultEntryPanel || !resultEntryList) return;
  resultEntryPanel.classList.toggle("hidden", !resultMode);
  if (!resultMode) {
    resultEntryList.innerHTML = "";
    return;
  }

  const groupRows = [...appState.matches]
    .sort(compareMatchTime)
    .map((match, index) => resultEntryRow(match, "result", appState.actuals[String(match.id)] || { home: "", away: "" }, false, "", index + 1))
    .join("");

  const knockoutRows = getKnockoutRounds(getStandings())
    .flatMap(round => round.matches.map(match => ({ ...match, round: round.name })))
    .sort(compareMatchTime)
    .map(match => {
      const result = appState.knockoutResults[String(match.id)] || { home: "", away: "" };
      const disabled = match.home.startsWith("TBD") || match.away.startsWith("TBD");
      return resultEntryRow(match, "knockout-result", result, disabled, match.round, match.id - 72);
    })
    .join("");

  resultEntryList.innerHTML = `
    <section class="resultSection">
      <h3>Match Results</h3>
      ${groupRows}
    </section>
    <section class="resultSection">
      <h3>Knockout Results</h3>
      ${knockoutRows}
    </section>
  `;
}

function resultEntryRow(match, kind, actual, disabled = false, label = "", displayNumber = match.id) {
  const done = actual.home !== "" && actual.away !== "";
  const detail = label ? `${label} - ${match.kickoff || "Time TBD"}` : (match.kickoff || "Time TBD");
  return `
    <div class="resultRow ${done ? "resultDone" : ""} ${disabled ? "resultDisabled" : ""}">
      <div class="resultInfo">
        <strong>#${displayNumber}</strong>
        <span>${escapeHtml(detail)}</span>
      </div>
      <div class="resultTeamsInline">
        <strong>${teamName(match.home)}</strong>
        <span>vs</span>
        <strong>${teamName(match.away)}</strong>
      </div>
      <div class="scoreInputs resultScore">
        <input class="score" data-kind="${kind}" data-match="${match.id}" data-side="home" value="${escapeHtml(actual.home)}" ${disabled ? "disabled" : ""} inputmode="numeric" maxlength="2" placeholder="-">
        <span>:</span>
        <input class="score" data-kind="${kind}" data-match="${match.id}" data-side="away" value="${escapeHtml(actual.away)}" ${disabled ? "disabled" : ""} inputmode="numeric" maxlength="2" placeholder="-">
      </div>
    </div>
  `;
}

function groupDisplayNumber(match) {
  const sorted = [...appState.matches].sort(compareMatchTime);
  return sorted.findIndex(item => item.id === match.id) + 1;
}

function knockoutDisplayNumber(match) {
  const sorted = getKnockoutRounds(getStandings()).flatMap(round => round.matches).sort(compareMatchTime);
  return sorted.findIndex(item => item.id === match.id) + 1;
}

function renderMatch(match) {
  const prediction = appState.predictions[selectedPlayer]?.[match.id] || { home: "", away: "" };
  const actual = appState.actuals[String(match.id)] || { home: match.actualHome || "", away: match.actualAway || "" };
  const done = actual.home !== "" && actual.away !== "";
  const started = hasMatchStarted(match.kickoff);
  const disabled = done || resultMode || started;
  const points = pointsFor(selectedPlayer, match);
  const resultClass = done ? ` result-${points}` : "";
  const pointText = done ? `${lockIcon} ${points} pt${points === 1 ? "" : "s"}` : started ? `${lockIcon} locked` : "TBD";
  return `
    <div class="match${resultClass}">
      <div class="matchMeta">
        <span>Match ${groupDisplayNumber(match)}</span>
        <span>${escapeHtml(match.kickoff)}</span>
      </div>
      <div class="scoreline">
        <strong>${teamName(match.home)}</strong>
        <div class="scoreInputs">
          <input class="score" data-kind="prediction" data-match="${match.id}" data-side="home" value="${escapeHtml(prediction.home)}" ${disabled ? "disabled" : ""} inputmode="numeric" maxlength="2" placeholder="-">
          <span>:</span>
          <input class="score" data-kind="prediction" data-match="${match.id}" data-side="away" value="${escapeHtml(prediction.away)}" ${disabled ? "disabled" : ""} inputmode="numeric" maxlength="2" placeholder="-">
        </div>
        <strong class="teamRight">${teamName(match.away)}</strong>
      </div>
      <div class="actual">
        <span>Actual: ${done ? `${actual.home} - ${actual.away}` : "TBD"}</span>
        <span class="points">${pointText}</span>
      </div>
      ${done ? revealPredictions(match) : ""}
    </div>
  `;
}

function resultInputs(match, actual) {
  return `
    <span>Actual</span>
    <span class="scoreInputs">
      <input class="score" data-kind="result" data-match="${match.id}" data-side="home" value="${escapeHtml(actual.home)}" inputmode="numeric" maxlength="2" placeholder="-">
      <span>:</span>
      <input class="score" data-kind="result" data-match="${match.id}" data-side="away" value="${escapeHtml(actual.away)}" inputmode="numeric" maxlength="2" placeholder="-">
    </span>
  `;
}

function revealPredictions(match) {
  return `<div class="reveal">${
    appState.players.filter(player => player !== selectedPlayer).map(player => {
      const pred = appState.predictions[player]?.[match.id] || { home: "", away: "" };
      const shown = pred.home !== "" && pred.away !== "" ? `${pred.home}-${pred.away}` : "--";
      return `${escapeHtml(player)}: ${shown}`;
    }).join(" | ")
  }</div>`;
}

function bindScoreInputs() {
  document.querySelectorAll("input.score").forEach(input => {
    input.addEventListener("input", () => {
      input.value = input.value.replace(/\D/g, "").slice(0, 2);
      scheduleScoreSave(input.dataset.kind, input.dataset.match);
    });
    input.addEventListener("change", () => saveScore(input.dataset.kind, input.dataset.match, true));
    input.addEventListener("blur", () => {
      saveScore(input.dataset.kind, input.dataset.match, true);
      if (pendingRemoteState) {
        const state = pendingRemoteState;
        pendingRemoteState = null;
        setTimeout(() => applyState(state), 0);
      }
    });
  });
}

function matchById(matchId) {
  return appState.matches.find(match => String(match.id) === String(matchId)) ||
    getKnockoutRounds(getStandings()).flatMap(round => round.matches).find(match => String(match.id) === String(matchId));
}

function scheduleScoreSave(kind, matchId) {
  const key = kind + ":" + matchId;
  clearTimeout(saveTimers.get(key));
  saveTimers.set(key, setTimeout(() => saveScore(kind, matchId), 450));
}

async function saveScore(kind, matchId, renderAfterSave = false) {
  const fields = [...document.querySelectorAll(`input.score[data-kind="${kind}"][data-match="${matchId}"]`)];
  const homeField = fields.find(field => field.dataset.side === "home");
  const awayField = fields.find(field => field.dataset.side === "away");
  if (!homeField || !awayField) return;
  if (kind === "prediction" && hasMatchStarted(matchById(matchId)?.kickoff)) {
    render();
    alert("This match already started");
    return;
  }
  const home = homeField.value;
  const away = awayField.value;
  if (kind === "prediction") await post("/api/prediction", { player: selectedPlayer, matchId, home, away }, { render: renderAfterSave });
  if (kind === "result") await post("/api/result", { matchId, home, away }, { render: renderAfterSave });
  if (kind === "knockout-result") await post("/api/knockout-result", { matchId, home, away }, { render: renderAfterSave });
}
function pointsFor(player, match, actualOverride) {
  const pred = appState.predictions[player]?.[match.id] || {};
  const actual = actualOverride || appState.actuals[String(match.id)] || {};
  if (actual.home === "" || actual.away === "" || pred.home === "" || pred.away === "") return 0;
  const ph = Number(pred.home), pa = Number(pred.away), ah = Number(actual.home), aa = Number(actual.away);
  if ([ph, pa, ah, aa].some(Number.isNaN)) return 0;
  if (ph === ah && pa === aa) return 2;
  return Math.sign(ph - pa) === Math.sign(ah - aa) ? 1 : 0;
}

function renderKnockout() {
  appState.knockoutResults ||= {};
  const standings = getStandings();
  const rounds = getKnockoutRounds(standings);
  standingsView.innerHTML = Object.entries(standings.groups).map(([group, rows]) => `
    <div class="standingGroup">
      <h4>Group ${group}</h4>
      <div class="standingRow"><strong>#</strong><strong>Team</strong><strong>Pts</strong><strong>GD</strong><strong>GF</strong><strong>P</strong></div>
      ${rows.map((row, index) => `
        <div class="standingRow ${standings.completeGroups[group] ? "complete" : "live"}">
          <span>${index + 1}</span>
          <span>${escapeHtml(row.team)}</span>
          <span>${row.points}</span>
          <span>${row.goalDiff}</span>
          <span>${row.goalsFor}</span>
          <span>${row.played}</span>
        </div>
      `).join("")}
    </div>
  `).join("");
  autoKnockoutList.innerHTML = rounds.map(round => `
    <section class="bracketRound">
      <h4>${round.name}</h4>
      <div class="bracket">
        ${round.matches.map(renderKnockoutMatch).join("")}
      </div>
    </section>
  `).join("");
  if (knockoutEditor && knockoutList) {
    const lines = appState.knockout || [];
    knockoutEditor.value = lines.join("\n");
    knockoutList.innerHTML = lines.length ? `<ol>${lines.map(line => `<li>${escapeHtml(line)}</li>`).join("")}</ol>` : "";
  }
}

function renderKnockoutMatch(match) {
  const result = appState.knockoutResults[String(match.id)] || { home: "", away: "" };
  const prediction = appState.predictions[selectedPlayer]?.[match.id] || { home: "", away: "" };
  const homeKnown = !match.home.startsWith("TBD");
  const awayKnown = !match.away.startsWith("TBD");
  const ready = homeKnown && awayKnown;
  const done = ready && result.home !== "" && result.away !== "" && result.home !== result.away;
  const started = hasMatchStarted(match.kickoff);
  const predictionDisabled = !ready || done || resultMode || started;
  const points = pointsFor(selectedPlayer, match, result);
  const resultClass = done ? ` result-${points}` : "";
  const pointText = done ? `${lockIcon} ${points} pt${points === 1 ? "" : "s"}` : ready && !started ? "TBD" : started ? `${lockIcon} locked` : "TBD";
  return `
    <div class="bracketMatch ${done ? "locked" : ready ? "ready" : "waiting"}${resultClass}">
      <strong>Match ${knockoutDisplayNumber(match)}</strong>
      <div class="matchMeta knockoutMeta"><span>${escapeHtml(match.kickoff || "Time TBD")}</span></div>
      <span class="slot ${homeKnown ? "known" : "unknown"}">${teamName(match.home)}</span>
      <div class="scoreInputs knockoutPredict">
        <input class="score" data-kind="prediction" data-match="${match.id}" data-side="home" value="${escapeHtml(prediction.home)}" ${predictionDisabled ? "disabled" : ""} inputmode="numeric" maxlength="2" placeholder="-">
        <span class="versus">:</span>
        <input class="score" data-kind="prediction" data-match="${match.id}" data-side="away" value="${escapeHtml(prediction.away)}" ${predictionDisabled ? "disabled" : ""} inputmode="numeric" maxlength="2" placeholder="-">
      </div>
      <span class="slot ${awayKnown ? "known" : "unknown"}">${teamName(match.away)}</span>
      <div class="actual knockoutActual">
        <span>Actual: ${done ? `${result.home} - ${result.away}` : "TBD"}</span>
        <span class="points">${pointText}</span>
      </div>
      <small>${done ? `Winner: ${escapeHtml(winnerOf(match))}` : ready && !started ? "Ready for predictions" : started ? "Kickoff passed" : "Waiting for confirmed team"}</small>
      ${done ? revealPredictions(match) : ""}
    </div>
  `;
}

function knockoutResultInputs(match, result, ready) {
  return `
    <span class="scoreInputs knockoutScore">
      <input class="score" data-kind="knockout-result" data-match="${match.id}" data-side="home" value="${escapeHtml(result.home)}" ${ready ? "" : "disabled"} inputmode="numeric" maxlength="2" placeholder="-">
      <span>:</span>
      <input class="score" data-kind="knockout-result" data-match="${match.id}" data-side="away" value="${escapeHtml(result.away)}" ${ready ? "" : "disabled"} inputmode="numeric" maxlength="2" placeholder="-">
    </span>
    <small>${ready ? "Enter knockout result" : "Team not known yet"}</small>
  `;
}

function bindKnockoutInputs() {
}

function getStandings() {
  const groups = {};
  for (const match of appState.matches) {
    groups[match.group] ||= {};
    groups[match.group][match.home] ||= emptyTeam(match.home, match.group);
    groups[match.group][match.away] ||= emptyTeam(match.away, match.group);
    const actual = appState.actuals[String(match.id)] || {};
    if (actual.home === "" || actual.away === "") continue;
    const homeGoals = Number(actual.home);
    const awayGoals = Number(actual.away);
    if (Number.isNaN(homeGoals) || Number.isNaN(awayGoals)) continue;
    applyResult(groups[match.group][match.home], homeGoals, awayGoals);
    applyResult(groups[match.group][match.away], awayGoals, homeGoals);
  }
  const sortedGroups = {};
  for (const [group, teams] of Object.entries(groups)) {
    sortedGroups[group] = Object.values(teams).sort(compareTeams);
  }
  const completeGroups = {};
  for (const group of Object.keys(sortedGroups)) {
    const groupMatches = appState.matches.filter(match => match.group === group);
    completeGroups[group] = groupMatches.every(match => {
      const actual = appState.actuals[String(match.id)] || {};
      return actual.home !== "" && actual.away !== "";
    });
  }
  const confirmedThirds = Object.entries(sortedGroups)
    .filter(([group]) => completeGroups[group])
    .map(([group, rows]) => ({ ...rows[2], group, position: `${group}3` }))
    .filter(row => row.points >= 4)
    .sort(compareTeams);
  return { groups: sortedGroups, completeGroups, confirmedThirds };
}

function emptyTeam(team, group) {
  return { team, group, played: 0, points: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0 };
}

function applyResult(row, scored, conceded) {
  row.played += 1;
  row.goalsFor += scored;
  row.goalsAgainst += conceded;
  row.goalDiff = row.goalsFor - row.goalsAgainst;
  row.points += scored > conceded ? 3 : scored === conceded ? 1 : 0;
}

function compareTeams(a, b) {
  return b.points - a.points ||
    b.goalDiff - a.goalDiff ||
    b.goalsFor - a.goalsFor ||
    a.team.localeCompare(b.team);
}

function getKnockoutRounds(standings) {
  const round32 = getRoundOf32(standings);
  const round16 = pairRound(round32, [
    { id: 89, pair: [74, 77] },
    { id: 90, pair: [73, 75] },
    { id: 91, pair: [76, 78] },
    { id: 92, pair: [79, 80] },
    { id: 93, pair: [83, 84] },
    { id: 94, pair: [81, 82] },
    { id: 95, pair: [86, 88] },
    { id: 96, pair: [85, 87] },
  ]);
  const quarters = pairRound(round16, [
    { id: 97, pair: [89, 90] },
    { id: 98, pair: [93, 94] },
    { id: 99, pair: [91, 92] },
    { id: 100, pair: [95, 96] },
  ]);
  const semis = pairRound(quarters, [
    { id: 101, pair: [97, 98] },
    { id: 102, pair: [99, 100] },
  ]);
  const thirdPlace = withKickoffs([{ id: 103, home: loserOfMatch(semis, 101), away: loserOfMatch(semis, 102) }]);
  const final = withKickoffs([{ id: 104, home: winnerOfMatch(semis, 101), away: winnerOfMatch(semis, 102) }]);
  return [
    { name: "Round of 32", matches: round32 },
    { name: "Round of 16", matches: round16 },
    { name: "Quarter-finals", matches: quarters },
    { name: "Semi-finals", matches: semis },
    { name: "Third place", matches: thirdPlace },
    { name: "Final", matches: final },
  ];
}

function pairRound(previousMatches, matchDefs) {
  return withKickoffs(matchDefs.map(({ id, pair }) => ({
    id,
    home: winnerOfMatch(previousMatches, pair[0]),
    away: winnerOfMatch(previousMatches, pair[1]),
  })));
}

function withKickoffs(matches) {
  return matches.map(match => ({ ...match, kickoff: knockoutKickoffs[match.id] || "Time TBD" }));
}

function winnerOfMatch(matches, id) {
  const match = matches.find(item => item.id === id);
  if (!match) return `TBD Winner M${id}`;
  return winnerOf(match) || `TBD Winner M${id}`;
}

function loserOfMatch(matches, id) {
  const match = matches.find(item => item.id === id);
  if (!match) return `TBD Loser M${id}`;
  const result = appState.knockoutResults[String(id)] || {};
  if (match.home.startsWith("TBD") || match.away.startsWith("TBD")) return `TBD Loser M${id}`;
  if (result.home === "" || result.away === "" || result.home === result.away) return `TBD Loser M${id}`;
  return Number(result.home) < Number(result.away) ? match.home : match.away;
}

function winnerOf(match) {
  const result = appState.knockoutResults[String(match.id)] || {};
  if (match.home.startsWith("TBD") || match.away.startsWith("TBD")) return "";
  if (result.home === "" || result.away === "" || result.home === result.away) return "";
  return Number(result.home) > Number(result.away) ? match.home : match.away;
}

function getRoundOf32(standings) {
  const groupTeam = (group, index) => {
    if (!standings.completeGroups[group]) return `TBD ${group}${index + 1}`;
    return standings.groups[group]?.[index]?.team || `TBD ${group}${index + 1}`;
  };
  const third = groups => `TBD 3rd ${groups.join("/")}`;
  return withKickoffs([
    { id: 73, home: groupTeam("A", 1), away: groupTeam("B", 1) },
    { id: 74, home: groupTeam("E", 0), away: third(["A", "B", "C", "D", "F"]) },
    { id: 75, home: groupTeam("F", 0), away: groupTeam("C", 1) },
    { id: 76, home: groupTeam("C", 0), away: groupTeam("F", 1) },
    { id: 77, home: groupTeam("I", 0), away: third(["C", "D", "F", "G", "H"]) },
    { id: 78, home: groupTeam("E", 1), away: groupTeam("I", 1) },
    { id: 79, home: groupTeam("A", 0), away: third(["C", "E", "F", "H", "I"]) },
    { id: 80, home: groupTeam("L", 0), away: third(["E", "H", "I", "J", "K"]) },
    { id: 81, home: groupTeam("D", 0), away: third(["B", "E", "F", "I", "J"]) },
    { id: 82, home: groupTeam("G", 0), away: third(["A", "E", "H", "I", "J"]) },
    { id: 83, home: groupTeam("K", 1), away: groupTeam("L", 1) },
    { id: 84, home: groupTeam("H", 0), away: groupTeam("J", 1) },
    { id: 85, home: groupTeam("B", 0), away: third(["E", "F", "G", "I", "J"]) },
    { id: 86, home: groupTeam("J", 0), away: groupTeam("H", 1) },
    { id: 87, home: groupTeam("K", 0), away: third(["D", "E", "I", "J", "L"]) },
    { id: 88, home: groupTeam("D", 1), away: groupTeam("G", 1) },
  ]);
}
function groupBy(items, keyFn) {
  return items.reduce((acc, item) => {
    const key = keyFn(item);
    acc[key] ||= [];
    acc[key].push(item);
    return acc;
  }, {});
}

function flagEmoji(countryCode) {
  if (!countryCode) return "";
  return countryCode.toUpperCase().replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

function teamName(team) {
  const text = String(team ?? "");
  if (text.startsWith("TBD")) return escapeHtml(text);
  const flag = flagEmoji(teamFlags[text]);
  return `${flag ? `${flag} ` : ""}${escapeHtml(text)}`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;",
  }[char]));
}
