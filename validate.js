#!/usr/bin/env node
// Checks every puzzle file and rebuilds puzzles/index.json.
// Run before every deploy:  npm run check
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", "puzzles");
const files = fs.readdirSync(dir).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
let errors = 0, warnings = 0;
const err = (f, m) => { errors++; console.log(`  ✖ ${f}: ${m}`); };
const warn = (f, m) => { warnings++; console.log(`  ⚠ ${f}: ${m}`); };

for (const f of files) {
  let p;
  try { p = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); }
  catch (e) { err(f, "not valid JSON: " + e.message); continue; }
  if (p.date !== f.replace(".json", "")) err(f, `"date" is ${p.date}, should match the file name`);
  if (!Array.isArray(p.rounds) || p.rounds.length !== 5) { err(f, "needs exactly 5 rounds"); continue; }
  p.rounds.forEach((r, i) => {
    const at = `round ${i + 1}`;
    for (const k of ["cat", "q", "ans", "min", "max", "step", "src", "url"]) if (r[k] === undefined || r[k] === "") err(f, `${at} is missing "${k}"`);
    for (const k of ["ans", "min", "max", "step"]) if (r[k] !== undefined && typeof r[k] !== "number") err(f, `${at} "${k}" must be a number, not text`);
    if (!(r.min < r.max)) err(f, `${at} min must be below max`);
    if (r.ans < r.min || r.ans > r.max) err(f, `${at} answer ${r.ans} is outside ${r.min}–${r.max}`);
    if (r.step <= 0) err(f, `${at} step must be positive`);
    if (r.url && !/^https:\/\/[^/\s]+\.[^/\s]+/.test(r.url)) err(f, `${at} url should be a full link starting with https://`);
    const range = r.max - r.min, mid = (r.min + r.max) / 2;
    if (Math.abs(r.ans - mid) / range < 0.08) warn(f, `${at} answer sits near the slider's starting point (${mid}). Shift min/max so players can't score big without moving it.`);
    if (Math.abs(r.ans - r.min) / range < 0.05 || Math.abs(r.max - r.ans) / range < 0.05) warn(f, `${at} answer is at the very edge of the range, which gives it away. Widen the range.`);
    if (range / r.step > 2000) warn(f, `${at} step is very small for this range; the slider will feel twitchy.`);
    if (r.q && r.q.length > 180) warn(f, `${at} question is long (${r.q.length} chars). Aim for under 150 on phones.`);
  });
}

fs.writeFileSync(path.join(dir, "index.json"), JSON.stringify(files.map((f) => f.replace(".json", "")), null, 2) + "\n");
console.log(`\nChecked ${files.length} puzzle(s): ${errors} error(s), ${warnings} warning(s). Rebuilt puzzles/index.json.`);
process.exit(errors ? 1 : 0);
