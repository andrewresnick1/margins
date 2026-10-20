#!/usr/bin/env node
// Creates a blank puzzle file for a date.
//   npm run new               -> tomorrow (Eastern time)
//   npm run new -- 2026-10-21 -> that date
const fs = require("fs");
const path = require("path");

let date = process.argv[2];
if (!date) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  date = new Date(Date.parse(today + "T00:00:00Z") + 86400000).toISOString().slice(0, 10);
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { console.error("Use a date like 2026-10-21"); process.exit(1); }

const file = path.join(__dirname, "..", "puzzles", date + ".json");
if (fs.existsSync(file)) { console.error(`${date}.json already exists. Edit it instead.`); process.exit(1); }

const blank = (cat, suffix, prefix) => Object.assign(
  { cat, q: "", ans: 0, min: 0, max: 100, step: 1 },
  prefix ? { prefix } : {}, suffix ? { suffix } : {},
  { note: "", src: "", url: "https://" });

const puzzle = { date, rounds: [
  blank("Polls", "%"),
  blank("Campaigns", "M", "$"),
  blank("Congress"),
  blank("Markets", "B", "$"),
  blank("World")
] };
fs.writeFileSync(file, JSON.stringify(puzzle, null, 2) + "\n");
console.log(`Created puzzles/${date}.json. Fill it in, then run: npm run check`);
