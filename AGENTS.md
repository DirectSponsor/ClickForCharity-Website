# ClickForCharity.net - AI Agent Guide

This file documents important system information for AI agents working on ClickForCharity.net.

## Project Overview

**ClickForCharity.net** is a platform where users support charitable projects through actions rather than money — completing tasks and viewing ads earns coins that are allocated to real verified projects.

- **Live Site**: [clickforcharity.net](https://clickforcharity.net/)
- **Tech Stack**: PHP/Apache, file-based storage, shared auth system
- **Data Directory**: `/var/clickforcharity-data/` (user data, separate from site code — never commit or expose)
- **Web Root (local)**: `/home/andy/work/projects/clickforcharity.net/site/`
- **Web Root (server)**: `/var/www/clickforcharity.net/public_html/`
- **Server**: ES1 (`clickforcharity` SSH alias, 89.116.173.103)

## Part of the DirectSponsor Ecosystem

- **directsponsor.net** — main charity platform and project management
- **roflfaucet.com** — gaming site where players earn coins for charity
- **auth.directsponsor.org** — shared authentication across all sites

## Key Systems

### Authentication
- Shared JWT-based auth via `auth.directsponsor.org`
- Auth JS loaded from shared script — do not duplicate auth logic locally

### Task & Ad System
- **Tasks/PTC**: Users complete tasks to earn coins (`api/get-tasks.php`, `api/save-task.php`)
- **Banner Ads**: Rotated via `api/get-ads.php`, managed via admin interface (`admin-ads.html`)
- **User Balance**: Tracked via `api/get_balance.php`

### Content Management
- **Include System**: Uses HTML comments for auto-included content
  - Format: `<!-- include file.html -->` and `<!-- end include file.html -->`
  - Updated via `build.sh` to maintain consistency across pages
- **Build Script**: `/home/andy/work/projects/clickforcharity.net/build.sh`

## Important Rules

1. **Data Protection**: User data in `/var/clickforcharity-data/` must never be exposed or accidentally committed
2. **Build Process**: After content changes, run `build.sh` to update included files across pages
3. **Deployment**: Always use `deploy.sh` — it handles permissions, backups, and git push correctly
4. **Data Directory**: Kept parallel to `/site/`, not inside it — never rsync or deploy to it

## Quick Reference

### Common Commands

```bash
# Build — updates included content across all pages
./build.sh

# Deploy — commits, pushes to GitHub, rsyncs to server, fixes permissions
./deploy.sh

# Check server directly
ssh clickforcharity
```

### Project Directories

| Path | Purpose |
|------|---------|
| `/home/andy/work/projects/clickforcharity.net/site/` | Web root (HTML, PHP, assets) |
| `/home/andy/work/projects/clickforcharity.net/site/api/` | PHP API endpoints |
| `/home/andy/work/projects/clickforcharity.net/site/includes/` | Reusable HTML includes |
| `/home/andy/work/projects/clickforcharity.net/docs/` | Documentation |
| `/var/clickforcharity-data/` | Live user data (not in repo) |

### Important Files

- `build.sh` — updates included content across pages
- `deploy.sh` — handles deployment with permissions and git push
- `site/api/` — all PHP API endpoints
- `AGENTS.md` — this file (agent guide)

---

## Changelog — AI Agent Reminder

After completing **significant work** on this project, update the public changelog.

- **File**: `site/changelog.html` — prepend a new `<li>` inside the `<!-- EMBED:changelog -->` block
- **Instructions**: `CHANGELOG-INSTRUCTIONS.md` — full format, categories, and rules
- **Format**: `<li><strong>YYYY-MM-DD</strong> · <strong>ClickForCharity</strong> — <span class="feature">Category</span> One-line plain-English summary.</li>`
- **When**: new features, bug fixes with user impact, task/ad system changes, deployment changes
- **Skip**: typos, refactors, style tweaks, WIP
- **Then deploy**: `bash /home/andy/work/projects/clickforcharity.net/deploy.sh`
