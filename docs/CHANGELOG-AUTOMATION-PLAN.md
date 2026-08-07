# Changelog Automation Plan

**Status**: Planned — not yet implemented  
**Goal**: Make changelog updates automatic/mechanical so AI agents never skip them.

---

## Problem

The current process requires AI agents to manually edit HTML at the end of a session. This is unreliable — it gets skipped almost every time despite the instructions in `CHANGELOG-INSTRUCTIONS.md`.

---

## Solution (4 steps)

### Step 1 — `add-changelog.sh` helper script

Create in each repo root. Usage:

```bash
./add-changelog.sh "Bug Fix" "Task counter no longer resets when user refreshes."
```

- Auto-derives today's date (YYYY-MM-DD)
- Builds the correctly-formatted `<li>` entry
- Prepends it inside the `<!-- EMBED:changelog -->` block in `site/changelog.html`
- Prints confirmation

AI agents call one command instead of editing raw HTML — no formatting errors.

**Same script goes in each repo** (roflfaucet, directsponsor, clickforcharity) with the site name baked in.

### Step 2 — Windsurf workflow file

Create `.windsurf/workflows/update-changelog.md` in each repo.

- Gives Cascade a named, discoverable procedure
- Triggerable via `/update-changelog` slash command
- Contains: when to run it, the script command, then run `deploy.sh`

### Step 3 — Update `AGENTS.md`

Replace the current manual HTML-editing instructions in the "Changelog — AI Agent Reminder" section with the single script command. Makes it impossible to misformat.

### Step 4 (optional) — Warning in `deploy.sh`

Add a check: if `site/changelog.html` hasn't changed since the last git commit, print a warning but don't block the deploy. Safety net for when both human and AI forget.

---

## Repos to update

- `/home/andy/work/projects/clickforcharity.net/`
- `/home/andy/work/projects/roflfaucet.com/` (or wherever it lives)
- `/home/andy/work/projects/directsponsor.net/` (or wherever it lives)

Each needs: `add-changelog.sh`, `.windsurf/workflows/update-changelog.md`, updated `AGENTS.md`.

---

## Implementation order (when ready)

1. Implement and test `add-changelog.sh` on clickforcharity first
2. Create `.windsurf/workflows/update-changelog.md`
3. Update `AGENTS.md`
4. Optionally add `deploy.sh` warning
5. Repeat for other repos

**Note**: AI agent needs access to all three repo directories to implement across all sites.
