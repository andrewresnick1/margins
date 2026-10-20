(function () {
  "use strict";
  const CFG = window.MARGIN_CONFIG;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ---------- dates ----------
  const isoInTZ = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: CFG.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  const dayNum = (iso) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 86400000;
  const addDays = (iso, n) => new Date((dayNum(iso) + n) * 86400000).toISOString().slice(0, 10);
  const puzzleNo = (iso) => dayNum(iso) - dayNum(CFG.launchDate) + 1;
  const pretty = (iso) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  const today = isoInTZ(new Date());

  // ---------- storage (never required) ----------
  const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  // ---------- scoring ----------
  function score(r, g) {
    const frac = Math.abs(g - r.ans) / (r.max - r.min);
    if (frac <= 0.02) return 100;
    return Math.max(0, Math.round(100 * (1 - (frac - 0.02) / 0.38)));
  }
  const tier = (p) => p >= 90 ? ["🎯", "g", "Bullseye"] : p >= 70 ? ["🟩", "g", "Close"] : p >= 40 ? ["🟨", "o", "In the ballpark"] : ["🟥", "b", "Way off"];
  const rankFor = (t) => t >= 420 ? "Pollster" : t >= 320 ? "News junkie" : t >= 200 ? "Casual reader" : "Headline skimmer";
  const num = (v) => Number(v).toLocaleString("en-US", { maximumFractionDigits: 2 });
  const plain = (r, v) => (r.prefix || "") + num(v) + (r.suffix || "");
  const big = (r, v) => (r.prefix || "") + num(v) + (r.suffix ? `<small>${esc(r.suffix)}</small>` : "");

  // ---------- load puzzle ----------
  const params = new URLSearchParams(location.search);
  let wanted = params.get("date");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(wanted || "") || wanted > today) wanted = today;
  const isArchive = wanted !== today;

  let puzzle, date, state, key;

  async function getJSON(path) {
    const res = await fetch(path, { cache: "no-cache" });
    if (!res.ok) throw new Error(res.status);
    return res.json();
  }

  async function init() {
    if (CFG.supportUrl) { $("support").href = CFG.supportUrl; $("support").hidden = false; }
    try {
      puzzle = await getJSON(`puzzles/${wanted}.json`);
      date = wanted;
    } catch (e) {
      try {
        const list = (await getJSON("puzzles/index.json")).filter((d) => d <= today).sort();
        if (!list.length) throw new Error("none");
        date = list[list.length - 1];
        puzzle = await getJSON(`puzzles/${date}.json`);
        showBanner(`Today's numbers aren't posted yet. Here's the latest edition from ${pretty(date)}.`);
      } catch (e2) {
        $("edition").textContent = "";
        $("stage").innerHTML = `<section class="card"><p class="note">Couldn't load a puzzle. Check back in a few minutes.</p></section>`;
        return;
      }
    }
    if (isArchive && date === wanted) showBanner(`Archive edition from ${pretty(date)}. It won't count toward your streak.`);
    key = "margin:" + date;
    state = load(key, { i: 0, guesses: [] });
    $("edition").innerHTML = `No. ${puzzleNo(date)}<br>${pretty(date)}`;
    render();
  }
  function showBanner(t) { $("banner").textContent = t; $("banner").hidden = false; }

  // ---------- render ----------
  function render() {
    const n = puzzle.rounds.length;
    $("progress").innerHTML = puzzle.rounds.map((_, k) => `<i class="${k < state.guesses.length ? "done" : k === state.i ? "now" : ""}"></i>`).join("");
    if (state.i >= n) return renderFinal();
    const r = puzzle.rounds[state.i];
    const answered = state.guesses.length > state.i;
    const mid = Math.round(((r.min + r.max) / 2) / r.step) * r.step;
    const g = answered ? state.guesses[state.i] : mid;
    $("stage").innerHTML = `<section class="card">
      <span class="chip">Round ${state.i + 1} of ${n} · ${esc(r.cat)}</span>
      <p class="q">${esc(r.q)}</p>
      <div class="readout" id="readout">${big(r, g)}</div>
      ${answered ? reveal(r, g) : `
        <div><input type="range" id="slider" min="${r.min}" max="${r.max}" step="${r.step}" value="${g}" aria-label="Your guess">
        <div class="scale"><span>${esc(plain(r, r.min))}</span><span>${esc(plain(r, r.max))}</span></div></div>
        <button class="btn" id="lock">Lock it in</button>`}
    </section>`;
    if (!answered) {
      const sl = $("slider");
      sl.addEventListener("input", () => { $("readout").innerHTML = big(r, +sl.value); });
      $("lock").addEventListener("click", () => { state.guesses.push(+sl.value); store(key, state); render(); });
    } else {
      $("next").addEventListener("click", () => { state.i++; store(key, state); render(); });
    }
  }

  function reveal(r, g) {
    const p = score(r, g), t = tier(p);
    const pos = (v) => ((v - r.min) / (r.max - r.min)) * 100;
    const a = pos(r.ans), y = pos(g);
    const last = state.i === puzzle.rounds.length - 1;
    return `<div class="track" aria-hidden="true"><div class="rail"></div>
        <div class="gap" style="left:${Math.min(a, y)}%;width:${Math.abs(a - y)}%"></div>
        <div class="pin" style="left:${y}%">YOU</div>
        <div class="pin ans" style="left:${a}%">${esc(plain(r, r.ans))}</div></div>
      <div class="result"><div class="pts ${t[1]}">+${p}</div>
        <div class="verdict">${t[2]}. You said ${esc(plain(r, g))}, the answer was ${esc(plain(r, r.ans))}.</div></div>
      <div class="src">${esc(r.note || "")} <a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.src)} ↗</a></div>
      <button class="btn" id="next">${last ? "See my score" : "Next number"}</button>`;
  }

  function recordStats(total) {
    if (date !== today || state.counted) return;
    const s = load("margin:stats", { played: 0, sum: 0, streak: 0, best: 0, last: null });
    s.played += 1; s.sum += total;
    s.streak = s.last === addDays(today, -1) ? s.streak + 1 : 1;
    s.best = Math.max(s.best, s.streak); s.last = today;
    store("margin:stats", s);
    state.counted = true; store(key, state);
  }

  function renderFinal() {
    const pts = puzzle.rounds.map((r, k) => score(r, state.guesses[k]));
    const total = pts.reduce((s, x) => s + x, 0);
    const max = puzzle.rounds.length * 100;
    recordStats(total);
    const st = load("margin:stats", { played: 0, sum: 0, streak: 0, best: 0 });
    const grid = pts.map((p) => tier(p)[0]).join("");
    const share = `Margin No. ${puzzleNo(date)} · ${total}/${max}\n${grid}\n${CFG.siteUrl}`;
    $("stage").innerHTML = `<section class="card">
      <span class="chip">Final · ${pretty(date)}</span>
      <div class="total">${total}<small>/${max}</small></div>
      <div class="grid" aria-label="Round results">${grid}</div>
      <div class="rank">${rankFor(total * 500 / max)}</div>
      <pre class="share" id="share">${esc(share)}</pre>
      <div class="row"><button class="btn" id="copy">Copy result</button></div>
      <p class="note" id="copied" hidden>Copied. Paste it in the group chat.</p>
      <div class="stats">
        <div>${st.played}<span>Played</span></div>
        <div>${st.played ? Math.round(st.sum / st.played) : 0}<span>Avg score</span></div>
        <div>${st.streak}<span>Streak</span></div>
        <div>${st.best}<span>Best streak</span></div>
      </div>
      <ul class="recap">${puzzle.rounds.map((r, k) => `<li><span>${tier(pts[k])[0]} ${esc(r.cat)}: ${esc(plain(r, r.ans))}</span><b>+${pts[k]}</b>
        <a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.src)} ↗</a></li>`).join("")}</ul>
      <p class="note">New numbers at midnight Eastern. <a href="archive.html">Play past puzzles</a></p>
    </section>`;
    $("copy").addEventListener("click", () => {
      const ok = () => { $("copied").hidden = false; };
      const fallback = () => { const rg = document.createRange(); rg.selectNodeContents($("share")); const s = getSelection(); s.removeAllRanges(); s.addRange(rg); };
      if (navigator.share && /Mobi/i.test(navigator.userAgent)) { navigator.share({ text: share }).catch(() => {}); return; }
      try { navigator.clipboard.writeText(share).then(ok, fallback); } catch (e) { fallback(); }
    });
  }

  init();
})();
