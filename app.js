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



const thirdPlaceAllocationRules = {
  ABCDEFGH: ["H","G","B","C","A","F","D","E"],
  ABCDEFGI: ["C","G","B","D","A","F","E","I"],
  ABCDEFGJ: ["C","G","B","D","A","F","E","J"],
  ABCDEFGK: ["C","G","B","D","A","F","E","K"],
  ABCDEFGL: ["C","G","B","D","A","F","L","E"],
  ABCDEFHI: ["H","E","B","C","A","F","D","I"],
  ABCDEFHJ: ["H","J","B","C","A","F","D","E"],
  ABCDEFHK: ["H","E","B","C","A","F","D","K"],
  ABCDEFHL: ["H","F","B","C","A","D","L","E"],
  ABCDEFIJ: ["C","J","B","D","A","F","E","I"],
  ABCDEFIK: ["C","E","B","D","A","F","I","K"],
  ABCDEFIL: ["C","E","B","D","A","F","L","I"],
  ABCDEFJK: ["C","J","B","D","A","F","E","K"],
  ABCDEFJL: ["C","J","B","D","A","F","L","E"],
  ABCDEFKL: ["C","E","B","D","A","F","L","K"],
  ABCDEGHI: ["H","G","B","C","A","D","E","I"],
  ABCDEGHJ: ["H","G","B","C","A","D","E","J"],
  ABCDEGHK: ["H","G","B","C","A","D","E","K"],
  ABCDEGHL: ["H","G","B","C","A","D","L","E"],
  ABCDEGIJ: ["E","G","B","C","A","D","I","J"],
  ABCDEGIK: ["E","G","B","C","A","D","I","K"],
  ABCDEGIL: ["E","G","B","C","A","D","L","I"],
  ABCDEGJK: ["E","G","B","C","A","D","J","K"],
  ABCDEGJL: ["E","G","B","C","A","D","L","J"],
  ABCDEGKL: ["E","G","B","C","A","D","L","K"],
  ABCDEHIJ: ["H","J","B","C","A","D","E","I"],
  ABCDEHIK: ["H","E","B","C","A","D","I","K"],
  ABCDEHIL: ["H","E","B","C","A","D","L","I"],
  ABCDEHJK: ["H","J","B","C","A","D","E","K"],
  ABCDEHJL: ["H","J","B","C","A","D","L","E"],
  ABCDEHKL: ["H","E","B","C","A","D","L","K"],
  ABCDEIJK: ["E","J","B","C","A","D","I","K"],
  ABCDEIJL: ["E","J","B","C","A","D","L","I"],
  ABCDEIKL: ["E","I","B","C","A","D","L","K"],
  ABCDEJKL: ["E","J","B","C","A","D","L","K"],
  ABCDFGHI: ["H","G","B","C","A","F","D","I"],
  ABCDFGHJ: ["H","G","B","C","A","F","D","J"],
  ABCDFGHK: ["H","G","B","C","A","F","D","K"],
  ABCDFGHL: ["C","G","B","D","A","F","L","H"],
  ABCDFGIJ: ["C","G","B","D","A","F","I","J"],
  ABCDFGIK: ["C","G","B","D","A","F","I","K"],
  ABCDFGIL: ["C","G","B","D","A","F","L","I"],
  ABCDFGJK: ["C","G","B","D","A","F","J","K"],
  ABCDFGJL: ["C","G","B","D","A","F","L","J"],
  ABCDFGKL: ["C","G","B","D","A","F","L","K"],
  ABCDFHIJ: ["H","J","B","C","A","F","D","I"],
  ABCDFHIK: ["H","F","B","C","A","D","I","K"],
  ABCDFHIL: ["H","F","B","C","A","D","L","I"],
  ABCDFHJK: ["H","J","B","C","A","F","D","K"],
  ABCDFHJL: ["C","J","B","D","A","F","L","H"],
  ABCDFHKL: ["H","F","B","C","A","D","L","K"],
  ABCDFIJK: ["C","J","B","D","A","F","I","K"],
  ABCDFIJL: ["C","J","B","D","A","F","L","I"],
  ABCDFIKL: ["C","I","B","D","A","F","L","K"],
  ABCDFJKL: ["C","J","B","D","A","F","L","K"],
  ABCDGHIJ: ["H","G","B","C","A","D","I","J"],
  ABCDGHIK: ["H","G","B","C","A","D","I","K"],
  ABCDGHIL: ["H","G","B","C","A","D","L","I"],
  ABCDGHJK: ["H","G","B","C","A","D","J","K"],
  ABCDGHJL: ["H","G","B","C","A","D","L","J"],
  ABCDGHKL: ["H","G","B","C","A","D","L","K"],
  ABCDGIJK: ["C","J","B","D","A","G","I","K"],
  ABCDGIJL: ["C","J","B","D","A","G","L","I"],
  ABCDGIKL: ["I","G","B","C","A","D","L","K"],
  ABCDGJKL: ["C","J","B","D","A","G","L","K"],
  ABCDHIJK: ["H","J","B","C","A","D","I","K"],
  ABCDHIJL: ["H","J","B","C","A","D","L","I"],
  ABCDHIKL: ["H","I","B","C","A","D","L","K"],
  ABCDHJKL: ["H","J","B","C","A","D","L","K"],
  ABCDIJKL: ["I","J","B","C","A","D","L","K"],
  ABCEFGHI: ["H","G","B","C","A","F","E","I"],
  ABCEFGHJ: ["H","G","B","C","A","F","E","J"],
  ABCEFGHK: ["H","G","B","C","A","F","E","K"],
  ABCEFGHL: ["H","G","B","C","A","F","L","E"],
  ABCEFGIJ: ["E","G","B","C","A","F","I","J"],
  ABCEFGIK: ["E","G","B","C","A","F","I","K"],
  ABCEFGIL: ["E","G","B","C","A","F","L","I"],
  ABCEFGJK: ["E","G","B","C","A","F","J","K"],
  ABCEFGJL: ["E","G","B","C","A","F","L","J"],
  ABCEFGKL: ["E","G","B","C","A","F","L","K"],
  ABCEFHIJ: ["H","J","B","C","A","F","E","I"],
  ABCEFHIK: ["H","E","B","C","A","F","I","K"],
  ABCEFHIL: ["H","E","B","C","A","F","L","I"],
  ABCEFHJK: ["H","J","B","C","A","F","E","K"],
  ABCEFHJL: ["H","J","B","C","A","F","L","E"],
  ABCEFHKL: ["H","E","B","C","A","F","L","K"],
  ABCEFIJK: ["E","J","B","C","A","F","I","K"],
  ABCEFIJL: ["E","J","B","C","A","F","L","I"],
  ABCEFIKL: ["E","I","B","C","A","F","L","K"],
  ABCEFJKL: ["E","J","B","C","A","F","L","K"],
  ABCEGHIJ: ["H","J","B","C","A","G","E","I"],
  ABCEGHIK: ["E","G","B","C","A","H","I","K"],
  ABCEGHIL: ["E","G","B","C","A","H","L","I"],
  ABCEGHJK: ["H","J","B","C","A","G","E","K"],
  ABCEGHJL: ["H","J","B","C","A","G","L","E"],
  ABCEGHKL: ["E","G","B","C","A","H","L","K"],
  ABCEGIJK: ["E","J","B","C","A","G","I","K"],
  ABCEGIJL: ["E","J","B","C","A","G","L","I"],
  ABCEGIKL: ["E","G","B","A","I","C","L","K"],
  ABCEGJKL: ["E","J","B","C","A","G","L","K"],
  ABCEHIJK: ["E","J","B","C","A","H","I","K"],
  ABCEHIJL: ["E","J","B","C","A","H","L","I"],
  ABCEHIKL: ["E","I","B","C","A","H","L","K"],
  ABCEHJKL: ["E","J","B","C","A","H","L","K"],
  ABCEIJKL: ["E","J","B","A","I","C","L","K"],
  ABCFGHIJ: ["H","G","B","C","A","F","I","J"],
  ABCFGHIK: ["H","G","B","C","A","F","I","K"],
  ABCFGHIL: ["H","G","B","C","A","F","L","I"],
  ABCFGHJK: ["H","G","B","C","A","F","J","K"],
  ABCFGHJL: ["H","G","B","C","A","F","L","J"],
  ABCFGHKL: ["H","G","B","C","A","F","L","K"],
  ABCFGIJK: ["C","J","B","F","A","G","I","K"],
  ABCFGIJL: ["C","J","B","F","A","G","L","I"],
  ABCFGIKL: ["I","G","B","C","A","F","L","K"],
  ABCFGJKL: ["C","J","B","F","A","G","L","K"],
  ABCFHIJK: ["H","J","B","C","A","F","I","K"],
  ABCFHIJL: ["H","J","B","C","A","F","L","I"],
  ABCFHIKL: ["H","I","B","C","A","F","L","K"],
  ABCFHJKL: ["H","J","B","C","A","F","L","K"],
  ABCFIJKL: ["I","J","B","C","A","F","L","K"],
  ABCGHIJK: ["H","J","B","C","A","G","I","K"],
  ABCGHIJL: ["H","J","B","C","A","G","L","I"],
  ABCGHIKL: ["I","G","B","C","A","H","L","K"],
  ABCGHJKL: ["H","J","B","C","A","G","L","K"],
  ABCGIJKL: ["I","J","B","C","A","G","L","K"],
  ABCHIJKL: ["I","J","B","C","A","H","L","K"],
  ABDEFGHI: ["H","G","B","D","A","F","E","I"],
  ABDEFGHJ: ["H","G","B","D","A","F","E","J"],
  ABDEFGHK: ["H","G","B","D","A","F","E","K"],
  ABDEFGHL: ["H","G","B","D","A","F","L","E"],
  ABDEFGIJ: ["E","G","B","D","A","F","I","J"],
  ABDEFGIK: ["E","G","B","D","A","F","I","K"],
  ABDEFGIL: ["E","G","B","D","A","F","L","I"],
  ABDEFGJK: ["E","G","B","D","A","F","J","K"],
  ABDEFGJL: ["E","G","B","D","A","F","L","J"],
  ABDEFGKL: ["E","G","B","D","A","F","L","K"],
  ABDEFHIJ: ["H","J","B","D","A","F","E","I"],
  ABDEFHIK: ["H","E","B","D","A","F","I","K"],
  ABDEFHIL: ["H","E","B","D","A","F","L","I"],
  ABDEFHJK: ["H","J","B","D","A","F","E","K"],
  ABDEFHJL: ["H","J","B","D","A","F","L","E"],
  ABDEFHKL: ["H","E","B","D","A","F","L","K"],
  ABDEFIJK: ["E","J","B","D","A","F","I","K"],
  ABDEFIJL: ["E","J","B","D","A","F","L","I"],
  ABDEFIKL: ["E","I","B","D","A","F","L","K"],
  ABDEFJKL: ["E","J","B","D","A","F","L","K"],
  ABDEGHIJ: ["H","J","B","D","A","G","E","I"],
  ABDEGHIK: ["E","G","B","D","A","H","I","K"],
  ABDEGHIL: ["E","G","B","D","A","H","L","I"],
  ABDEGHJK: ["H","J","B","D","A","G","E","K"],
  ABDEGHJL: ["H","J","B","D","A","G","L","E"],
  ABDEGHKL: ["E","G","B","D","A","H","L","K"],
  ABDEGIJK: ["E","J","B","D","A","G","I","K"],
  ABDEGIJL: ["E","J","B","D","A","G","L","I"],
  ABDEGIKL: ["E","G","B","A","I","D","L","K"],
  ABDEGJKL: ["E","J","B","D","A","G","L","K"],
  ABDEHIJK: ["E","J","B","D","A","H","I","K"],
  ABDEHIJL: ["E","J","B","D","A","H","L","I"],
  ABDEHIKL: ["E","I","B","D","A","H","L","K"],
  ABDEHJKL: ["E","J","B","D","A","H","L","K"],
  ABDEIJKL: ["E","J","B","A","I","D","L","K"],
  ABDFGHIJ: ["H","G","B","D","A","F","I","J"],
  ABDFGHIK: ["H","G","B","D","A","F","I","K"],
  ABDFGHIL: ["H","G","B","D","A","F","L","I"],
  ABDFGHJK: ["H","G","B","D","A","F","J","K"],
  ABDFGHJL: ["H","G","B","D","A","F","L","J"],
  ABDFGHKL: ["H","G","B","D","A","F","L","K"],
  ABDFGIJK: ["F","J","B","D","A","G","I","K"],
  ABDFGIJL: ["F","J","B","D","A","G","L","I"],
  ABDFGIKL: ["I","G","B","D","A","F","L","K"],
  ABDFGJKL: ["F","J","B","D","A","G","L","K"],
  ABDFHIJK: ["H","J","B","D","A","F","I","K"],
  ABDFHIJL: ["H","J","B","D","A","F","L","I"],
  ABDFHIKL: ["H","I","B","D","A","F","L","K"],
  ABDFHJKL: ["H","J","B","D","A","F","L","K"],
  ABDFIJKL: ["I","J","B","D","A","F","L","K"],
  ABDGHIJK: ["H","J","B","D","A","G","I","K"],
  ABDGHIJL: ["H","J","B","D","A","G","L","I"],
  ABDGHIKL: ["I","G","B","D","A","H","L","K"],
  ABDGHJKL: ["H","J","B","D","A","G","L","K"],
  ABDGIJKL: ["I","J","B","D","A","G","L","K"],
  ABDHIJKL: ["I","J","B","D","A","H","L","K"],
  ABEFGHIJ: ["H","J","B","F","A","G","E","I"],
  ABEFGHIK: ["E","G","B","F","A","H","I","K"],
  ABEFGHIL: ["E","G","B","F","A","H","L","I"],
  ABEFGHJK: ["H","J","B","F","A","G","E","K"],
  ABEFGHJL: ["H","J","B","F","A","G","L","E"],
  ABEFGHKL: ["E","G","B","F","A","H","L","K"],
  ABEFGIJK: ["E","J","B","F","A","G","I","K"],
  ABEFGIJL: ["E","J","B","F","A","G","L","I"],
  ABEFGIKL: ["E","G","B","A","I","F","L","K"],
  ABEFGJKL: ["E","J","B","F","A","G","L","K"],
  ABEFHIJK: ["E","J","B","F","A","H","I","K"],
  ABEFHIJL: ["E","J","B","F","A","H","L","I"],
  ABEFHIKL: ["E","I","B","F","A","H","L","K"],
  ABEFHJKL: ["E","J","B","F","A","H","L","K"],
  ABEFIJKL: ["E","J","B","A","I","F","L","K"],
  ABEGHIJK: ["E","J","B","A","H","G","I","K"],
  ABEGHIJL: ["E","J","B","A","H","G","L","I"],
  ABEGHIKL: ["E","G","B","A","I","H","L","K"],
  ABEGHJKL: ["E","J","B","A","H","G","L","K"],
  ABEGIJKL: ["E","J","B","A","I","G","L","K"],
  ABEHIJKL: ["E","J","B","A","I","H","L","K"],
  ABFGHIJK: ["H","J","B","F","A","G","I","K"],
  ABFGHIJL: ["H","J","B","F","A","G","L","I"],
  ABFGHIKL: ["H","G","B","A","I","F","L","K"],
  ABFGHJKL: ["H","J","B","F","A","G","L","K"],
  ABFGIJKL: ["I","J","B","F","A","G","L","K"],
  ABFHIJKL: ["H","J","B","A","I","F","L","K"],
  ABGHIJKL: ["H","J","B","A","I","G","L","K"],
  ACDEFGHI: ["H","G","E","C","A","F","D","I"],
  ACDEFGHJ: ["H","G","J","C","A","F","D","E"],
  ACDEFGHK: ["H","G","E","C","A","F","D","K"],
  ACDEFGHL: ["H","G","F","C","A","D","L","E"],
  ACDEFGIJ: ["C","G","J","D","A","F","E","I"],
  ACDEFGIK: ["C","G","E","D","A","F","I","K"],
  ACDEFGIL: ["C","G","E","D","A","F","L","I"],
  ACDEFGJK: ["C","G","J","D","A","F","E","K"],
  ACDEFGJL: ["C","G","J","D","A","F","L","E"],
  ACDEFGKL: ["C","G","E","D","A","F","L","K"],
  ACDEFHIJ: ["H","J","E","C","A","F","D","I"],
  ACDEFHIK: ["H","E","F","C","A","D","I","K"],
  ACDEFHIL: ["H","E","F","C","A","D","L","I"],
  ACDEFHJK: ["H","J","E","C","A","F","D","K"],
  ACDEFHJL: ["H","J","F","C","A","D","L","E"],
  ACDEFHKL: ["H","E","F","C","A","D","L","K"],
  ACDEFIJK: ["C","J","E","D","A","F","I","K"],
  ACDEFIJL: ["C","J","E","D","A","F","L","I"],
  ACDEFIKL: ["C","E","I","D","A","F","L","K"],
  ACDEFJKL: ["C","J","E","D","A","F","L","K"],
  ACDEGHIJ: ["H","G","J","C","A","D","E","I"],
  ACDEGHIK: ["H","G","E","C","A","D","I","K"],
  ACDEGHIL: ["H","G","E","C","A","D","L","I"],
  ACDEGHJK: ["H","G","J","C","A","D","E","K"],
  ACDEGHJL: ["H","G","J","C","A","D","L","E"],
  ACDEGHKL: ["H","G","E","C","A","D","L","K"],
  ACDEGIJK: ["E","G","J","C","A","D","I","K"],
  ACDEGIJL: ["E","G","J","C","A","D","L","I"],
  ACDEGIKL: ["E","G","I","C","A","D","L","K"],
  ACDEGJKL: ["E","G","J","C","A","D","L","K"],
  ACDEHIJK: ["H","J","E","C","A","D","I","K"],
  ACDEHIJL: ["H","J","E","C","A","D","L","I"],
  ACDEHIKL: ["H","E","I","C","A","D","L","K"],
  ACDEHJKL: ["H","J","E","C","A","D","L","K"],
  ACDEIJKL: ["E","J","I","C","A","D","L","K"],
  ACDFGHIJ: ["H","G","J","C","A","F","D","I"],
  ACDFGHIK: ["H","G","F","C","A","D","I","K"],
  ACDFGHIL: ["H","G","F","C","A","D","L","I"],
  ACDFGHJK: ["H","G","J","C","A","F","D","K"],
  ACDFGHJL: ["C","G","J","D","A","F","L","H"],
  ACDFGHKL: ["H","G","F","C","A","D","L","K"],
  ACDFGIJK: ["C","G","J","D","A","F","I","K"],
  ACDFGIJL: ["C","G","J","D","A","F","L","I"],
  ACDFGIKL: ["C","G","I","D","A","F","L","K"],
  ACDFGJKL: ["C","G","J","D","A","F","L","K"],
  ACDFHIJK: ["H","J","F","C","A","D","I","K"],
  ACDFHIJL: ["H","J","F","C","A","D","L","I"],
  ACDFHIKL: ["H","F","I","C","A","D","L","K"],
  ACDFHJKL: ["H","J","F","C","A","D","L","K"],
  ACDFIJKL: ["C","J","I","D","A","F","L","K"],
  ACDGHIJK: ["H","G","J","C","A","D","I","K"],
  ACDGHIJL: ["H","G","J","C","A","D","L","I"],
  ACDGHIKL: ["H","G","I","C","A","D","L","K"],
  ACDGHJKL: ["H","G","J","C","A","D","L","K"],
  ACDGIJKL: ["I","G","J","C","A","D","L","K"],
  ACDHIJKL: ["H","J","I","C","A","D","L","K"],
  ACEFGHIJ: ["H","G","J","C","A","F","E","I"],
  ACEFGHIK: ["H","G","E","C","A","F","I","K"],
  ACEFGHIL: ["H","G","E","C","A","F","L","I"],
  ACEFGHJK: ["H","G","J","C","A","F","E","K"],
  ACEFGHJL: ["H","G","J","C","A","F","L","E"],
  ACEFGHKL: ["H","G","E","C","A","F","L","K"],
  ACEFGIJK: ["E","G","J","C","A","F","I","K"],
  ACEFGIJL: ["E","G","J","C","A","F","L","I"],
  ACEFGIKL: ["E","G","I","C","A","F","L","K"],
  ACEFGJKL: ["E","G","J","C","A","F","L","K"],
  ACEFHIJK: ["H","J","E","C","A","F","I","K"],
  ACEFHIJL: ["H","J","E","C","A","F","L","I"],
  ACEFHIKL: ["H","E","I","C","A","F","L","K"],
  ACEFHJKL: ["H","J","E","C","A","F","L","K"],
  ACEFIJKL: ["E","J","I","C","A","F","L","K"],
  ACEGHIJK: ["E","G","J","C","A","H","I","K"],
  ACEGHIJL: ["E","G","J","C","A","H","L","I"],
  ACEGHIKL: ["E","G","I","C","A","H","L","K"],
  ACEGHJKL: ["E","G","J","C","A","H","L","K"],
  ACEGIJKL: ["E","J","I","C","A","G","L","K"],
  ACEHIJKL: ["E","J","I","C","A","H","L","K"],
  ACFGHIJK: ["H","G","J","C","A","F","I","K"],
  ACFGHIJL: ["H","G","J","C","A","F","L","I"],
  ACFGHIKL: ["H","G","I","C","A","F","L","K"],
  ACFGHJKL: ["H","G","J","C","A","F","L","K"],
  ACFGIJKL: ["I","G","J","C","A","F","L","K"],
  ACFHIJKL: ["H","J","I","C","A","F","L","K"],
  ACGHIJKL: ["H","J","I","C","A","G","L","K"],
  ADEFGHIJ: ["H","G","J","D","A","F","E","I"],
  ADEFGHIK: ["H","G","E","D","A","F","I","K"],
  ADEFGHIL: ["H","G","E","D","A","F","L","I"],
  ADEFGHJK: ["H","G","J","D","A","F","E","K"],
  ADEFGHJL: ["H","G","J","D","A","F","L","E"],
  ADEFGHKL: ["H","G","E","D","A","F","L","K"],
  ADEFGIJK: ["E","G","J","D","A","F","I","K"],
  ADEFGIJL: ["E","G","J","D","A","F","L","I"],
  ADEFGIKL: ["E","G","I","D","A","F","L","K"],
  ADEFGJKL: ["E","G","J","D","A","F","L","K"],
  ADEFHIJK: ["H","J","E","D","A","F","I","K"],
  ADEFHIJL: ["H","J","E","D","A","F","L","I"],
  ADEFHIKL: ["H","E","I","D","A","F","L","K"],
  ADEFHJKL: ["H","J","E","D","A","F","L","K"],
  ADEFIJKL: ["E","J","I","D","A","F","L","K"],
  ADEGHIJK: ["E","G","J","D","A","H","I","K"],
  ADEGHIJL: ["E","G","J","D","A","H","L","I"],
  ADEGHIKL: ["E","G","I","D","A","H","L","K"],
  ADEGHJKL: ["E","G","J","D","A","H","L","K"],
  ADEGIJKL: ["E","J","I","D","A","G","L","K"],
  ADEHIJKL: ["E","J","I","D","A","H","L","K"],
  ADFGHIJK: ["H","G","J","D","A","F","I","K"],
  ADFGHIJL: ["H","G","J","D","A","F","L","I"],
  ADFGHIKL: ["H","G","I","D","A","F","L","K"],
  ADFGHJKL: ["H","G","J","D","A","F","L","K"],
  ADFGIJKL: ["I","G","J","D","A","F","L","K"],
  ADFHIJKL: ["H","J","I","D","A","F","L","K"],
  ADGHIJKL: ["H","J","I","D","A","G","L","K"],
  AEFGHIJK: ["E","G","J","F","A","H","I","K"],
  AEFGHIJL: ["E","G","J","F","A","H","L","I"],
  AEFGHIKL: ["E","G","I","F","A","H","L","K"],
  AEFGHJKL: ["E","G","J","F","A","H","L","K"],
  AEFGIJKL: ["E","J","I","F","A","G","L","K"],
  AEFHIJKL: ["E","J","I","F","A","H","L","K"],
  AEGHIJKL: ["E","J","I","A","H","G","L","K"],
  AFGHIJKL: ["H","J","I","F","A","G","L","K"],
  BCDEFGHI: ["C","G","B","D","H","F","E","I"],
  BCDEFGHJ: ["H","G","B","C","J","F","D","E"],
  BCDEFGHK: ["C","G","B","D","H","F","E","K"],
  BCDEFGHL: ["C","G","B","D","H","F","L","E"],
  BCDEFGIJ: ["C","G","B","D","J","F","E","I"],
  BCDEFGIK: ["C","G","B","D","E","F","I","K"],
  BCDEFGIL: ["C","G","B","D","E","F","L","I"],
  BCDEFGJK: ["C","G","B","D","J","F","E","K"],
  BCDEFGJL: ["C","G","B","D","J","F","L","E"],
  BCDEFGKL: ["C","G","B","D","E","F","L","K"],
  BCDEFHIJ: ["C","J","B","D","H","F","E","I"],
  BCDEFHIK: ["C","E","B","D","H","F","I","K"],
  BCDEFHIL: ["C","E","B","D","H","F","L","I"],
  BCDEFHJK: ["C","J","B","D","H","F","E","K"],
  BCDEFHJL: ["C","J","B","D","H","F","L","E"],
  BCDEFHKL: ["C","E","B","D","H","F","L","K"],
  BCDEFIJK: ["C","J","B","D","E","F","I","K"],
  BCDEFIJL: ["C","J","B","D","E","F","L","I"],
  BCDEFIKL: ["C","E","B","D","I","F","L","K"],
  BCDEFJKL: ["C","J","B","D","E","F","L","K"],
  BCDEGHIJ: ["H","G","B","C","J","D","E","I"],
  BCDEGHIK: ["E","G","B","C","H","D","I","K"],
  BCDEGHIL: ["E","G","B","C","H","D","L","I"],
  BCDEGHJK: ["H","G","B","C","J","D","E","K"],
  BCDEGHJL: ["H","G","B","C","J","D","L","E"],
  BCDEGHKL: ["E","G","B","C","H","D","L","K"],
  BCDEGIJK: ["E","G","B","C","J","D","I","K"],
  BCDEGIJL: ["E","G","B","C","J","D","L","I"],
  BCDEGIKL: ["E","G","B","C","I","D","L","K"],
  BCDEGJKL: ["E","G","B","C","J","D","L","K"],
  BCDEHIJK: ["E","J","B","C","H","D","I","K"],
  BCDEHIJL: ["E","J","B","C","H","D","L","I"],
  BCDEHIKL: ["E","I","B","C","H","D","L","K"],
  BCDEHJKL: ["E","J","B","C","H","D","L","K"],
  BCDEIJKL: ["E","J","B","C","I","D","L","K"],
  BCDFGHIJ: ["H","G","B","C","J","F","D","I"],
  BCDFGHIK: ["C","G","B","D","H","F","I","K"],
  BCDFGHIL: ["C","G","B","D","H","F","L","I"],
  BCDFGHJK: ["H","G","B","C","J","F","D","K"],
  BCDFGHJL: ["C","G","B","D","H","F","L","J"],
  BCDFGHKL: ["C","G","B","D","H","F","L","K"],
  BCDFGIJK: ["C","G","B","D","J","F","I","K"],
  BCDFGIJL: ["C","G","B","D","J","F","L","I"],
  BCDFGIKL: ["C","G","B","D","I","F","L","K"],
  BCDFGJKL: ["C","G","B","D","J","F","L","K"],
  BCDFHIJK: ["C","J","B","D","H","F","I","K"],
  BCDFHIJL: ["C","J","B","D","H","F","L","I"],
  BCDFHIKL: ["C","I","B","D","H","F","L","K"],
  BCDFHJKL: ["C","J","B","D","H","F","L","K"],
  BCDFIJKL: ["C","J","B","D","I","F","L","K"],
  BCDGHIJK: ["H","G","B","C","J","D","I","K"],
  BCDGHIJL: ["H","G","B","C","J","D","L","I"],
  BCDGHIKL: ["H","G","B","C","I","D","L","K"],
  BCDGHJKL: ["H","G","B","C","J","D","L","K"],
  BCDGIJKL: ["I","G","B","C","J","D","L","K"],
  BCDHIJKL: ["H","J","B","C","I","D","L","K"],
  BCEFGHIJ: ["H","G","B","C","J","F","E","I"],
  BCEFGHIK: ["E","G","B","C","H","F","I","K"],
  BCEFGHIL: ["E","G","B","C","H","F","L","I"],
  BCEFGHJK: ["H","G","B","C","J","F","E","K"],
  BCEFGHJL: ["H","G","B","C","J","F","L","E"],
  BCEFGHKL: ["E","G","B","C","H","F","L","K"],
  BCEFGIJK: ["E","G","B","C","J","F","I","K"],
  BCEFGIJL: ["E","G","B","C","J","F","L","I"],
  BCEFGIKL: ["E","G","B","C","I","F","L","K"],
  BCEFGJKL: ["E","G","B","C","J","F","L","K"],
  BCEFHIJK: ["E","J","B","C","H","F","I","K"],
  BCEFHIJL: ["E","J","B","C","H","F","L","I"],
  BCEFHIKL: ["E","I","B","C","H","F","L","K"],
  BCEFHJKL: ["E","J","B","C","H","F","L","K"],
  BCEFIJKL: ["E","J","B","C","I","F","L","K"],
  BCEGHIJK: ["E","J","B","C","H","G","I","K"],
  BCEGHIJL: ["E","J","B","C","H","G","L","I"],
  BCEGHIKL: ["E","G","B","C","I","H","L","K"],
  BCEGHJKL: ["E","J","B","C","H","G","L","K"],
  BCEGIJKL: ["E","J","B","C","I","G","L","K"],
  BCEHIJKL: ["E","J","B","C","I","H","L","K"],
  BCFGHIJK: ["H","G","B","C","J","F","I","K"],
  BCFGHIJL: ["H","G","B","C","J","F","L","I"],
  BCFGHIKL: ["H","G","B","C","I","F","L","K"],
  BCFGHJKL: ["H","G","B","C","J","F","L","K"],
  BCFGIJKL: ["I","G","B","C","J","F","L","K"],
  BCFHIJKL: ["H","J","B","C","I","F","L","K"],
  BCGHIJKL: ["H","J","B","C","I","G","L","K"],
  BDEFGHIJ: ["H","G","B","D","J","F","E","I"],
  BDEFGHIK: ["E","G","B","D","H","F","I","K"],
  BDEFGHIL: ["E","G","B","D","H","F","L","I"],
  BDEFGHJK: ["H","G","B","D","J","F","E","K"],
  BDEFGHJL: ["H","G","B","D","J","F","L","E"],
  BDEFGHKL: ["E","G","B","D","H","F","L","K"],
  BDEFGIJK: ["E","G","B","D","J","F","I","K"],
  BDEFGIJL: ["E","G","B","D","J","F","L","I"],
  BDEFGIKL: ["E","G","B","D","I","F","L","K"],
  BDEFGJKL: ["E","G","B","D","J","F","L","K"],
  BDEFHIJK: ["E","J","B","D","H","F","I","K"],
  BDEFHIJL: ["E","J","B","D","H","F","L","I"],
  BDEFHIKL: ["E","I","B","D","H","F","L","K"],
  BDEFHJKL: ["E","J","B","D","H","F","L","K"],
  BDEFIJKL: ["E","J","B","D","I","F","L","K"],
  BDEGHIJK: ["E","J","B","D","H","G","I","K"],
  BDEGHIJL: ["E","J","B","D","H","G","L","I"],
  BDEGHIKL: ["E","G","B","D","I","H","L","K"],
  BDEGHJKL: ["E","J","B","D","H","G","L","K"],
  BDEGIJKL: ["E","J","B","D","I","G","L","K"],
  BDEHIJKL: ["E","J","B","D","I","H","L","K"],
  BDFGHIJK: ["H","G","B","D","J","F","I","K"],
  BDFGHIJL: ["H","G","B","D","J","F","L","I"],
  BDFGHIKL: ["H","G","B","D","I","F","L","K"],
  BDFGHJKL: ["H","G","B","D","J","F","L","K"],
  BDFGIJKL: ["I","G","B","D","J","F","L","K"],
  BDFHIJKL: ["H","J","B","D","I","F","L","K"],
  BDGHIJKL: ["H","J","B","D","I","G","L","K"],
  BEFGHIJK: ["E","J","B","F","H","G","I","K"],
  BEFGHIJL: ["E","J","B","F","H","G","L","I"],
  BEFGHIKL: ["E","G","B","F","I","H","L","K"],
  BEFGHJKL: ["E","J","B","F","H","G","L","K"],
  BEFGIJKL: ["E","J","B","F","I","G","L","K"],
  BEFHIJKL: ["E","J","B","F","I","H","L","K"],
  BEGHIJKL: ["E","J","I","B","H","G","L","K"],
  BFGHIJKL: ["H","J","B","F","I","G","L","K"],
  CDEFGHIJ: ["C","G","J","D","H","F","E","I"],
  CDEFGHIK: ["C","G","E","D","H","F","I","K"],
  CDEFGHIL: ["C","G","E","D","H","F","L","I"],
  CDEFGHJK: ["C","G","J","D","H","F","E","K"],
  CDEFGHJL: ["C","G","J","D","H","F","L","E"],
  CDEFGHKL: ["C","G","E","D","H","F","L","K"],
  CDEFGIJK: ["C","G","E","D","J","F","I","K"],
  CDEFGIJL: ["C","G","E","D","J","F","L","I"],
  CDEFGIKL: ["C","G","E","D","I","F","L","K"],
  CDEFGJKL: ["C","G","E","D","J","F","L","K"],
  CDEFHIJK: ["C","J","E","D","H","F","I","K"],
  CDEFHIJL: ["C","J","E","D","H","F","L","I"],
  CDEFHIKL: ["C","E","I","D","H","F","L","K"],
  CDEFHJKL: ["C","J","E","D","H","F","L","K"],
  CDEFIJKL: ["C","J","E","D","I","F","L","K"],
  CDEGHIJK: ["E","G","J","C","H","D","I","K"],
  CDEGHIJL: ["E","G","J","C","H","D","L","I"],
  CDEGHIKL: ["E","G","I","C","H","D","L","K"],
  CDEGHJKL: ["E","G","J","C","H","D","L","K"],
  CDEGIJKL: ["E","G","I","C","J","D","L","K"],
  CDEHIJKL: ["E","J","I","C","H","D","L","K"],
  CDFGHIJK: ["C","G","J","D","H","F","I","K"],
  CDFGHIJL: ["C","G","J","D","H","F","L","I"],
  CDFGHIKL: ["C","G","I","D","H","F","L","K"],
  CDFGHJKL: ["C","G","J","D","H","F","L","K"],
  CDFGIJKL: ["C","G","I","D","J","F","L","K"],
  CDFHIJKL: ["C","J","I","D","H","F","L","K"],
  CDGHIJKL: ["H","G","I","C","J","D","L","K"],
  CEFGHIJK: ["E","G","J","C","H","F","I","K"],
  CEFGHIJL: ["E","G","J","C","H","F","L","I"],
  CEFGHIKL: ["E","G","I","C","H","F","L","K"],
  CEFGHJKL: ["E","G","J","C","H","F","L","K"],
  CEFGIJKL: ["E","G","I","C","J","F","L","K"],
  CEFHIJKL: ["E","J","I","C","H","F","L","K"],
  CEGHIJKL: ["E","J","I","C","H","G","L","K"],
  CFGHIJKL: ["H","G","I","C","J","F","L","K"],
  DEFGHIJK: ["E","G","J","D","H","F","I","K"],
  DEFGHIJL: ["E","G","J","D","H","F","L","I"],
  DEFGHIKL: ["E","G","I","D","H","F","L","K"],
  DEFGHJKL: ["E","G","J","D","H","F","L","K"],
  DEFGIJKL: ["E","G","I","D","J","F","L","K"],
  DEFHIJKL: ["E","J","I","D","H","F","L","K"],
  DEGHIJKL: ["E","J","I","D","H","G","L","K"],
  DFGHIJKL: ["H","G","I","D","J","F","L","K"],
  EFGHIJKL: ["E","J","I","F","H","G","L","K"],
};
const thirdPlaceSlots = [
  { id: 74, groups: ["A", "B", "C", "D", "F"] },
  { id: 77, groups: ["C", "D", "F", "G", "H"] },
  { id: 79, groups: ["C", "E", "F", "H", "I"] },
  { id: 80, groups: ["E", "H", "I", "J", "K"] },
  { id: 81, groups: ["B", "E", "F", "I", "J"] },
  { id: 82, groups: ["A", "E", "H", "I", "J"] },
  { id: 85, groups: ["E", "F", "G", "I", "J"] },
  { id: 87, groups: ["D", "E", "I", "J", "L"] },
];
const knockoutDisplayOrder = [
  73, 74, 75, 76, 77, 78, 79, 80,
  81, 82, 83, 84, 85, 86, 87, 88,
  89, 90, 91, 92, 93, 94, 95, 96,
  97, 98, 99, 100,
  101, 102,
  103, 104,
];
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

