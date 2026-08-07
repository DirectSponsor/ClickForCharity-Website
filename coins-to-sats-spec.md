[via https://claude.ai/chat/bde6e326-8e38-41b4-8629-42e3fd12b66a]


# Coins-to-Sats Redemption System — Spec

## Overview

This system lets users on **clickforcharity.net** (and related sites) convert their accrued "coins" into a real Bitcoin (Lightning) payment to a project of their choice on **directsponsor.net**. The coins have no fixed price — their value floats based on how much real BTC has been donated into a shared reserve wallet versus how many coins currently exist.

The reserve wallet is a **coinos.io** account named `clickforcharity`, funded by ad revenue and other donations. Coins represent a pro-rata claim on that wallet's balance. There is no USD or fiat conversion anywhere in this system — it is purely coins-for-sats, denominated in sats.

Redemption payments are made **manually** by the site admin (not via an automated write-API to the wallet), triggered by a Telegram notification, to keep the pending window short.

---

## Core Formula

```
sats_per_coin = wallet_balance_sats / total_coins_in_circulation
sats_owed     = coins_being_redeemed × sats_per_coin
```

Both values are calculated **live, at the moment a redemption request is made** — not on a fixed schedule. `wallet_balance_sats` is read from Coinos (see Balance Tracking below); `total_coins_in_circulation` is read live from the DirectSponsor auth server.

Once calculated, `sats_owed` is **locked in** at the moment of request and never recalculated later, even if the rate drifts before the admin manually pays it.

---

## Preventing Overspend (Pending Ledger)

Because payment is manual, there's a gap — possibly minutes to days — between a user requesting redemption and the admin actually sending sats. During that gap, multiple requests can queue up. To prevent promising more sats than the wallet holds:

```
available_sats = wallet_balance_sats − sum(sats_owed for all requests in "pending" state)
```

### Redemption request flow

1. User specifies an amount of coins to redeem and a target project.
2. System reads current `wallet_balance_sats` (cached, see below) and current `total_coins_in_circulation` (live).
3. Calculate `sats_per_coin` and `sats_owed` for the requested coin amount.
4. Check: `sats_owed ≤ available_sats`?
   - **If yes:** proceed to step 5.
   - **If no:** reject the request with a clear message (e.g. "Insufficient reserve right now — try again later or reduce the amount"). Optionally let the user queue/retry.
5. Deduct the redeemed coins from the user's balance and from total circulation **immediately** (via `update_balance.php`).
6. Create a `pending` record storing: user, project, coins burned, `sats_per_coin` used, `sats_owed` (locked), timestamp.
7. Send a Telegram notification to the admin group with the payment details.
8. Request sits as `pending` until manually paid.

### Admin payment flow (via existing invoice system)

Rather than the admin manually looking up a project's wallet and sending an arbitrary amount, reuse the **same invoice-generation flow already used for donations**:

1. Admin logs into a "Pending Payments" page on clickforcharity.net, showing all `pending` redemption requests (project, coins burned, `sats_owed`, requested time).
2. Admin clicks **Pay** on a request.
3. System generates a Lightning invoice for exactly `sats_owed`, on the recipient project's account — using the exact same mechanism already used when someone makes a direct donation to that project.
4. Admin takes that invoice and pays it from the `clickforcharity` coinos wallet (same manual step as before, but now there's no risk of mistyping an amount or address — the invoice already encodes both).
5. System detects the invoice has been paid — either by polling the invoice status via Coinos, or by checking the recipient's account for the matching incoming payment (same detection method the existing donation system already uses).
6. On confirmed payment: mark the request `paid`, log the transaction, update the accounts/ledger view, and **notify the user** their redemption was completed.
7. If an invoice expires unpaid (admin didn't get to it in time), regenerate a fresh invoice for the same pending request rather than leaving it stuck.

This keeps the "admin manually sends the actual sats" security property (no write-enabled wallet API exposed anywhere) while removing manual amount-entry errors and manual bookkeeping — the invoice is the source of truth for both the amount and the confirmation.

### Failure/edge handling
- If a payment can't be completed (e.g. recipient wallet issue), mark as `failed`, and **restore the coins** to the user's circulating balance so they aren't lost. Notify the admin group.

---

## Balance Tracking (Coinos Wallet)

- Poll the Coinos API roughly **hourly** for wallet balance/transaction history as a baseline.
- Additionally, since Coinos will report new deposits as they land, update the cached balance whenever a new incoming transaction is detected (via API check), rather than waiting for the next hourly poll.
- The `wallet_balance_sats` used in calculations should be the most recently known figure minus anything already committed to pending requests (see `available_sats` above) — i.e., the live "spendable" figure, not the raw wallet total.
- **Confirmed:** the `clickforcharity` coinos wallet (`clickforcharity@coinos.io`) is dedicated solely to this purpose. Every sat that lands in it — ad revenue payments, direct donations via a simple donate button, or anyone sending straight to the Lightning address/coinos page — is treated as backing the coin pool. No separation logic is needed; the entire wallet balance is always the coin-backing reserve.

---

## Coin Circulation (Source of Truth)

- Total coins in circulation is **not a fixed issued supply** — coins are awarded for tasks, games, faucet claims, etc., across clickforcharity.net and possibly other sites.
- Balances live in the **DirectSponsor auth server** database, accessed via:
  - Read: `https://auth.directsponsor.org/api/get_balance.php`
  - Write: `https://auth.directsponsor.org/api/update_balance.php` (POST, shared-secret authenticated)
- **Open item:** there is currently no known single endpoint for "total coins in circulation across all users." This likely needs to be built — either:
  - (a) a new endpoint on the auth server that sums all user balances, or
  - (b) a maintained running total (incremented on award, decremented on redemption/burn) stored alongside individual balances.
  - Recommend (b) for performance, since summing all user balances live on every redemption could get expensive as the user base grows. This running total must stay perfectly in sync with real balances — worth a periodic reconciliation check (sum of all balances vs. the running total) to catch drift.

---

## DirectSponsor Payout Side

- Each project on directsponsor.net that can receive coin-funded donations has its own **coinos.io wallet**, so transactions can be independently verified by checking that wallet's incoming payment history.
- Payment is made via a **Lightning invoice generated on the recipient project's account**, using the existing donation invoice mechanism — not a raw address/manual amount entry. The admin pays that invoice from the `clickforcharity` coinos wallet. Since both sender and recipient are on coinos, no routing fees apply.

---

## Splitting

- Simplified: **one redemption request = one project.** A user may redeem any amount of their coin balance they choose, but each request targets a single project. (Multiple requests to different projects are fine, just not combined in one transaction.)

---

## Rounding

- Coin-to-sat conversion will rarely divide evenly. Round `sats_owed` **down** (in the wallet's favor) to avoid ever promising more than the wallet holds.
- Since both wallet balance and coin circulation shift together with every redemption, minor rounding is self-correcting over time and does not accumulate into a meaningful discrepancy.

---

## Audit Log

Append-only log, one entry per redemption request, recording:

| Field | Description |
|---|---|
| timestamp | when the request was made |
| user | who requested |
| project | target project |
| coins_burned | amount of coins redeemed |
| wallet_balance_sats_at_request | snapshot used in calc |
| coins_in_circulation_at_request | snapshot used in calc |
| sats_per_coin | calculated rate |
| sats_owed | locked-in amount |
| status | pending / paid / failed |
| paid_timestamp | when admin fulfilled it |
| txid / reference | if available from coinos |

This makes the whole system independently verifiable by users or auditors — anyone can check that the rate used was fair given the public wallet balance and circulation at that time.

---

## States

```
requested → pending → invoice_generated → paid → user_notified
                                        ↘ expired → (regenerate invoice)
                    ↘ failed → (coins restored to user)
```

---

## Open Items for Implementation (for Claude Code / engineer)

1. Build the "total coins in circulation" running total on the auth server (or a summing endpoint), with a reconciliation safeguard.
2. Build the pending-request ledger and `available_sats` calculation.
3. Integrate Coinos API (read-only: balance + transaction history) with hourly polling + event-based balance refresh.
4. Build Telegram bot/webhook integration for: new redemption request alerts, and overspend-prevention alerts (a request was rejected due to insufficient available sats).
5. Build an admin "Pending Payments" dashboard page: list pending requests, a Pay button per request that generates an invoice via the existing donation-invoice code path, and status tracking (pending → invoice generated → paid).
6. Reuse/extend the existing invoice-payment detection logic (used for donations) to also confirm and close out coin redemption requests, and trigger user notification on success.
7. Confirm each DirectSponsor project's coinos wallet/Lightning address format (this is likely already solved by the existing donation invoice system — confirm it can be reused as-is).
8. Decide on user-facing messaging when a request is rejected for insufficient available sats (retry later? auto-queue?).
9. Decide notification method for users (email, in-site notification, both?).

---

## Design Principles Recap

- **No fiat/USD conversion** — purely coins-as-share-of-sats-pool.
- **Live calculation at request time**, locked in immediately — no recalculating later.
- **Coins burned + sats committed happen atomically** at request time, not at payment time — this is what prevents overspend even with manual, delayed payment.
- **Round down**, self-correcting over time.
- **Transparent, append-only audit trail.**
- **Manual payment**, sped up via Telegram alerts rather than automated wallet write-access — trades a little automation for a lot of security (no write-enabled API key exposed anywhere).
