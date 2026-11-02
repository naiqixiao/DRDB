<claude-mem-context>
# Memory Context

# [DRDB] recent context, 2026-10-11 5:08am EDT

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 50 obs (17,004t read) | 600,202t work | 97% savings

### Oct 8, 2026
482 9:12a 🔵 MySQL Family Deletion by Email/Phone Lookup
483 " 🔵 DRDB Family Delete Controller Has Cascade Logic
484 9:13a 🔵 DRDB Family Delete is Simple Single-Row Destroy, Not Multi-Step
485 10:53a 🔵 GitHub Release Pinning for Version Downloads
S115 Docker + Tailscale deployment architecture for lab computers — feasibility and guidance (Oct 8 at 10:54 AM)
486 11:05a ⚖️ Docker + Tailscale Architecture for Lab Computer Deployment
S116 Add a public parking coordination dashboard to the DRDB login page showing upcoming in-person study visits across all labs (Oct 8 at 11:05 AM)
487 12:48p 🟣 Upcoming Studies Dashboard on Login Page for Parking Coordination
488 " 🔵 Login.vue Current Structure: Two-Column Layout with Right Panel
489 12:49p 🔵 Existing UpcomingAppointments.vue Requires Auth; New Public Endpoint Needed
490 " 🔵 Existing schedule.upcoming Controller Structure and Data Model for New Public Endpoint
491 12:50p 🔵 timezoneService Works Without Auth; Client schedule.js Always Uses Authenticated api()
492 " 🟣 parkingBoard Controller Added to schedule.js
493 " 🔵 moment-timezone Available Server-Side; No New Dependencies Needed
494 12:51p 🔴 Fixed moment-timezone Import and getGeneralTimezone Hoisting in schedule.js
495 " 🔴 Cleaned Up Stale Inline require and Fixed moment.tz() Call in parkingBoard
496 " 🟣 Public /api/schedule/parkingBoard Route Registered Without checkAuth
497 " 🟣 Unit Tests Created for parkingBoard Controller
498 " 🔴 Fixed Test Extraction of Sequelize Op.between Value
499 " 🟣 All 69 Server Tests Passing After parkingBoard Addition
500 12:52p 🟣 parkingBoard() Client Service Method Added to schedule.js
501 " 🟣 parkingBoard() Method Added to Client Schedule Service
502 " 🟣 ParkingBoard.vue Component Created
503 " 🟣 ParkingBoard Integrated into Login.vue Right Panel
504 " 🟣 Login.vue Script Registration of ParkingBoard Complete
505 12:53p 🔵 api() Sends Bearer Token Only When store.token Exists; Build Passes Clean
S117 Parking coordination dashboard on DRDB login page — visual browser verification of completed feature (Oct 8 at 12:53 PM)
506 12:55p 🟣 Mock Backend Server Created for Live ParkingBoard Preview
507 12:56p 🟣 ParkingBoard Rendered Successfully in Browser Against Mock Backend
S118 ParkingBoard UI/UX improvements: fixed height scrollable panel, lab filter chips, excluded labs via .env, and per-lab card colors (Oct 8 at 12:57 PM)
508 1:02p 🟣 Dashboard UI Enhancements: Lab Filtering, Visit Panel Scroll, and Lab Card Colors
509 " 🟣 Parking Board API Now Exposes `labId` per Appointment
510 " 🟣 Parking Board API: Env-Configured Lab Exclusion List and Lab Metadata in Response
511 1:03p 🟣 Parking Board Tests Updated and All 71 Tests Passing
512 " ✅ `PARKING_EXCLUDED_LABS` Documented in Both `.env.example` Files
513 " ✅ `PARKING_EXCLUDED_LABS` Wired into Docker Compose Backend Environment
514 " 🟣 ParkingBoard.vue Overhauled: Fixed-Height Scroll, Lab Filter, Per-Lab Colors, Now Marker
515 1:04p 🟣 Mock Server Updated and ParkingBoard UI Verified in Browser with Multi-Lab Data
516 " 🔵 ParkingBoard Component Bug: `labs` Array Not Populating Despite Correct API Response
517 1:06p 🔵 Mock Server Patched with Cache-Control: no-store Header
S119 Add v3.1.1 release notes to client/public/CHANGELOG.md covering the new login-page parking board feature (Oct 8 at 1:06 PM)
518 1:10p ✅ CHANGELOG.md Updated with Version 3.1.1 Entry
519 " 🔵 DRDB CHANGELOG.md Structure and v3.1.0 Feature Set Confirmed
S120 Add v3.1.1 CHANGELOG entry and bump version strings across the DRDB codebase (Oct 8 at 1:10 PM)
520 1:11p ✅ DRDB Version Bumped from 3.1.0 to 3.1.1 Across All Version Files
S121 How to configure PARKING_EXCLUDED_LABS env var with multiple lab names (Oct 8 at 1:11 PM)
S122 Validating PARKING_EXCLUDED_LABS comma-separated format and debugging lab name exclusion logic in DRDB parking system (Oct 8 at 1:11 PM)
521 1:21p 🔵 PARKING_EXCLUDED_LABS Comma-Separated Format Inquiry
522 1:22p 🔵 PARKING_EXCLUDED_LABS Comma-Separated Format Works, But Duplicate Lab Bug Found
S123 Auto-update the "Now · 1:27 PM" time display in DRDB ParkingBoard to refresh in real time (Oct 8 at 1:22 PM)
523 1:28p 🟣 Auto-Updating Current Time Display Requested
524 " 🔵 DRDB Now-Marker Time Display Is Static (Stale by ~1 Minute)
525 " 🟣 ParkingBoard Now-Marker: Minute-Aligned Clock + Silent Background Refresh
526 1:29p 🔄 ParkingBoard: REFRESH_MS Constant + Watcher-Safe selectedLabs Reassignment
527 " 🔵 ParkingBoard Live Clock and Silent Refresh Verified Working in Browser
528 1:30p 🔵 DRDB App.vue Layout Structure and Route Inventory
529 1:31p 🔵 DRDB App.vue Shell Architecture: Login-Route Fixed Layout and Per-Route Color Theming
530 " 🟣 Global Parking Board FAB Added to App Shell in DRDB
531 " 🔵 Parking Board FAB and Dialog Verified: All Close Methods and Login Route Hiding Work Correctly
S124 Auto-updating "Now" clock and global ParkingBoard FAB in DRDB — CHANGELOG updated with new feature bullets (Oct 8 at 1:33 PM)
**Investigated**: The CHANGELOG.md at client/public/CHANGELOG.md was examined to identify where to add documentation for the two new features implemented in this session.

