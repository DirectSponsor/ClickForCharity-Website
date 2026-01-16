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

### Task Types & Organization

#### Task Categories (Tabbed Interface)

**Tab 1: Follows & Subscriptions** (One-time actions)
- Social media follows (X/Twitter, Facebook, YouTube channels, Odysee, etc.)
- Platform sign-ups (Publish0x, Odysee accounts, etc.)
- Newsletter subscriptions
- **Characteristic**: User performs once, stays subscribed/followed
- **Completion**: Once completed, task never reappears for that user

**Tab 2: Engagements** (Repeatable actions)
- Like specific posts/videos
- Comment on content
- Repost/share content
- Watch specific videos
- **Characteristic**: Different content each time, repeatable
- **Completion**: Task completes but similar tasks can appear again

**Tab 3: Sign-ups & Registrations** (One-time, multi-step)
- Create accounts on new platforms
- Complete profile setups
- Verify email/phone
- **Characteristic**: Complex multi-step process, one-time per platform
- **Completion**: Once done, never reappears

#### Platform Membership Manager

**Purpose**: Track which platforms users are members of to filter relevant tasks and avoid clutter.

**Common Platforms** (Free checkbox, no reward):
- X/Twitter
- Facebook
- YouTube
- Instagram
- TikTok
- Reddit
- LinkedIn

**Rewarded Platforms** (25 coins one-time reward for joining + checking off):
- Odysee
- Publish0x
- Rumble
- BitChute
- Minds
- Gab
- LBRY
- Mastodon
- Substack
- Medium

**Implementation**:
1. **Settings page section** or **dedicated "My Platforms" page**
2. **Initial setup prompt**: "Select platforms you're already a member of to see relevant tasks"
3. **User profile storage**: Array of platform IDs user has checked
4. **Task filtering**: Only show tasks for platforms user has marked as member
5. **One-time rewards**: Track which rewarded platforms user has claimed bonus for

**User Profile Addition**:
```json
{
  "memberPlatforms": ["x", "youtube", "facebook", "odysee"],
  "rewardedPlatforms": ["odysee", "publish0x"],
  "completedComplexTasks": ["task_id_1", "task_id_2"],
  "skippedComplexTasks": ["task_id_3", "task_id_4"]
}
```

**Workflow**:
1. User visits complex tasks page for first time
2. Prompt: "Let's personalize your experience! Check platforms you're a member of"
3. User checks X, YouTube, Facebook (no reward)
4. User checks Odysee (gets 25 coins + badge: "Thanks for joining Odysee!")
5. Tasks filtered to only show X, YouTube, Facebook, Odysee tasks
6. User can update platform list anytime in settings

**Admin Benefits**:
- Create tasks for niche platforms without cluttering main user experience
- Encourage users to join new platforms with rewards
- Better task targeting and completion rates

### UI Design

#### Page Structure
- **Tab Navigation**: Three tabs at top of page
  - "Follows & Subscriptions" (default)
  - "Engagements"
  - "Sign-ups"
- **Tab switching**: Simple CSS/JS toggle, no page reload
- **Task count badges**: Show available tasks per tab (e.g., "Engagements (12)")

#### Task Card Design
- **Compact view**: 2-line display with short description + skip button
- **Expanded view**: Full instructions + visit/skip buttons + timer + complete button
- **Mobile responsive**: Full-width when expanded, large tap targets (< 600px breakpoint)
- **Visual hierarchy**: Short descriptions indicate task type, optional icons later
- **Platform indicator**: Small icon/text showing platform (X, YouTube, Odysee, etc.)

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
  "category": "follows|engagements|signups",
  "platform": "x|youtube|facebook|odysee|publish0x|etc",
  "requiresLogin": true,
  "repeatable": false,
  "icon": "optional_icon_name"
}
```

**Field Explanations**:
- `category`: Determines which tab the task appears in
- `platform`: Platform name for display/filtering
- `requiresLogin`: Shows "Login required" badge if true
- `repeatable`: If false, task disappears after completion; if true, can appear again with different content

#### Practical Examples

**Follows & Subscriptions Tab**:
```
Task: "Follow @CharityProject on X"
- User clicks, follows account, completes task
- Task never appears again for this user
- Platform: X (most users already logged in)

Task: "Subscribe to CharityChannel on YouTube"
- User subscribes to channel
- One-time action, permanent subscription
- Platform: YouTube (most users already logged in)

