# SatoshiHost × ClickForCharity: Free Hosting Pilot — Working Notes

*Status: Draft / internal — v0.3* via https://claude.ai/chat/b81dfac5-4654-4252-9a5a-ea3147c97dd2

## 1. The idea in one paragraph

Personally fund one cheap DirectAdmin reseller account ($7/month, 40 accounts) to give away free hosting to ~40 IndieWeb-style users, in exchange for them doing a small number of ClickForCharity tasks each day. This is a low-cost way to bootstrap real, regular users for both SatoshiHost.top and ClickForCharity at the very start — no elaborate funding mechanism needed, since it's cheap enough to just pay for directly. Longer term, SatoshiHost.com becomes commercial paid hosting (a separate, unrelated offering), and any future nodes wanting to replicate this "free hosting" trick would need to fund and sustain it themselves — which is a separate, optional problem, not something this pilot needs to solve.

## 2. Stages — what's "now" vs "later"

It's easy to conflate these, so worth keeping distinct:

**Stage 1 (this pilot, now):**
- One reseller account, paid for out of pocket (~$7/mo).
- 40 free accounts, given to users in exchange for ClickForCharity tasks.
- Purpose: get ClickForCharity and SatoshiHost.top their first real, regular users cheaply.
- Coins system: still useful here purely as the existing mechanism for tracking task completion — not as a funding/payment system.

**Stage 2 (future, decoupled):**
- SatoshiHost.com becomes commercial paid hosting — a normal hosting business, unrelated to ClickForCharity.
- "Free" hosting on SatoshiHost.top, going forward, is *not* tied to ClickForCharity tasks — those free users would instead generate revenue via faucets, surveys, etc. (the more typical "free hosting funded by ads/offers" model).
- This decoupling matters: Stage 1 is specifically about helping ClickForCharity get off the ground; once it doesn't need that boost anymore, free hosting and ClickForCharity go their separate ways.
- **The transition itself is organic, not a hard cutoff.** There's no defined trigger metric — it'll just become apparent when ClickForCharity doesn't need this particular boost anymore. At that point, existing Stage 1 users can be moved across one at a time (to the faucets/surveys free-hosting model), rather than switching everyone at once.
- **No forced migration needed.** The same reseller account keeps being useful once people are on faucets/surveys instead of ClickForCharity tasks — so nobody currently getting free hosting needs to be cut off; they just quietly shift from "doing ClickForCharity tasks" to "doing faucets/surveys" as the reason their account stays free.

**Future nodes (other operators replicating this, later):**
- Entirely optional, not policy. See Section 8.

## 5. Added benefit: burning SatoshiHost.top coins boosts ClickForCharity donor incentive

Building on the coins-to-sats donation system (users converting earned coins to sats and donating to a project on directsponsor.net via the ClickForCharity Coinos wallet, at a rate of `total sats in wallet ÷ total coins outstanding`):

- SatoshiHost.top users earn coins for their daily tasks, but those coins are only ever redeemed for hosting — never converted to sats or donated.
- When those coins are **burned** (removed from circulation) rather than redeemed for sats, the total coin count drops while the sats in the wallet stay the same — so every remaining ClickForCharity coin becomes worth *more* sats.
- Net effect: SatoshiHost.top's cohort quietly increases the payout value of everyone else's coins, without any sats ever leaving the wallet. This is a direct incentive boost for ClickForCharity's actual donor-facing users to keep participating.
- **Framing for SatoshiHost.top users themselves:** worth presenting this as a plus, not a footnote — their coins fund free hosting *and* indirectly support the wider charity pool, since burning their coins raises value for everyone else. "You're helping charity too" is a fair and honest way to put it.

Two things worth being clear on internally:
- **Transparency** — SatoshiHost.top users should understand their coins get them hosting, not sats/donations directly (so nobody feels misled if they compare notes with a ClickForCharity donor redeeming for sats).
- **Permanence** — burning is a one-way door; once burned, that value is redistributed for good. Worth confirming that's the intended design (vs. wanting a future path where SatoshiHost.top coins could convert too).

## 6. Why the IndieWeb / web revival community specifically (for Stage 1)

