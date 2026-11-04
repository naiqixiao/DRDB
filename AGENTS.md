<claude-mem-context>
# Memory Context

# [DRDB] recent context, 2026-11-04 6:12pm EST

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 50 obs (17,871t read) | 758,973t work | 98% savings

### Oct 8, 2026
519 1:10p 🔵 DRDB CHANGELOG.md Structure and v3.1.0 Feature Set Confirmed
520 1:11p ✅ DRDB Version Bumped from 3.1.0 to 3.1.1 Across All Version Files
521 1:21p 🔵 PARKING_EXCLUDED_LABS Comma-Separated Format Inquiry
522 1:22p 🔵 PARKING_EXCLUDED_LABS Comma-Separated Format Works, But Duplicate Lab Bug Found
523 1:28p 🟣 Auto-Updating Current Time Display Requested
524 " 🔵 DRDB Now-Marker Time Display Is Static (Stale by ~1 Minute)
525 " 🟣 ParkingBoard Now-Marker: Minute-Aligned Clock + Silent Background Refresh
526 1:29p 🔄 ParkingBoard: REFRESH_MS Constant + Watcher-Safe selectedLabs Reassignment
527 " 🔵 ParkingBoard Live Clock and Silent Refresh Verified Working in Browser
528 1:30p 🔵 DRDB App.vue Layout Structure and Route Inventory
529 1:31p 🔵 DRDB App.vue Shell Architecture: Login-Route Fixed Layout and Per-Route Color Theming
530 " 🟣 Global Parking Board FAB Added to App Shell in DRDB
531 " 🔵 Parking Board FAB and Dialog Verified: All Close Methods and Login Route Hiding Work Correctly
S140 Fix Google Sign-In Code page not showing in Settings.vue when setting up lab or system admin email accounts (Oct 8 at 1:33 PM)
### Nov 2, 2026
565 7:29p 🔵 Google Sign-In Code Page Not Displaying in Settings Email Setup
566 " 🔵 Settings.vue Missing postMessage Listener for Google OAuth Code Auto-Fill
567 " 🔵 Root Cause: credentials.json Uses `installed` Type with Wrong redirect_uri
568 7:30p 🔴 Fixed Google OAuth Redirect URI Resolution for `installed`-Type Credentials
569 " 🔴 Client-Side Fixes: Origin Forwarding, URL Code Extraction, and UX Guidance
S141 Google OAuth auto-fill not working on localhost — verifying it will work on production drdb.mcmaster.ca (Nov 2 at 7:31 PM)
570 7:39p 🔵 Auto-fill Credential Issue Specific to localhost Testing Environment
571 " 🔵 DRDB Nginx Configuration for Production Deployment
S142 Overarching examination of major email template system update in DRDB — checking for missing pieces or flaws after extensive changes enabling per-lab themed email customization (Nov 2 at 7:39 PM)
572 7:43p 🟣 Email Template System Major Overhaul with Theme Customization
573 7:44p 🟣 Per-Lab Email Branding System with Theme Customization
574 " 🟣 Email Layout Renderer and Themed HTML Pipeline
575 " 🟣 Reminder Preview and Test Send Infrastructure
576 " 🔄 Google OAuth Redirect URI Resolution Centralized
577 " ✅ Lab Timezone Column Schema Migration Added to Startup
578 " ✅ Comprehensive Test Suite Added for Email Branding System
579 7:45p 🔵 Full Test Suite Passes: 16 Suites, 127 Tests in 1.16s
580 " 🔴 Email MIME Encoding Completely Rewritten for RFC Compliance and Inline Images
581 " 🔴 Reminder Email Tables: Hardcoded "EST" Timezone and Olive/Tomato Colors Fixed
582 " 🔵 Potential Gap: reminderService Lab Query Missing Location/ZoomLink/TransportationInstructions
583 " 🟣 Client-Side Email Preview with Inline Appointment Card
584 " 🟣 Study Communications Tab Now Uses Themed EmailLayoutPreview Component
585 " 🔴 Google OAuth Sign-In Code Now Accepts Full Redirect URL
S143 Fix two medium issues found during email template system examination: EmailTest.vue CSS leakage via v-html, and malformed From/To headers for lab names with special characters (Nov 2 at 7:46 PM)
586 7:49p 🔴 EmailTest.vue v-html Causes App-Wide Style Leakage — Fix In Progress
587 " 🔴 EmailTest.vue v-html Replaced with Sandboxed iframe
588 " 🔴 From Header Display Name Encoding Fix Being Applied to encodeMessage()
589 " 🔴 RFC 2822 From/To Display Name Encoding Fixed in encodeMessage()
S144 Investigation of tentative-family "eligible study" emails — confirmed no date regression, found pre-existing stray closing tag in Introduction opening (Nov 2 at 7:50 PM)
590 7:51p 🔵 ScheduleUpdate Email Opening Promises Appointment Details That May Not Be Present
S145 Fixed pre-existing stray closing tag in Introduction email opening; confirmed client build passes; all session changes remain uncommitted (Nov 2 at 7:51 PM)
591 7:52p 🔴 Fixed Stray Closing Tag in Introduction Email Opening
S146 Version bump to 3.2.0 and CHANGELOG restructuring for the email template system overhaul release (Nov 2 at 7:52 PM)
592 7:54p ✅ Version Bump to 3.2.0 Initiated
593 " ✅ Version String Locations Identified for 3.1.2 → 3.2.0 Bump
594 " ✅ DRDB Bumped to Version 3.2.0 — All Files Updated
S147 User chose "Not yet" — all v3.2.0 changes remain uncommitted in working tree, awaiting user's commit decision (Nov 2 at 7:55 PM)
S148 User asked about the app favicon — where it's set, how to change it, and why it looks squashed in browser tabs (Nov 2 at 7:55 PM)
595 7:57p 🔵 Favicon System: Dynamic Override via Branding Settings, Static Fallback to logo.png
596 7:58p 🔵 Logo File Recently Updated Intentionally — Same File Serves as Both App Logo and Favicon
### Nov 3, 2026
630 12:05p ✅ Email Layout Width Adjustment Requested
631 " ✅ Email Width Widening Plan Initiated
632 " 🔵 Email Layout Width Logic Found in emailLayout.js
633 " ✅ Email Layout Widened: 800→900px wide, 600→720px standard, breakpoint 640→760px
634 " ✅ Email Width Changes Complete — Pending Commit and Backend Restart
S155 Widen email layouts in DRDB — increase max-width for all email variants (Nov 3 at 12:05 PM)
**Investigated**: Searched server/api/utils/emailLayout.js and related test files for width values. Found a `wide` boolean parameter controlling two width variants (800px wide, 600px standard) applied as inline max-width on the email table element. Also found a responsive mobile breakpoint at 640px and a test asserting 'max-width:800px'.

**Learned**: The shared email layout in DRDB uses a single function with a `wide` flag: `const width = wide ? 800 : 600`. Width is applied as `max-width:${width}px` inline on the outer presentation table. Staff schedule reminders use the wide variant (800px); parent messages and account notifications use the standard variant (600px). The responsive breakpoint controls when the compact phone layout activates.

**Completed**: - server/api/utils/emailLayout.js line 28: wide email max-width increased 800px → 900px, standard 600px → 720px
    - server/api/utils/emailLayout.js line 47: responsive mobile breakpoint updated 640px → 760px (to avoid squeezed desktop padding at intermediate widths)
    - server/__tests__/emailLayout.test.js line 20: test assertion updated 'max-width:800px' → 'max-width:900px'
    - Sample email rendered to HTML and opened in preview pane for visual verification
    - All 128 tests pass after changes

**Next Steps**: Changes are complete but not yet committed to git. Backend server needs a restart for new widths to take effect. User can verify visually via Settings → Lab Email Appearance or Reminder Email Tests after restart.


Access 759k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>