Task: "Follow CharityOrg on Odysee"
- User may need to create/login to Odysee account first
- Badge shows "Login required"
- Once followed, task disappears forever
```

**Engagements Tab**:
```
Task: "Like this post about clean water"
- User likes specific post
- Task completes, but tomorrow there's a different post to like
- Repeatable with different content

Task: "Comment on this video"
- User leaves comment on specific video
- Different videos can appear as new tasks
- Repeatable action type

Task: "Repost this fundraiser update"
- User shares/reposts specific content
- New content can be posted as new tasks
- Repeatable with different posts
```

**Sign-ups Tab**:
```
Task: "Create Publish0x account"
- Multi-step: Sign up → Verify email → Complete profile
- Complex instructions with numbered steps
- One-time per platform, never repeats

Task: "Join Odysee and verify account"
- Sign up → Verify → Follow first channel
- Detailed instructions for new users
- Permanent completion
```

#### User Profile Storage

**Extends existing profile text file system** (`/var/clickforcharity-data/userdata/profiles/{user_id}.txt`):

```json
{
  "user_id": "123-username",
  "username": "username",
  "level": 1,
  "settings": {...},
  "stats": {...},
  
  // NEW FIELDS for complex tasks:
  "memberPlatforms": ["x", "youtube", "facebook", "odysee"],
  "rewardedPlatforms": ["odysee", "publish0x"],
  "completedComplexTasks": ["task_id_1", "task_id_2"],
  "skippedComplexTasks": ["task_id_3", "task_id_4"]
}
```

**Storage notes**:
- All data stored in single JSON text file per user
- Simple array fields, easy to read/write
- No database needed
- Compatible with existing profile system

### Task Filtering & Visibility Logic

#### Tab Filtering
```javascript
// Client-side filtering by category
const followsTasks = allTasks.filter(t => t.category === 'follows');
const engagementTasks = allTasks.filter(t => t.category === 'engagements');
const signupTasks = allTasks.filter(t => t.category === 'signups');
```

#### Task Visibility Rules
1. **Non-repeatable tasks** (`repeatable: false`):
   - Once completed, task ID added to `completedComplexTasks`
   - Task never shown again to that user
   - Examples: Follows, subscriptions, account sign-ups

2. **Repeatable tasks** (`repeatable: true`):
   - Task ID added to `completedComplexTasks` when done
   - Same task ID can be reused with different content (new URL, new post)
   - Admin can create multiple tasks with same action type
   - Examples: Like different posts, comment on different videos

3. **Skipped tasks**:
   - Task ID added to `skippedComplexTasks`
   - Hidden from main view, shown in "Skipped Tasks" page
   - User can unskip to make it reappear

#### Server-Side Filtering
```php
// API filters tasks based on:
// 1. User's platform memberships (only show tasks for platforms they're on)
// 2. Non-repeatable tasks user hasn't completed
// 3. Tasks user hasn't skipped
// 4. Repeatable tasks (always shown unless skipped)

// Example logic:
$userPlatforms = $profile['memberPlatforms']; // ['x', 'youtube', 'odysee']
$completedTasks = $profile['completedComplexTasks'];
$skippedTasks = $profile['skippedComplexTasks'];

