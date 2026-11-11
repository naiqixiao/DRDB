# Family re-engagement implementation plan

## Goal

Let staff find and reconsider a child for a specific study after an earlier invitation, while preserving the family's contact preferences and the history of earlier recruitment. Make the distinction between an explicit decline and an automatically closed, unanswered invitation as clear as the available data permits, without requiring staff to update statuses routinely.

## Current behavior

- Recruitment search in `server/api/controllers/child.js` excludes children with any appointment for the selected study, regardless of the appointment's outcome. It also applies family contact restrictions and study eligibility criteria.
- `server/api/controllers/autoCancellation.js` has two processes that overwrite statuses with `Rejected`: auto cancellation closes stale `TBD` and `Rescheduling` schedules and releases family lab assignments; auto completion closes stale `TBD`, `Rescheduling`, `No Show`, and `Cancelled` schedules. Thus, historical `Rejected` does not necessarily mean the family declined.
- `TBD` usually means no response from the family. It is a useful signal, but not absolute proof that an invitation was sent or that a response was never received.
- Eligibility is evaluated in more than one place, including the recruitment search and `client/src/assets/JS/studyEligibility.js`; the implementation must account for every recruitment entry point.

## Intended experience

### Study recruitment: Schedule page

Add **Revisit families** beside the existing study recruitment controls in `client/src/views/Schedule.vue`. For the selected study, provide a paginated, searchable list of previously excluded children, with filters for no response recorded, declined, other prior outcomes, and unknown outcome. Show the child and family, last known invitation or schedule date, outcome, automatic closure information, next-contact date, and all current exclusion reasons. Do not label historical `Rejected` records as explicit declines without evidence.

An authorized staff member can review an individual child–study pair and select **Allow re-engagement**. Show the specific restrictions to be excepted, require a reason, and allow an expiry. Explain that this does not send a message. Once authorized, the family can be found and recruited through the ordinary workflow; retain a visible exception indicator during recruitment.

### Family and appointment pages

In `client/src/views/Family.vue`, display relevant earlier outcomes, automatic closures, and exception history. Provide an entry point to the same review dialog for a selected study. In `client/src/views/Appointment.vue`, display any applicable exception and its reason when the relevant recruitment or appointment is viewed. Reuse a shared review component rather than maintaining separate decision logic.

### Exceptions and boundaries

- Scope each exception to one child, one study, and explicitly selected exclusion reason(s); it must not alter study criteria globally or automatically permit other children or studies.
- An exception for prior recruitment must not silently override age or other eligibility criteria. Show all remaining blockers.
- Keep `NoMoreContact`, online-only preferences, and other explicit contact restrictions outside this exception mechanism. Respect next-contact dates unless a separately designed, authorized workflow changes them.
- Whether staff may grant an age exception remains an **open policy decision**. Until resolved, show out-of-range children for review but do not permit age override. Any eventual implementation must support the study's approved protocol.
- Preserve original appointments, outcomes, communications, and exception history. An exception authorizes an attempt; it does not assert consent, send an invitation, or indicate enrollment.

## Automatic closure and outcomes

1. Update both auto-cancellation and stale auto-completion paths to mark selected schedules completed **without overwriting their existing status**. Continue the existing family-release behavior where applicable. Ensure repeated runs do not repeatedly process completed schedules or release families unexpectedly; preserve each path's intended lab settings and opt-out behavior.
2. Record structured closure metadata per schedule: closure reason (`automatic inactivity`), timestamp, and originating process. Record this atomically with closure, using a migration compatible with the project's deployment process. Preserve the existing status and any relevant timestamps; do not rely solely on aggregate log messages.
3. Derive **No response recorded** for an automatically closed `TBD` schedule, reflecting the established usual meaning of `TBD`. This is an operational classification, not proof of delivery or a definitive statement about every family response. Preserve `Rescheduling`, `No Show`, and `Cancelled` as distinct outcomes and do not classify them automatically as no response.
4. Treat a reliably recorded manual `Rejected` as a decline; distinguish source if supported by evidence. Earlier `Rejected` schedules may have been set by automation and should be **Unknown / historical rejection** when the source cannot be established. Do not infer a decline or no response merely from the status. Assess per-record audit data before any backfill; leave uncertain records unchanged.
5. Automatically use existing contact and schedule data where available. Do not introduce a required manual outcome-update step. Display missing or uncertain dates and contact details honestly; do not invent an invitation date from a schedule timestamp.

## Server and data changes

1. Inventory recruitment creation, search, appointment editing, family contact restrictions, permissions, analytics, and all consumers of `Status` and `Completed`. Identify where preserving a completed `TBD` or other status changes dashboards, reminders, queries, and workflows. Adapt those consumers to use completion and closure metadata appropriately.
2. Build a server-side eligibility evaluation that returns structured reasons and their overrideability, based on authoritative study, child, family, appointment, and exception data. Reuse it in the review search and validate again when recruitment is initiated; do not trust client-supplied eligibility or exception flags. Align the existing client explanation with the server's result.
3. Add a bounded review search that can find previously contacted or age-ineligible children without weakening normal search. Apply lab access checks and privacy controls, stable pagination, appropriate filters, and full reason reporting. Do not expose families outside the requester's authorization.
4. Store exceptions as auditable records with child ID, study ID, specific reasons covered, authorizing user, creation time, required rationale, optional expiry, and revocation/use details. Enforce access and valid scope server-side. Define how repeated authorizations and simultaneous requests behave; use transactions or constraints to prevent duplicate active exceptions and handle races.
5. Allow the normal recruitment path to recognize an active, applicable exception for a prior study appointment while independently enforcing all other restrictions. Recheck at the action that creates the recruitment or appointment, including expiration, revocation, family preferences, current eligibility, and concurrent changes. Preserve the previous appointment and link the new attempt and exception where practical.
6. Provide authorized endpoints to review, create, list, and revoke exceptions; do not permit a client to clear historical records to work around eligibility. Do not trigger email or other outreach when an exception is created.

## Validation

- Exercise both automatic processes for each affected status, custom lab thresholds, opt-outs, completed schedules, repeated runs, and family release. Verify that status and per-record closure details survive and that explicit rejections are not overwritten.
- Verify historical ambiguous `Rejected` records stay unknown; automatically closed `TBD` appears as no response recorded; other statuses remain distinct.
- Test review search and recruitment for a prior invitation with and without an active exception, multiple exclusion reasons, expiry and revocation, age outside the study range, and contact restrictions. Confirm one child or study exception does not affect another.
- Test authorization and cross-lab access, direct API attempts, and concurrent or duplicate exception requests. Verify the server rechecks eligibility at recruitment time.
- Check reports, reminders, family history, appointment displays, and existing dashboards for completed schedules retaining their statuses. Verify no messages are sent by creating an exception.
- Run the relevant server tests and client build, then manually verify the study and family workflows with representative records.

## Suggested delivery sequence

1. Audit status consumers and settle closure metadata and migration; implement and test the two automatic processes.
2. Implement server-side reasons, review search, exception records, authorization, and recruitment enforcement.
3. Add Schedule review and shared exception dialog, then Family history and entry point and Appointment indication.
4. Validate end to end, document operational behavior, and assess whether any historical records can be safely classified from evidence.

Age overrides remain deferred pending an explicit policy decision. Exact roles permitted to authorize and revoke exceptions, default expiry, and any follow-up interval should be agreed before enabling the workflow.
