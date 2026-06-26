const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");

const root = __dirname;
const seed = JSON.parse(fs.readFileSync(path.join(root, "seed-data.json"), "utf8"));
const bundledStatePath = path.join(root, "state.json");
const statePath = process.env.STATE_PATH || bundledStatePath;
const clients = new Set();

const monthNumbers = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

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

function defaultState() {
  if (fs.existsSync(bundledStatePath)) return JSON.parse(fs.readFileSync(bundledStatePath, "utf8"));
  return { predictions: seed.predictions, actuals: {}, knockout: [], knockoutResults: {} };
}

function readState() {
  if (!fs.existsSync(statePath)) {
    const state = defaultState();
    writeStateFile(state);
    return state;
  }
  return JSON.parse(fs.readFileSync(statePath, "utf8"));
}

function writeStateFile(state) {
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2), "utf8");
}

function writeState(state) {
  writeStateFile(state);
  broadcast();
}

function publicState() {
  return { ...seed, ...readState() };
}

function appInfo(port) {
  const networkUrls = [];
  for (const addresses of Object.values(os.networkInterfaces())) {
    for (const address of addresses || []) {
      if (address.family === "IPv4" && !address.internal) {
        networkUrls.push(`http://${address.address}:${port}/`);
      }
    }
  }
  return {
    localUrl: `http://localhost:${port}/`,
    networkUrls,
  };
}

function hasMatchStarted(matchId) {
  const groupMatch = seed.matches.find(match => String(match.id) === String(matchId));
  const kickoff = groupMatch?.kickoff || knockoutKickoffs[String(matchId)];
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

function sendJson(res, status, data) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

function broadcast() {
  const payload = `data: ${JSON.stringify(publicState())}\n\n`;
  for (const res of clients) res.write(payload);
}

function staticFile(res, file, type) {
  fs.readFile(path.join(root, file), (error, content) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "content-type": type });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/") return staticFile(res, "index.html", "text/html; charset=utf-8");
    if (req.method === "GET" && req.url === "/styles.css") return staticFile(res, "styles.css", "text/css; charset=utf-8");
    if (req.method === "GET" && req.url === "/app.js") return staticFile(res, "app.js", "text/javascript; charset=utf-8");
    if (req.method === "GET" && req.url === "/api/state") return sendJson(res, 200, publicState());
    if (req.method === "GET" && req.url === "/api/info") return sendJson(res, 200, appInfo(port));
    if (req.method === "GET" && req.url === "/events") {
      res.writeHead(200, {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        connection: "keep-alive",
      });
      clients.add(res);
      res.write(`data: ${JSON.stringify(publicState())}\n\n`);
      req.on("close", () => clients.delete(res));
      return;
    }

    if (req.method === "POST" && req.url === "/api/prediction") {
      const { player, matchId, home, away } = await parseBody(req);
      if (!seed.players.includes(player)) return sendJson(res, 400, { error: "Unknown player" });
      const state = readState();
      const groupActual = state.actuals[String(matchId)] || {};
      const knockoutActual = state.knockoutResults?.[String(matchId)] || {};
      const resultEntered = (groupActual.home !== undefined && groupActual.home !== "" && groupActual.away !== undefined && groupActual.away !== "") ||
        (knockoutActual.home !== undefined && knockoutActual.home !== "" && knockoutActual.away !== undefined && knockoutActual.away !== "");
      if (resultEntered) return sendJson(res, 409, { error: "Result already entered" });
      if (hasMatchStarted(matchId)) return sendJson(res, 409, { error: "Match already started" });
      state.predictions[player] ||= {};
      state.predictions[player][String(matchId)] = { home: cleanScore(home), away: cleanScore(away) };
      writeState(state);
      return sendJson(res, 200, publicState());
    }

    if (req.method === "POST" && req.url === "/api/result") {
      const { matchId, home, away } = await parseBody(req);
      const state = readState();
      state.actuals[String(matchId)] = { home: cleanScore(home), away: cleanScore(away) };
      writeState(state);
      return sendJson(res, 200, publicState());
    }

    if (req.method === "POST" && req.url === "/api/knockout") {
      const { knockout } = await parseBody(req);
      const state = readState();
      state.knockout = Array.isArray(knockout) ? knockout : [];
      state.knockoutResults ||= {};
      writeState(state);
      return sendJson(res, 200, publicState());
    }

    if (req.method === "POST" && req.url === "/api/knockout-result") {
      const { matchId, home, away } = await parseBody(req);
      const state = readState();
      state.knockout ||= [];
      state.knockoutResults ||= {};
      state.knockoutResults[String(matchId)] = { home: cleanScore(home), away: cleanScore(away) };
      writeState(state);
      return sendJson(res, 200, publicState());
    }

    res.writeHead(404);
    res.end("Not found");
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
});

function cleanScore(value) {
  const text = String(value ?? "").replace(/\D/g, "").slice(0, 2);
  return text;
}

const port = Number(process.env.PORT || 4173);
server.listen(port, "0.0.0.0", () => {
  console.log(`Family World Cup app running at http://localhost:${port}`);
  for (const url of appInfo(port).networkUrls) console.log(`Same Wi-Fi: ${url}`);
});

