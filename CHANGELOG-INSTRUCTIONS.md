# ClickForCharity Changelog Update Instructions

**IMPORTANT**: After completing **significant work** on ClickForCharity, update the public changelog.

---

## Location
- **Changelog File**: `/home/andy/work/projects/clickforcharity.net/site/changelog.html`
- **Instructions**: This file (CHANGELOG-INSTRUCTIONS.md)

## When to Update

**One simple test: would a user visiting the site notice or care?**

✅ **DO UPDATE for:**
- New pages or features they can use
- Bug fixes they would have noticed
- UI changes they can see
- Task/ad system behaviour changes
- Something that was broken and now works

❌ **SKIP for:**
- Typo fixes, style tweaks, code refactors
- Work-in-progress
- Security hardening, server config, deploy script changes
- Internal API changes with no visible effect
- Anything a user would never see or feel

---

## How to Update

### Format

Prepend a new entry **at the top** of the `<!-- EMBED:changelog -->` block:

```html
<!-- EMBED:changelog -->
<ul>
  <li><strong>YYYY-MM-DD</strong> · <strong>ClickForCharity</strong> — <span class="feature">Category</span> What changed and why it matters (keep to one line)</li>
  ... existing entries ...
</ul>
<!-- /EMBED:changelog -->
```

### Step-by-Step

1. From the repo root, run:
   ```bash
   ./add-changelog.sh "Category" "One-line description for non-technical readers."
   ```
   This auto-inserts today's date and the correctly-formatted entry.
2. **Deploy** so the live site is updated:
   ```bash
   bash /home/andy/work/projects/clickforcharity.net/deploy.sh
   ```

### Example Entry

```html
<li><strong>2026-04-11</strong> · <strong>ClickForCharity</strong> — <span class="feature">Task System</span> Tasks now refresh automatically after completion so users don't need to reload the page.</li>
```

---

## Categories (Optional)

Use these categories to label entries for clarity:

- `<span class="feature">Feature</span>` — New functionality
- `<span class="feature">Task System</span>` — Task/PTC changes
- `<span class="feature">Ad System</span>` — Banner/floating ad changes
- `<span class="feature">Auth</span>` — Authentication or role changes
- `<span class="feature">Bug Fix</span>` — Bug fixes
- `<span class="feature">Performance</span>` — Performance improvements

Or just use plain text if you prefer.

---

## Rules

1. **One entry per session/task** — not one entry per file changed
2. **Most recent at top** — new entries always go first
3. **Never remove old entries** — keep the full history
4. **One line only** — keep it concise
5. **Non-technical language** — write for users, not developers
6. **Pagination** — if the list exceeds 50 entries, paginate (show 50 per page, most recent first). Not needed yet but worth implementing before the page gets unwieldy.

---

## Aggregation (Meta-Changelog)

The `<!-- EMBED:changelog -->` / `<!-- /EMBED:changelog -->` comment tags exist so a future script can aggregate changelogs from all sites into one combined feed.

**How it works:**
- Each site has `changelog.html` with an `<!-- EMBED:changelog -->` block
- Each `<li>` entry identifies its source via `<strong>SiteName</strong>` (e.g. `ClickForCharity`, `ROFLFaucet`, `DirectSponsor`)
- A meta-changelog script can:
  1. Fetch the `changelog.html` from each site
  2. Extract the content between `<!-- EMBED:changelog -->` and `<!-- /EMBED:changelog -->`
  3. Merge all `<li>` entries and sort by date (the `YYYY-MM-DD` in the first `<strong>` tag)
  4. Render them on a central "All Updates" page

**Sites using this system:**
- `https://roflfaucet.com/changelog.html` — ROFLFaucet
- `https://directsponsor.net/changelog.html` — DirectSponsor
- `https://clickforcharity.net/changelog.html` — ClickForCharity

**To add more sites:** just ensure their `changelog.html` uses the same `<!-- EMBED:changelog -->` block and `<strong>YYYY-MM-DD</strong> · <strong>SiteName</strong>` entry format.

**Meta-changelog design notes (for when this gets built):**
- Navigation: show link buttons at the top of the page (one per site) rather than linking the site name inline on every entry — fewer links, less visual noise
- Pagination: show 50 entries per page to avoid loading a huge list on a single page

---

## AI Agent Reminder

After completing significant work, run from the repo root:

```bash
./add-changelog.sh "Category" "One-line description for non-technical readers."
```

Then deploy:
```bash
bash /home/andy/work/projects/clickforcharity.net/deploy.sh
```

**Ask yourself**: would a user visiting the site notice or care about this change? If yes, log it. If no, skip it.

Common categories: `Feature`, `Bug Fix`, `UI`, `Task System`, `Ad System`

---

## Footer Link

Once the changelog system is running across all sites, a link to `changelog.html` will be added to the site footer.