Also known as: the "web revival," "small web," or "personal web resurgence" movement. Flagship platforms: **Neocities** (2013, Kyle Drake's GeoCities revival) and **Nekoweb**; community hubs like wiki.melonland.net; adjacent scenes: "digital gardens," the "1MB club."

Why they're a good first cohort:
- They already value free, non-corporate, DIY hosting — it's core to their identity, not a hard sell.
- Low spam risk: nobody stumbles into building a personal HTML site by accident. Self-selection filters out low-effort sign-ups.
- They're comfortable with quirky, manual-feeling sign-up flows (webrings, guestbooks, invite systems) — a "do small tasks to earn your account" model fits the culture rather than fighting it.
- Built-in virality: webrings and "neighbours" sections mean satisfied users naturally link to and recruit others.

Open question: best channels to reach them (Neocities forums/Discord, melonland wiki, relevant subreddits, Mastodon/Fediverse indieweb tags) — needs a bit more research before outreach.

## 7. The mechanics (Stage 1)

- **Hosting supply:** 1 DirectAdmin reseller account, $7/month, 200GB space, paid for directly (not coin-funded).
- **Accounts per reseller pack:** 40 accounts (kept safely within 200GB — ~5GB/account average, leaves headroom).
- **Cost per account:** $7 / 40 = **$0.175/month**.
- **Access model:** Free full DirectAdmin account + subdomain, in exchange for a small number of ClickForCharity tasks per day.
- **Task tracking:** Existing coins system already logs completed work — coin balance = proxy for "hours/tasks contributed." No new tracking infrastructure needed for v1.
- **Eligibility / anti-abandonment:** Needs a minimum-coins-per-week threshold to keep the account (prevents someone doing tasks once, grabbing hosting, then vanishing) — *to be defined*.

## 8. Future nodes replicating this (optional, not policy)

If other nodes want to try the same "cheap reseller to 40 users to free hosting" trick to build their own independent user base, several options exist, all optional, none mandatory:

- **Small fundraiser for their own reseller account** — roughly $100 covers a first year; the idea being that among 40 hosted users, a few will likely convert to paying customers over time, making the reseller account self-sustaining without needing any coins/payment infrastructure of its own. Simple crowdfund-style ask, not a complex mechanism.
- **Fundraiser specifically for commercial hosting** — if a node would rather skip the "free tier + tasks" model entirely and just fund straightforward paid hosting.
- **Use our free hosting instead** — a node doesn't have to run its own reseller account at all; it can simply direct people to the free hosting already on offer here.

None of this is prescribed — it's just a menu of cheap options a node could pick from if it wants to become hosting-independent. Each option has a different trade-off between effort, independence, and speed.

## 9. Open questions to resolve before launch

1. **Task definition** — what exactly counts as a "task"? Needs to be small enough to be low-friction daily, but meaningful enough to justify hosting cost.
2. **Coin threshold for keeping an account** — minimum activity to avoid squatting, without it feeling like a second job.
3. **Reclaiming inactive accounts** — process for freeing up slots from users who stop contributing, so the 40 slots don't get squatted.
4. **Reseller reliability** — you said it "seems reliable so far" — worth defining a fallback/backup plan (second reseller, or export/backup process) before depending on it for real users' sites.
5. **Legal/ToS check** — reseller hosting terms, and whether "tasks for hosting" creates any obligations worth being aware of.
6. **Onboarding flow** — sign-up to task assignment to coin balance check to DirectAdmin account provisioning. Manual at first, or scripted from day one?
7. **Outreach channel** — see Section 6's open question.
8. **Stage 1 to Stage 2 transition** — no fixed trigger by design; it'll be judged by feel when ClickForCharity no longer needs the boost. Worth deciding: does "moving users across one at a time" need any process at all, or is it genuinely just an informal, whenever-it-comes-up shift?
9. **Scaling within Stage 1** — what happens at account #41? A second self-funded reseller pack, or hold at 40 until Stage 1's goal is met?

## 10. Rough next steps

- [ ] Define the task list (v1, small set to start)
- [ ] Define coin thresholds (minimum activity to keep an account)
- [ ] Draft the sign-up/onboarding flow (even if manual for pilot)
- [ ] Pick 2-3 outreach channels in the IndieWeb space and lurk/scope them out
- [ ] Confirm reseller hosting ToS allows this use case
- [ ] Provision first 5-10 accounts as a soft pilot before opening all 40
- [ ] (Optional, low priority) Decide if moving users from ClickForCharity tasks to faucets/surveys needs any process, or stays informal case-by-case
- [ ] Write the external-facing version of this doc once the model is validated internally

## 11. How this fits the bigger picture

This is a small, cheap ($7/mo, self-funded) real-world test of getting ClickForCharity its first real users cheaply, using free hosting as the hook. It's deliberately simple in Stage 1 — no coin-funded seed rounds, no franchise mechanics required. The more ambitious "nodes replicate this and become independent" idea (Section 8) is a genuinely interesting option for later, but it's explicitly optional and separate from what Stage 1 needs to succeed.
