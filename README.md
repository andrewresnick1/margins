# Margin: the daily news numbers game

Five numbers from this week's news. Players slide to a guess and score by how close they land. Plain HTML, CSS, and JavaScript with no framework and no database. Hosting is free.

## What's in here

| File | What it does |
| --- | --- |
| `index.html`, `game.js`, `styles.css` | The game |
| `config.js` | Site name, launch date, your URL, optional tip link |
| `puzzles/YYYY-MM-DD.json` | One file per day. This is the only thing you touch daily. |
| `puzzles/index.json` | List of available days. Rebuilt automatically by the check script. |
| `archive.html` | Past puzzles (replays don't count toward streaks) |
| `about.html`, `privacy.html` | Required by ad networks before they approve you |
| `scripts/validate.js` | Catches broken files and giveaway questions |
| `scripts/new-puzzle.js` | Creates a blank puzzle file |

The game picks the puzzle by today's date in Eastern time. If today's file is missing, it shows the most recent one with a notice, so a late morning never breaks the site.

---

## One-time setup (about 1 hour)

1. **Make a GitHub account** and create a new repository called `margin`. Upload all of these files to it (drag the folder onto the "Add file → Upload files" page).
2. **Make a Cloudflare account** (free). Go to **Workers & Pages → Create → Pages → Connect to Git** and pick the `margin` repo. Set:
   - Framework preset: **None**
   - Build command: `npm run check`
   - Build output directory: `/`
   
   Click Save and Deploy. You get a free `margin-xxxx.pages.dev` link right away. Every commit to GitHub redeploys automatically.

   *Why not Vercel:* its free Hobby plan is for personal, non-commercial projects, and a site with ads or tips is commercial. Cloudflare Pages' free plan has unlimited bandwidth and 500 builds a month, which covers a daily game easily. Skim Cloudflare's terms yourself before you add ads.
3. **Buy a domain** (~$12/yr; buying it through Cloudflare makes the next step one click). Check the name is free first: search it and look on Listdle and DLEDB for a game with the same name. In your Pages project go to **Custom domains** and add it.
4. **Edit `config.js`**: set `siteUrl` to your domain. Set `launchDate` to the day your first real puzzle goes live; puzzle numbers count from it.
5. **Edit `about.html` and `privacy.html`**: replace `hello@margin.example.com` with a real address (a free Gmail like `margingame@gmail.com` is fine).
6. **Turn on Cloudflare Web Analytics** (free) for daily visitor counts. Before you apply for ads, also add **Google Analytics 4**, since Mediavine Journey requires it: create a GA4 property and paste its tag into the `<head>` of `index.html` and `archive.html`.

Because the build command runs the checker, **a broken puzzle fails the deploy and the old site stays up**. You can't take the site down with a typo.

---

## Daily workflow (10–15 minutes)

You can do this entirely from your phone in the GitHub app or github.com.

1. **Pick five numbers** from the last day or two of news. Good sources: Pew, Gallup, AP-NORC, and YouGov polls; FEC and OpenSecrets for campaign money; congress.gov vote tallies; BLS and the Fed; Reuters and AP business stories.
2. **Write the file.** In the repo, open `puzzles/`, copy yesterday's file, rename it to tomorrow's date, and replace the five rounds. (Or paste five links into an AI with the prompt below and paste back its JSON.)
3. **Check every number against its source yourself.** This is the step that keeps you credible. One wrong answer that goes viral costs more than any shortcut saves.
4. **Commit.** Cloudflare deploys in about a minute. Check the deploy went green in your Pages project.

**Timing:** a puzzle file is readable by anyone who guesses its URL as soon as it's deployed. Publishing tomorrow's puzzle the evening before is fine; publishing a week ahead invites spoiler sites.

**Batching:** if you can't do it daily, do two or three on Sunday night using numbers that won't go stale (polls, money raised, markets), and do the rest on weekday mornings.

### Writing good questions

- **Make the range fair.** The slider starts in the middle, and the checker warns you if the answer is near the middle or the edges. Shift `min`/`max` so the answer lands around 20–40% or 60–80% of the way across.
- **Mix the types**: one poll %, one money figure, one count (votes, seats, people), one market or economy number, one wild card.
- **Stay nonpartisan.** Test what the number is, never what to think about it. "What share approve…" is fine; "How badly is X failing…" is not. A game both sides share grows twice as fast.
- **Keep questions under about 150 characters** so they fit on a phone without scrolling.
- **Use the `note`** for one surprising follow-up fact. It's what people screenshot.

### Puzzle file format

```json
{
  "date": "2026-10-20",
  "rounds": [
    {
      "cat": "Polls",
      "q": "Question text, under ~150 characters",
      "ans": 30, "min": 0, "max": 100, "step": 1,
      "prefix": "$", "suffix": "%",
      "note": "One surprising follow-up fact.",
      "src": "Outlet name, date",
      "url": "https://link-to-the-story"
    }
  ]
}
```

`prefix` and `suffix` are optional (`"$"` + `"B"` shows $25B; `"%"` shows 30%). Every file needs exactly 5 rounds.

### AI drafting prompt

Paste this into Claude along with 5–8 news links:

> Write a Margin puzzle for DATE as JSON in exactly this format: [paste the format above]. Use only numbers that appear in these articles: [links]. Pick 5 numbers across different categories (poll, money, count, markets/economy, world). Questions must be neutral and under 150 characters. Set min/max so the answer is not near the middle or the edges of the range. Put one surprising related fact in "note". Use the outlet name and date for "src". After the JSON, list each number with the exact sentence from the article it came from so I can verify it.

Then verify each number yourself against the quoted sentences before you commit.

### Running locally (optional, needs Node.js)

```
npm run new           # blank file for tomorrow
npm run check         # validate everything, rebuild the index
npm run dev           # play it at http://localhost:3000
```

Opening `index.html` directly from your files won't work, because browsers block loading the puzzle file that way. Use `npm run dev`.

---

## Growth plan

- **Week 1:** play it yourself daily and send it to 10–20 friends who follow the news. Fix whatever confuses them.
- **Week 2:** submit to Listdle, DLEDB, dles.io, and Playlin. Post on r/dailygames and politics-adjacent subreddits (read each sub's self-promotion rules first).
- **Ongoing:** post a 20-second daily TikTok or YouTube Short of you playing that day's puzzle and reacting to the answers. That's how Krillion spread. Big news days (debates, election night, jobs reports) are your best days to post.
- **Track** daily visitors in Cloudflare Web Analytics. You want to see the share-grid posts bringing people back.

## Making money

| Stage | Traffic | What to add | Rough income |
| --- | --- | --- | --- |
| Start | any | Ko-fi or Buy Me a Coffee link (set `supportUrl` in `config.js`) | $0–30/mo |
| Ads on-ramp | 1,000+ sessions/mo from US/UK/CA/AU | Apply to **Journey by Mediavine**. Needs GA4 connected, plus your about and privacy pages. | $10–30/mo at 1k sessions |
| Target | ~1,000–1,500 players/day (≈35k sessions/mo) | Journey ads + supporter link | ~$250–400/mo |
| Bigger | 50k+ sessions/mo | Full Mediavine or Raptive | scales with traffic |

When you're approved for ads, they'll give you a script tag to paste into the `<head>` of `index.html` and `archive.html`. Update `privacy.html` to name the ad partner.

Later options once you have regulars: a $3–5 one-time unlock for the full archive or an "unlimited" practice mode (Stripe Payment Links need no code), and a short daily email of the answers with sources.

**Taxes:** ad and tip income is self-employment income. Keep a simple record of what comes in and what you spend (domain, etc.).