**Learned**: The 3.1.1 changelog entry already documented the ParkingBoard login-page feature but was missing entries for the auto-updating clock and the global FAB. The CHANGELOG uses a bullet-list format under named subsections within each release.

**Completed**: 1. Auto-updating "Now" clock in ParkingBoard.vue — minute-boundary-aligned setInterval with visibilitychange catch-up for background tabs.
    2. 5-minute silent background data refresh in ParkingBoard.vue — preserves selected day, lab filter, and scroll position across refresh cycles.
    3. Global floating action button (FAB) in App.vue — round blue car icon fixed to bottom-right corner on all authenticated pages; opens ParkingBoard in a dialog; hidden on the login route.
    4. Dialog verified: closes via Escape key, X button, and outside-click; remounts fresh on each open via v-if.
    5. Production build verified clean (✓ built in 2.23s).
    6. CHANGELOG.md updated with two new bullets under the v3.1.1 "Upcoming In-Person Visits" section:
       - "Stays up to date" — describes the moving Now line and 5-minute refresh with preserved state.
       - "Available from every page" — describes the car FAB and its three close methods.

**Next Steps**: No pending tasks. All requested work (auto-updating clock, global ParkingBoard FAB, and changelog documentation) is complete. The session is awaiting any new user requests.


Access 600k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>