function compareKnockoutDisplayOrder(a, b) {
  return knockoutDisplayNumber(a) - knockoutDisplayNumber(b);
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
      ${[...matches].sort(compareMatchTime).map(renderMatch).join("")}
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
    .sort(compareKnockoutDisplayOrder)
    .map(match => {
      const result = appState.knockoutResults[String(match.id)] || { home: "", away: "" };
      const disabled = match.home.startsWith("TBD") || match.away.startsWith("TBD");
      return resultEntryRow(match, "knockout-result", result, disabled, match.round, knockoutDisplayNumber(match));
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
  return knockoutDisplayNumberById(match.id);
}

function knockoutDisplayNumberById(id) {
  const index = knockoutDisplayOrder.findIndex(item => String(item) === String(id));
  return index === -1 ? id : index + 1;
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
    input.addEventListener("blur", async () => {
      await saveScore(input.dataset.kind, input.dataset.match, true);
      if (pendingRemoteState) {
        pendingRemoteState = null;
        refreshState({ force: true });
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
  const key = kind + ":" + matchId;
  clearTimeout(saveTimers.get(key));
  saveTimers.delete(key);
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
        ${[...round.matches].sort(compareKnockoutDisplayOrder).map(renderKnockoutMatch).join("")}
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
    const actual = actualForGroupMatch(match);
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
      const actual = actualForGroupMatch(match);
      return actual.home !== "" && actual.away !== "";
    });
  }
  const thirdRows = Object.entries(sortedGroups)
    .filter(([group]) => completeGroups[group])
    .map(([group, rows]) => ({ ...rows[2], group, position: `${group}3` }))
    .sort(compareTeams);
  const allGroupsComplete = Object.keys(sortedGroups).length === 12 && Object.values(completeGroups).every(Boolean);
  const hasCutoffTie = thirdRows.length > 8 && sameKnownRankingStats(thirdRows[7], thirdRows[8]);
  const qualifiedThirds = allGroupsComplete && !hasCutoffTie ? thirdRows.slice(0, 8) : [];
  return { groups: sortedGroups, completeGroups, thirdRows, qualifiedThirds, allGroupsComplete };
}

function sameKnownRankingStats(a, b) {
  if (!a || !b) return false;
  return a.points === b.points && a.goalDiff === b.goalDiff && a.goalsFor === b.goalsFor;
}
function actualForGroupMatch(match) {
  const actual = appState.actuals[String(match.id)] || {};
  return {
    home: actual.home ?? match.actualHome ?? "",
    away: actual.away ?? match.actualAway ?? "",
  };
}

function getThirdPlaceAssignments(standings) {
  if (!standings.allGroupsComplete || standings.qualifiedThirds.length !== 8) return {};
  const teamsByGroup = Object.fromEntries(standings.qualifiedThirds.map(row => [row.group, row]));
  const key = standings.qualifiedThirds.map(row => row.group).sort().join("");
  const officialRule = thirdPlaceAllocationRules[key];
  if (officialRule) {
    const thirdPlaceMatchIds = [79, 85, 81, 74, 82, 77, 87, 80];
    return Object.fromEntries(officialRule.map((group, index) => [thirdPlaceMatchIds[index], teamsByGroup[group]]));
  }

  const qualifiedGroups = new Set(Object.keys(teamsByGroup));
  const slots = thirdPlaceSlots.map(slot => ({
    ...slot,
    groups: slot.groups.filter(group => qualifiedGroups.has(group)),
  }));
  if (slots.some(slot => slot.groups.length === 0)) return {};
  const assignments = enumerateThirdPlaceAssignments(slots);
  if (!assignments.length) return {};
  const certain = {};
  for (const slot of slots) {
    const group = assignments[0][slot.id];
    if (assignments.every(assignment => assignment[slot.id] === group)) {
      certain[slot.id] = teamsByGroup[group];
    }
  }
  return certain;
}

function enumerateThirdPlaceAssignments(slots, index = 0, used = new Set(), current = {}, results = []) {
  if (index === slots.length) {
    results.push({ ...current });
    return results;
  }
  const slot = slots[index];
  for (const group of slot.groups) {
    if (used.has(group)) continue;
    used.add(group);
    current[slot.id] = group;
    enumerateThirdPlaceAssignments(slots, index + 1, used, current, results);
    delete current[slot.id];
    used.delete(group);
  }
  return results;
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
    { id: 89, pair: [73, 75] },
    { id: 90, pair: [74, 77] },
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
  const label = knockoutDisplayNumberById(id);
  if (!match) return `TBD Winner Match ${label}`;
  return winnerOf(match) || `TBD Winner Match ${label}`;
}

function loserOfMatch(matches, id) {
  const match = matches.find(item => item.id === id);
  const label = knockoutDisplayNumberById(id);
  if (!match) return `TBD Loser Match ${label}`;
  const result = appState.knockoutResults[String(id)] || {};
  if (match.home.startsWith("TBD") || match.away.startsWith("TBD")) return `TBD Loser Match ${label}`;
  if (result.home === "" || result.away === "" || result.home === result.away) return `TBD Loser Match ${label}`;
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
  const thirdAssignments = getThirdPlaceAssignments(standings);
  const third = (matchId, groups) => thirdAssignments[matchId]?.team || `TBD 3rd ${groups.join("/")}`;
  return withKickoffs([
    { id: 73, home: groupTeam("A", 1), away: groupTeam("B", 1) },
    { id: 74, home: groupTeam("E", 0), away: third(74, ["A", "B", "C", "D", "F"]) },
    { id: 75, home: groupTeam("F", 0), away: groupTeam("C", 1) },
    { id: 76, home: groupTeam("C", 0), away: groupTeam("F", 1) },
    { id: 77, home: groupTeam("I", 0), away: third(77, ["C", "D", "F", "G", "H"]) },
    { id: 78, home: groupTeam("E", 1), away: groupTeam("I", 1) },
    { id: 79, home: groupTeam("A", 0), away: third(79, ["C", "E", "F", "H", "I"]) },
    { id: 80, home: groupTeam("L", 0), away: third(80, ["E", "H", "I", "J", "K"]) },
    { id: 81, home: groupTeam("D", 0), away: third(81, ["B", "E", "F", "I", "J"]) },
    { id: 82, home: groupTeam("G", 0), away: third(82, ["A", "E", "H", "I", "J"]) },
    { id: 83, home: groupTeam("K", 1), away: groupTeam("L", 1) },
    { id: 84, home: groupTeam("H", 0), away: groupTeam("J", 1) },
    { id: 85, home: groupTeam("B", 0), away: third(85, ["E", "F", "G", "I", "J"]) },
    { id: 86, home: groupTeam("J", 0), away: groupTeam("H", 1) },
    { id: 87, home: groupTeam("K", 0), away: third(87, ["D", "E", "I", "J", "L"]) },
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
