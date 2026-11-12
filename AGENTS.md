<claude-mem-context>
# Memory Context

# [DRDB] recent context, 2026-11-12 7:39am EST

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 50 obs (18,871t read) | 761,859t work | 98% savings

### Oct 8, 2026
529 1:31p 🔵 DRDB App.vue Shell Architecture: Login-Route Fixed Layout and Per-Route Color Theming
530 " 🟣 Global Parking Board FAB Added to App Shell in DRDB
531 " 🔵 Parking Board FAB and Dialog Verified: All Close Methods and Login Route Hiding Work Correctly
### Nov 2, 2026
565 7:29p 🔵 Google Sign-In Code Page Not Displaying in Settings Email Setup
566 " 🔵 Settings.vue Missing postMessage Listener for Google OAuth Code Auto-Fill
567 " 🔵 Root Cause: credentials.json Uses `installed` Type with Wrong redirect_uri
568 7:30p 🔴 Fixed Google OAuth Redirect URI Resolution for `installed`-Type Credentials
569 " 🔴 Client-Side Fixes: Origin Forwarding, URL Code Extraction, and UX Guidance
570 7:39p 🔵 Auto-fill Credential Issue Specific to localhost Testing Environment
571 " 🔵 DRDB Nginx Configuration for Production Deployment
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
S155 Widen email layouts in DRDB — increase max-width for all email variants (Nov 2 at 7:57 PM)
596 7:58p 🔵 Logo File Recently Updated Intentionally — Same File Serves as Both App Logo and Favicon
### Nov 3, 2026
630 12:05p ✅ Email Layout Width Adjustment Requested
631 " ✅ Email Width Widening Plan Initiated
632 " 🔵 Email Layout Width Logic Found in emailLayout.js
633 " ✅ Email Layout Widened: 800→900px wide, 600→720px standard, breakpoint 640→760px
634 " ✅ Email Width Changes Complete — Pending Commit and Backend Restart
S166 Evaluate whether the implemented changes match the study-introduction-subject plan in docs/study-introduction-subject-plan.md (Nov 3 at 12:05 PM)
### Nov 5, 2026
650 7:55a 🟣 IntroductionEmailSubject Per-Study Custom Subject Line
651 7:56a 🔵 Build and Test Suite Green After IntroductionEmailSubject Feature
652 " ⚖️ Plan Evaluation: Changes Match Functional Scope, Test Gap Identified
S167 Add tests for study controller IntroductionEmailSubject validation in DRDB server (Nov 5 at 7:56 AM)
653 8:10a 🔵 DRDB Server Test Infrastructure and Study Controller Structure Explored
S168 Add tests for DRDB server — study controller validation and schema patch utilities (Nov 5 at 8:10 AM)
654 " 🔵 Study Schema Patch Utility and Lab Schema Patch Test Pattern Examined
655 8:11a 🔵 DRDB Schema Startup Chain and Study Schema Patch Test Gap Identified
656 " 🟣 studySchemaPatch Hardened with Concurrent-Safety and 4 New Tests Added
657 8:12a 🔵 DRDB Current Version is 3.2.1 Across All Package Files
658 " ✅ DRDB Version Bumped to 3.2.2 with Changelog Entry for Custom Study Email Subject
659 " 🟣 DRDB v3.2.2 Shipped to origin/master — Custom Study Introduction Email Subject Feature
S169 Add tests for DRDB server — session complete, v3.2.2 shipped to origin/master (Nov 5 at 8:13 AM)
**Investigated**: Examined the full DRDB server test infrastructure, study.js controller validation logic, studySchemaPatch.js utility, labSchemaPatch.js pattern, schemaReady promise chain in DRDB.js, server.js startup flow, MySQL migration SQL files, and version bump conventions from prior release commits.

**Learned**: The schemaReady chain runs four sequential patches before server.js listens. The original studySchemaPatch.js lacked concurrent-safety (errno 1060) and clear failure messaging — the labSchemaPatch.js pattern is the established standard. study.js validates IntroductionEmailSubject and ParticipationRules before entering any transaction. No existing test file covered study.js or studySchemaPatch.js meaningfully before this session. Version bumps in DRDB touch 7 files: both package.json/lock files, swaggerDef.js, Login.vue, and CHANGELOG.md.

**Completed**: Full feature for custom introduction email subject per study shipped as DRDB v3.2.2 (commit be848e9a → origin/master). Key deliverables: (1) studyIntroductionSubject.test.js — 20 tests covering create/update validation (5 rejection cases, 4 acceptance cases, 1 omit case per handler). (2) studySchemaPatch.js refactored — COLUMNS array loop, shared addStudyColumn helper with errno 1060 concurrent-safety and descriptive ALTER failure messages. (3) studySchemaPatch.test.js — 3 tests added to existing stub (all missing columns in one pass, concurrent add tolerated, failed ALTER names SQL file). (4) labSchemaPatch.test.js — parameterized fixture + startup-level test for IntroductionEmailSubject on older Study tables. (5) MySQL/migrate_study_introduction_subject.sql created as manual fallback ALTER. (6) Version bumped 3.2.1 → 3.2.2 across all 7 files. (7) CHANGELOG.md updated. Total server suite: 18 suites, 155 tests, all passing.

**Next Steps**: Session is complete. No active work in progress. Remaining known gaps: Dependabot reports 150 pre-existing vulnerabilities on master (6 critical, 71 high) — unaddressed. The email composer's subject-choice logic in a Vue component has no tests (would require extracting to a plain JS helper first). Changes not tested against a real older MariaDB without the IntroductionEmailSubject column.


Access 762k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>