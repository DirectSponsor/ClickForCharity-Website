# Include System for ClickForCharity

This directory contains reusable HTML components that are included in multiple pages using a comment-based include system.

## How It Works

The include system uses HTML comment markers to define where content should be inserted:

```html
<!-- include start sidebar.incl -->
[Content from includes/sidebar.incl gets inserted here]
<!-- include end sidebar.incl -->
```

The actual include content remains visible in the HTML files (between the markers) so you can see what's there, but when you run the processing script, it gets replaced with the latest version from the include file.

## Usage

### Making Changes to the Sidebar

1. Edit `includes/sidebar.incl` with your changes
2. Run `./process-includes.sh` from the project root
3. All pages will be updated automatically

### Variables

The sidebar uses `#VARIABLE#` markers for page-specific content:

- `#ACTIVE_HOME#` - Replaced with `class="active"` on index.html
- `#ACTIVE_PTC#` - Replaced with `class="active"` on ptc.html
- `#ACTIVE_SIMPLE_TASKS#` - Replaced with `class="active"` on simple-tasks.html
- `#ACTIVE_SKIPPED_TASKS#` - Replaced with `class="active"` on skipped-tasks.html
- `#ACTIVE_SURVEYS#` - Replaced with `class="active"` on surveys.html
- `#ACTIVE_OFFERS#` - Replaced with `class="active"` on offers.html

All unused variables are removed during processing.

## Files

- `sidebar.incl` - The main sidebar navigation component (logo, nav menu, user menu)

## Adding New Include Files

1. Create your include file in this directory (e.g., `footer.incl`)
2. Add markers in your HTML files:
   ```html
   <!-- include start footer.incl -->
   [Your footer content]
   <!-- include end footer.incl -->
   ```
3. Run `./process-includes.sh`

## Important Notes

- The include markers stay in the HTML as comments - they're not removed
- Content between markers gets replaced each time you run the script
- Admin pages (admin*.html) and sitemap.html are excluded from processing
- Always run `./process-includes.sh` before deploying to ensure all pages are in sync

## Deployment Integration

The `process-includes.sh` script should be run before deployment. You can add it to your deploy workflow:

```bash
./process-includes.sh
./deploy.sh
```
