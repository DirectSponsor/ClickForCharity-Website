# ClickForCharity.net - Site Overview

## Role in Ecosystem
**"Earn & Contribute"** - Platform for users to contribute through actions (not money)

## Primary Purpose
Enable users to support meaningful projects through completing tasks and viewing ads, earning coins that represent their share of platform revenue.

## Core User Journey
1. **User Action:** Complete tasks, view ads, engage with content
2. **Earning:** Accumulate coins representing contribution share
3. **Allocation:** Choose which recipient project receives earned coins
4. **Impact:** See contribution support real projects

## Key Features (Current & Planned)

### ✅ Currently Implemented
- **Task System:** PTC (Paid-to-Click) tasks and engagement activities
- **Banner Ad Rotation:** Desktop and mobile ad display system
- **Admin Interface:** Web-based banner ad management
- **User Authentication:** Shared login system across ecosystem

### 🚧 Planned Features
- **Project Integration:** Connect to DirectSponsor for recipient/project display
- **Simplified Coin Allocation:** Link to DirectSponsor chat for tipping recipients
- **Impact Tracking:** Show users how their contributions help projects
- **Network-Wide Ads:** Part of cross-site advertising system

## Technical Architecture

### Current File Structure
```
site/
├── data/
│   ├── ads-desktop.txt     # Desktop banner ads
│   ├── ads-mobile.txt      # Mobile banner ads
│   └── position1/          # Future: Individual slot files
├── js/
│   ├── banner-rotate.js   # Ad rotation engine
│   ├── auth.js            # Shared authentication
│   └── app.js             # Main application logic
├── api/
│   ├── get-banner-ads.php # Fetch ads for display
│   ├── save-banner-ad.php # Add new banner
│   └── delete-banner-ad.php # Remove banner
└── admin-banners.html     # Banner management interface
```

### Dependencies
- **DirectSponsor.net:** For recipient/project data (future)
- **Shared Auth:** Cross-site user authentication
- **Payment System:** Lightning invoice processing (future)

## Revenue Model
- **Primary:** Banner advertising revenue
- **Secondary:** Optional direct donations (future)

## What Belongs Here vs Other Sites

### ✅ Belongs on ClickForCharity
- Task completion and PTC system
- Banner ad rotation and management
- Coin earning from user actions
- User engagement tracking
- Ad revenue generation

### ❌ Move to DirectSponsor (Future)
- Recipient project information and progress tracking
- Social network features and communication
- Project management and updates
- Blog posts and content creation
- Nostr-based social features

### 🔄 Shared Across Sites
- Recipient profiles (synced across ecosystem)
- User authentication and identity
- Basic recipient information and status

### ❌ Move to RoflFaucet
- Gaming and faucet features
- Entertainment-based earning
- Direct donations to faucet fund

## Current Status
**Phase:** Functional beta with core systems working
**Priority:** Maintain current functionality while planning DirectSponsor integration

## Development Priorities

### Immediate (Keep Working)
- Maintain task system functionality
- Keep banner ads generating revenue
- Ensure user authentication works
- Provide stable platform for users

### Short Term (Integration Prep)
- Plan API integration with DirectSponsor
- Design simple "Allocate Coins" link to DirectSponsor chat
- Prepare for cross-site ad system

### Long Term (Full Integration)
- Connect to DirectSponsor for project data
- Implement coin allocation via DirectSponsor chat system
- Participate in network-wide advertising

## Success Metrics
- **Task Completion Rate:** How many tasks users complete
- **Ad Revenue Generated:** Income from banner advertising
- **User Engagement:** Time spent on site and return visits
- **Coin Allocation:** How many coins allocated to projects (future)

## Migration Notes
- Current systems should continue working during DirectSponsor development
- Plan to replace temporary project system with DirectSponsor API
- Maintain banner ad revenue during ecosystem integration
- User data and authentication should remain consistent

---

*This site focuses on action-based contribution - earning through engagement rather than direct payment.*
