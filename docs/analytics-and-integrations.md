# Analytics and integrations, the plan

Helper notes for the Pulse "command center" (the Analytics page). Nothing here is
wired yet, this is the map so we can turn sources on one at a time. No secret
values live in this repo, only the names of the env vars and where they go.

## The idea

One board in Pulse that watches everything Neon Burro runs: the studio site, the
shop, order, lounge, Pulse itself, plus the money and the pipeline. Built in
tiers so each piece ships on its own.

## Tier 1, ready now, no new tools

**Deploy health across every property.** The Netlify API lists every site in the
account and each site's last deploy (state, time, build duration, published URL).
That is real "is it up, did the last build pass" for all properties at once.

- Needs: the `NETLIFY_PAT` value added to the **Pulse** Netlify site
  (Site configuration -> Environment variables). Same token already on the studio
  site works for the whole account, or mint a fresh one at
  User settings -> Applications -> Personal access tokens.
- Build: a Netlify function `netlify-sites.js` that calls
  `GET https://api.netlify.com/api/v1/sites` and `/sites/{id}/deploys?per_page=1`
  with the PAT, returns a small array. The page renders a row per site.

**Revenue and pipeline from Supabase.** Pulse already reads the database. Money in
and outstanding from invoices and payments, active clients, open sprints,
subscriptions, forms in, shop orders, Solana settlements. No new keys.

## Tier 2, web traffic, pick one tool

This is the one that needs a real decision, because it needs a script on every
site and an account. Options, roughly best fit first:

- **Plausible** (recommended). One lightweight script per site, one Stats API key,
  privacy first, no cookie banner. Clean API to pull all five properties into one
  Pulse board. Cloud is about 9 to 19 a month for everything, or self host.
  Env: `PLAUSIBLE_API_KEY` on the Pulse site, sites addressed by their domain.
- **GA4 plus Firebase.** Already on the studio site. Free and powerful, but the
  Data API is heavier: a Google service account and a property id per site, and
  the JSON is chattier. Good if we want to lean on what is already there.
- **Netlify Analytics.** Server side, no script, but it is 9 a month PER site and
  has no real public API, so it is a dashboard not a source we can pull into
  Pulse. Skip for the unified board.
- **Umami / Vercel style.** Umami self hosts, needs its own database, more ops.

Note on Ahrefs and Semrush: those are SEO tools (keywords, backlinks, rank
tracking), a different job than traffic analytics. Worth having for growth work,
but they answer "how do we get found" not "who visited today", so they are not
the tool for this board.

Safari vs Google: the browser someone uses does not change which analytics tool
we pick. Plausible, GA4 and the rest all count Safari, Chrome and the rest the
same. The search bar in Safari defaulting to Google is a separate thing about
where our SEO traffic comes from, which is the Ahrefs/Semrush question above.

## Tier 3, Stripe money, existing key

MRR, recent charges, balance and payouts, live in the board.

- Needs: the `STRIPE_SECRET_KEY` value added to the **Pulse** site (same value
  that is on the studio site). Live key, so it never appears in code or in this
  repo, it only lives in Netlify env.
- Build: a function `stripe-metrics.js` that reads balance, recent charges and
  active subscriptions and returns totals.

## Env vars, all on the Pulse Netlify site

| name | tier | where the value comes from |
|---|---|---|
| `NETLIFY_PAT` | 1 | copy from the studio site, or mint a new personal access token |
| `PLAUSIBLE_API_KEY` | 2 | Plausible -> Settings -> API keys, only if we choose Plausible |
| `STRIPE_SECRET_KEY` | 3 | same value as the studio site's live secret key |

Claude never handles these values. Paste them in the Netlify dashboard, tell me
the name is set, and I wire the function against it.
