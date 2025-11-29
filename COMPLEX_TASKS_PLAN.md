# Complex Tasks Implementation Plan

## Overview
Extension of the Click for Charity PTC system to support multi-step, member-only tasks with manual completion and skip functionality.

## Current PTC System
- Simple "view page for X seconds" tasks
- Available to everyone (guests + members)
- Daily reset
- Auto-credit on timer completion
- Uses localStorage for tracking

## Complex Tasks Requirements

### Core Features
1. **Expandable UI**: Click anywhere to expand, click again (except buttons) to collapse
2. **Timer + Manual Complete**: Timer runs, then shows "Complete" button (no auto-credit)
3. **Skip System**: Skip button always visible, moves to "Skipped Tasks" page
4. **Member-only**: Requires login (profile data storage)

### Task Types (planned)
- Social media follows (X, YouTube, etc.)
- Platform sign-ups (Publish0x, Odysee, etc.)
- Multi-step actions with numbered lists

### UI Design
- **Compact view**: 2-line display with short description + skip button
- **Expanded view**: Full instructions + visit/skip buttons + timer + complete button
- **Mobile responsive**: Full-width when expanded, large tap targets (< 600px breakpoint)
- **Visual hierarchy**: Short descriptions indicate task type, optional icons later

### Task States & Data Flow
```
Task states: available → viewing → timer_complete → completed/skipped

User flow:
1. Click task area → expands
2. Click "Visit" → timer starts, new tab opens
3. Timer completes → "Complete" button appears
4. Click "Complete" → credit awarded, task marked completed
5. Click "Skip" → task hidden, moved to skipped list
```

### Data Structure

#### Task Object
```json
{
  "id": "unique_task_id",
  "title": "Short task title",
  "shortDescription": "Brief description for compact view",
  "instructions": "Detailed step-by-step instructions",
  "url": "https://example.com",
  "reward": 25,
  "duration": 30,
  "type": "social_follow|signup|multi_step",
  "icon": "optional_icon_name"
}
```

#### User Profile Storage
```json
{
  "completedComplexTasks": ["task_id_1", "task_id_2"],
  "skippedComplexTasks": ["task_id_3", "task_id_4"]
}
```

### Skip Management System
- **Skip button**: Always visible in compact view
- **Skipped Tasks page**: Shows all skipped items with unskip option
- **Persistence**: Skipped tasks stored in user profile
- **Cleanup**: Daily cron removes references to deleted tasks

### Technical Implementation

#### Files to Create/Modify
1. **complex-tasks.html** - Main complex tasks page
2. **skipped-tasks.html** - Skip management page
3. **js/complex-tasks.js** - Complex tasks logic
4. **js/skipped-tasks.js** - Skip management logic
5. **api/get-complex-tasks.php** - Fetch complex tasks
6. **api/update-user-tasks.php** - Update user task status
7. **admin/complex-tasks.html** - Admin interface
8. **css/style.css** - Additional styles for expandable tasks

#### API Endpoints
- `GET /api/get-complex-tasks.php` - Return available complex tasks
- `POST /api/update-user-tasks.php` - Update completed/skipped tasks
- `GET /api/get-skipped-tasks.php` - Return user's skipped tasks

#### Admin Interface
- Form fields: title, short description, detailed instructions, URL, reward, duration, type
- Task preview before publishing
- Enable/disable tasks
- Delete tasks (with cleanup consideration)

### Mobile Design Considerations
- **Tap targets**: Minimum 44px for buttons
- **Expandable content**: Full viewport width on small screens
- **Touch gestures**: Single tap to expand/collapse
- **Button placement**: Skip and Visit buttons easily accessible

### Development Sequence
1. **Complex tasks page** (main functionality)
   - HTML structure
   - Expandable UI
   - Timer + manual complete
   - Member-only access

2. **Skipped tasks page** (skip management)
   - Display skipped tasks
   - Unskip functionality

3. **Admin interface** (content management)
   - Task creation form
   - Task management

4. **Profile integration** (member-only features)
   - User profile updates
   - Task persistence

5. **Cron job** (cleanup)
   - Remove orphaned task references
   - Daily maintenance

### Security Considerations
- Member authentication required
- Server-side validation of task completion
- Rate limiting on task updates
- Sanitization of user inputs

### Future Enhancements
- Task categories with icons
- Task progress tracking
- Achievement system
- Task recommendations

## Notes
- Reuse existing PTC components where possible
- Maintain consistent UI/UX with current design
- Keep implementation simple and modular
- Test thoroughly on mobile devices

---
*Created: Nov 29, 2025*
*Last updated: Nov 29, 2025*