$availableTasks = array_filter($allTasks, function($task) use ($userPlatforms, $completedTasks, $skippedTasks) {
    // Must be for a platform user is member of
    if (!in_array($task['platform'], $userPlatforms)) return false;
    
    // Must not be skipped
    if (in_array($task['id'], $skippedTasks)) return false;
    
    // If non-repeatable, must not be completed
    if (!$task['repeatable'] && in_array($task['id'], $completedTasks)) return false;
    
    return true;
});
```

### Skip Management System
- **Skip button**: Always visible in compact view
- **Skipped Tasks page**: Shows all skipped items with unskip option (organized by tabs)
- **Persistence**: Skipped tasks stored in user profile
- **Cleanup**: Daily cron removes references to deleted tasks

### Technical Implementation

#### Files to Create/Modify
1. **complex-tasks.html** - Main complex tasks page
2. **skipped-tasks.html** - Skip management page
3. **my-platforms.html** - Platform membership manager page
4. **js/complex-tasks.js** - Complex tasks logic
5. **js/skipped-tasks.js** - Skip management logic
6. **js/my-platforms.js** - Platform membership manager logic
7. **api/get-complex-tasks.php** - Fetch complex tasks (with platform filtering)
8. **api/update-user-tasks.php** - Update user task status
9. **api/update-user-platforms.php** - Update user platform memberships
10. **api/get-user-platforms.php** - Fetch user's platform memberships
11. **admin/complex-tasks.html** - Admin interface
12. **css/style.css** - Additional styles for expandable tasks and platform manager

#### API Endpoints
- `GET /api/get-complex-tasks.php` - Return available complex tasks (filtered by user's platforms)
- `POST /api/update-user-tasks.php` - Update completed/skipped tasks
- `GET /api/get-skipped-tasks.php` - Return user's skipped tasks
- `GET /api/get-user-platforms.php` - Return user's platform memberships
- `POST /api/update-user-platforms.php` - Update platform memberships, award coins for rewarded platforms

#### Admin Interface
- **Form fields**:
  - Title (short task name)
  - Short description (for compact view)
  - Detailed instructions (markdown supported)
  - URL (target page)
  - Reward (points)
  - Duration (seconds)
  - **Category** (dropdown: Follows & Subscriptions | Engagements | Sign-ups)
  - **Platform** (dropdown: X, YouTube, Facebook, Odysee, Publish0x, etc.)
  - **Requires Login** (checkbox)
  - **Repeatable** (checkbox - if checked, task can appear multiple times with different content)
  - Icon (optional)
- **Task preview**: Shows how task appears in compact and expanded views
- **Enable/disable tasks**: Toggle visibility without deletion
- **Delete tasks**: With cleanup consideration for user profiles
- **Bulk actions**: Enable/disable multiple tasks by category or platform

### Mobile Design Considerations
- **Tap targets**: Minimum 44px for buttons
- **Expandable content**: Full viewport width on small screens
- **Touch gestures**: Single tap to expand/collapse
- **Button placement**: Skip and Visit buttons easily accessible

### Initial Setup Experience

**First-time user flow**:
1. User clicks "Simple Tasks" in navigation (member-only)
2. If `memberPlatforms` is empty, show **platform setup modal/page**:
   - "Welcome! Let's personalize your task experience"
   - Two sections: Common Platforms (free) and Rewarded Platforms (25 coins each)
   - User checks platforms they're already members of
   - Instant feedback: "You earned 50 coins for joining Odysee and Publish0x!"
3. After setup, redirect to complex tasks page with filtered tasks
4. Link to "My Platforms" always visible in settings for updates

**Empty state handling**:
- If user has no platforms checked: "Select platforms in My Platforms to see available tasks"
- If user has platforms but no tasks available: "No tasks available right now. Check back later!"

### Development Sequence
1. **Platform membership manager** (foundation)
   - my-platforms.html page
   - Platform selection UI (common vs rewarded)
   - API endpoints for platform management
   - One-time reward system
   - Initial setup prompt/modal

2. **Complex tasks page** (main functionality)
   - HTML structure with tabs
   - Expandable UI
   - Timer + manual complete
   - Member-only access
   - Platform-filtered task display

3. **Skipped tasks page** (skip management)
   - Display skipped tasks (organized by tabs)
   - Unskip functionality

4. **Admin interface** (content management)
   - Task creation form with category/platform fields
   - Task management
   - Platform dropdown management

5. **Profile integration** (member-only features)
   - User profile updates
   - Task persistence
   - Platform membership tracking

6. **Cron job** (cleanup)
   - Remove orphaned task references
   - Daily maintenance

### Platform Membership Reward System

**Reward Logic**:
```php
// When user checks a platform:
if (isPlatformRewarded($platform) && !in_array($platform, $user['rewardedPlatforms'])) {
    // Award 25 coins
    $user['balance'] += 25;
    
    // Mark as rewarded (prevent duplicate rewards)
    $user['rewardedPlatforms'][] = $platform;
    
    // Add to member platforms
    $user['memberPlatforms'][] = $platform;
    
    return ['success' => true, 'reward' => 25, 'message' => "You earned 25 coins for joining $platform!"];
}
```

**Anti-abuse measures**:
- Track rewarded platforms separately from member platforms
- User can uncheck/recheck common platforms freely (no reward)
- User can only claim reward once per rewarded platform
- Server-side validation ensures reward only given once

**UI Feedback**:
- Common platforms: Simple checkbox, no special feedback
- Rewarded platforms: Checkbox + coin icon, shows "+25" animation on first check
- Already rewarded: Shows checkmark + "Rewarded" badge, can still uncheck

### Security Considerations
- Member authentication required
- Server-side validation of task completion
- Server-side validation of platform rewards (prevent duplicate claims)
- Rate limiting on task updates and platform updates
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
