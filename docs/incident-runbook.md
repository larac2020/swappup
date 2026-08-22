# SWAPPUP — Incident Runbook

Internal only — do not publish. Last updated: 22 August 2026.

## 1. What counts as an incident

- A payout is stuck, delayed, or fails to release automatically.
- A user reports money taken but no ticket/name-change received.
- A `fraud_cases` entry appears, or a user reports suspected fraud directly.
- The app, Lovable Cloud backend, or Stripe is down or erroring for users.
- Any report of a data/security issue (e.g. someone else's data visible, a document leak).

## 2. First steps — always, regardless of type

- Don't panic-fix in production. Read/assess before changing anything.
- Check Lovable Cloud status (Cloud tab) and Stripe Dashboard status first — is this a platform outage, not a Swappup bug?
- Note the time, affected user(s), and what you observe, before acting.
- If money is involved and you're unsure what to do: do nothing irreversible (no manual refunds/payouts) until you've checked this runbook's relevant section.

## 3. Playbook — stuck or failed payout

- Check the specific purchase record: is it within the normal 24h-post-flight window, or genuinely overdue?
- Check Stripe Dashboard directly for that payment's real status (held, failed, disputed).
- If Stripe shows funds fine but Swappup shows "stuck": likely a cron/edge-function issue — check Lovable Cloud logs for `release-escrow` / `expire-transfers` before assuming it's fraud.
- If genuinely stuck >48h past due: message the affected user proactively using the template in Section 6, don't wait for them to complain.

## 4. Playbook — suspected fraud or dispute

- Do not ban or refund immediately — review the evidence (ID verification record, transfer proof, session logs) first.
- Use the existing admin tools (`admin_resolve_fraud_case` / `admin_ban_seller`) rather than manual database edits.
- If genuinely unclear: hold the funds in escrow (don't release, don't refund) until resolved — this is what the dispute window exists for.
- Document the resolution and reasoning in the `fraud_cases` record, even if handled quickly.

## 5. Playbook — platform/backend outage

- Confirm scope: is it Lovable Cloud, Stripe, or Swappup's own frontend (Vercel)? Check each provider's own status page.
- If Lovable Cloud is paused/asleep: wake it manually from the Cloud tab.
- If it's a genuine third-party outage: there's nothing to fix — monitor and wait. Don't attempt workarounds that bypass escrow logic.
- If downtime exceeds a few hours during active listings/purchases: consider a temporary banner/notice once the app is reachable again.

## 6. Ready-to-send message templates

**Stuck payout, proactive outreach:**

> "Hi [name], we noticed your payout for [listing] hasn't released yet as expected. We're looking into it and will update you within 24 hours — no action needed from you right now."

**Confirmed platform outage:**

> "We're aware of an issue currently affecting [payments/listings/sign-in] and are working on it. Your funds/data are safe — nothing is lost, this is a temporary service issue. We'll update you as soon as it's resolved."

## 7. External contacts

- Stripe: Dashboard → Support (chat/ticket) — for anything payment-specific. [Add direct URL once available.]
- Lovable Cloud: Cloud tab → Support, or the project's Lovable chat directly.
- Backup/second contact: Business partner / co-director.

## 8. After the incident

- Write 2-3 lines on what happened and why, even for small incidents — patterns matter more than any single event.
- Decide: does this need a code fix, a process fix, or was it a one-off?
- If it's the 2nd+ similar incident this month: that's a signal to revisit the volume threshold for bringing in help (see Section 9).

## 9. When to stop doing this solo

Revisit bringing in part-time support once ANY of these is consistently true:

- More than 5 support/dispute emails in a single week.
- Any incident where you couldn't respond within your own target time because you were genuinely unreachable.
- The airline fee review queue has unreviewed items older than 2 weeks.
