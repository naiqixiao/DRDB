# DRDB API guide for OpenClaw workflows

This document describes the API surface in this repository that an OpenClaw
agent can use to manage **studies** and **personnel**. It is based on the
Express routes and controllers in `server/api/routes/` and
`server/api/controllers/`. The interactive Swagger UI, when the server is
running, is available at `GET /api-docs`; it is useful for exploration, but
its schemas are incomplete, so treat this document and the live responses as
the working contract.

## Connection and authentication

Use the public DRDB URL as the base URL. In the supplied Docker deployment,
the browser-facing default is `http://localhost:8080` and Nginx proxies
`/api/*` to the Node backend. Do **not** use the backend container's port from
outside Docker.

1. Authenticate with `POST /api/user/login`:

   ```json
   { "Email": "agent-account@example.edu", "Password": "…" }
   ```

2. Read `token`, `userID`, `lab`, and `role` from the successful response.
3. Send the token on every protected request:

   ```http
   Authorization: Bearer <token>
   Content-Type: application/json
   ```

JWTs expire after **2 hours**. Call `POST /api/user/checklogin` before a
long-running workflow and re-authenticate on `401 Authentication Failed.`
Never put the password or JWT in prompts, logs, task history, or source
control; keep them in OpenClaw's secret store.

Example:

```bash
curl -sS -X POST "$DRDB_URL/api/user/login" \
  -H 'Content-Type: application/json' \
  --data '{"Email":"agent-account@example.edu","Password":"…"}'

curl -sS "$DRDB_URL/api/study?FK_Lab=3" \
  -H "Authorization: Bearer $DRDB_TOKEN"
```

## Study API

All endpoints in this section require the bearer token.

| Purpose | Method and path | Inputs | Result |
|---|---|---|---|
| List/search studies | `GET /api/study` | Any study-column filter; commonly `id`, `FK_Lab`, `Completed`. Set `includeScheules=true` (spelling is intentional) to include appointments. | Array of studies |
| Study recruitment/activity metrics | `GET /api/study/studyStats?studyID={id}` | Positive study ID | Counts by schedule status, recruiter, primary/assistant experimenter, and week |
| Create study | `POST /api/study/add` | Study payload below | Created study with related records |
| Replace/update study | `POST /api/study` | Same payload plus `id` | Updated study |
| Delete study | `DELETE /api/study?id={id}` | ID; optional audit `User` object | Deletion count |

Study reads return related `Lab`, `PointofContact`, `Experimenters`,
`AgeGroups`, `Prerequisites`, and `Exclusions`. The response also contains the
stored study fields, including scripts and email templates; limit retrieval
and downstream disclosure accordingly.

### Create or update a study

`StudyName`, `FK_Lab`, and `FK_Personnel` are required by the controller.
For updates, `id` is required. The service supplies defaults for
`Completed`, `Description`, `PhoneScript`, `EmailTemplate`,
`ReminderTemplate`, `FollowUPEmailSnippet`, `StudyType`, and all five
participant-criteria fields, but sending explicit values is safer.

```json
{
  "StudyName": "Infant Language Study",
  "FK_Lab": 3,
  "FK_Personnel": 12,
  "FK_TestingRoom": 4,
  "StudyType": "Behavioural",
  "Completed": false,
  "Description": "Short internal description",
  "PhoneScript": "",
  "EmailTemplate": "",
  "ReminderTemplate": "",
  "FollowUPEmailSnippet": "",
  "ASDParticipant": "Include",
  "PrematureParticipant": "Include",
  "VisionLossParticipant": "Include",
  "HearingLossParticipant": "Include",
  "IllParticipant": "Include",
  "AgeGroups": [{ "MinAge": 6, "MaxAge": 12 }],
  "PrerequisiteIds": [8],
  "ExclusionIds": [9],
  "User": { "Name": "OpenClaw", "Email": "agent-account@example.edu", "LabName": "Example Lab" }
}
```

Criteria values must be `Include`, `Exclude`, or `Only`. `AgeGroups`,
`PrerequisiteIds`, and `ExclusionIds` are optional arrays. On update, when an
array is supplied it replaces the existing set; send an empty array to clear
it. Include the `User` audit object for create/update/delete, even though the
JWT identifies the caller.

### Recruitment-progress inquiry

Use the statistics endpoint to report the progress of one study:

```http
GET /api/study/studyStats?studyID={studyId}
Authorization: Bearer <token>
```

The response is an object with these arrays:

| Response field | Use in an agent summary |
|---|---|
| `totalNperStatus` | Participant counts grouped by schedule status—the primary current recruitment view. |
| `totalNperPersonnelStatus` | Counts grouped by the recruiting personnel member and schedule status. |
| `totalNperPersonnelPriExp` | Confirmed appointments grouped by primary experimenter. |
| `totalNperPersonnelAssistExp` | Confirmed appointments grouped by assistant experimenter. |
| `totalNWeeklyRecrtuiment` | Weekly recruitment counts (the property spelling is intentional). |

Suggested workflow: list the lab's studies with
`GET /api/study?FK_Lab={labId}`, resolve the requested study to its numeric
ID, request `studyStats`, then summarize current status counts, recruiter
workload, and week-over-week direction. The endpoint requires a positive ID
and rejects cross-lab requests with `403`.

DRDB currently records recruitment/activity counts, but the Study model does
not contain a recruitment target (target N). An agent may therefore state
"confirmed so far" or "scheduled so far," but must not invent a completion
percentage. To report `x / target N` or percent complete, obtain the target
from an approved external source and label it clearly in the result.

## Schedule API

A **schedule** is the time/status record for one family. It can contain one
or more appointments (for individual child–study pairings). Schedule reads
return the family, the scheduler, and nested appointments with child, study,
and assigned primary/secondary experimenter details. These results include
participant and personnel contact data, so use the smallest query and avoid
putting raw responses in agent logs.

All endpoints below require a bearer token. Query `lab={labId}` on every
read: it filters through each appointment's study lab. The API does not
enforce this lab filter server-side for all endpoints.

| Purpose | Method and path | Useful inputs | Result |
|---|---|---|---|
| Search schedules | `GET /api/schedule` | `id`, `FK_Family`/`FamilyId`, `Status`, `StudyId`, `lab`, `AppointmentTimeAfter`, `AppointmentTimeBefore`, `limit`, `offset` | `{ schedules, pagination }` |
| Today | `GET /api/schedule/today` | `lab`, `trainingMode`, `limit`, `offset` | `{ schedules, pagination }` |
| Tomorrow/next working day | `GET /api/schedule/tomorrow` | Same as today | `{ schedules, pagination }` |
| This week | `GET /api/schedule/week` | Same as today | `{ schedules, pagination }` |
| Follow-ups due | `GET /api/schedule/followups` | `lab`, `trainingMode`, `limit`, `offset` | `{ schedules, pagination }` |
| Upcoming confirmed sessions | `GET /api/schedule/upcoming` | `lab`, `trainingMode`, optional `limit` (defaults to 7) | Array of schedules |
| Create schedule | `POST /api/schedule/add` | Schedule payload below | Created schedule |
| Update schedule | `POST /api/schedule` | Full schedule/update payload; Google OAuth required | Updated schedule |
| Mark complete | `POST /api/schedule/complete` | `id`, `FK_Family`, and audit `User`; Google OAuth required | Updated schedule |
| Mark reminder sent | `POST /api/schedule/remind` | `id` and audit `User`; Google OAuth required | Updated schedule |
| Record thank-you email | `POST /api/schedule/tyEmail` | `id`, normally `ThankYouEmail`, and audit `User`; Google OAuth required | Updated schedule |
| Delete schedule | `DELETE /api/schedule?id={id}` | ID and audit `User`; Google OAuth required | Confirmation text |

`limit` defaults to 100 and is capped at 200 for the paginated endpoints.
The `pagination` value provides `limit`, `offset`, `total`, and `hasMore`.
`trainingMode=true` returns training families; its absence/other value returns
non-training families. Date filters should be ISO-8601 timestamps.

`/followups` is a ready-made queue: it selects non-training (unless requested
otherwise) families whose next contact date is today/past or unset, who have
not opted out, and whose schedule status is `TBD`, `Rescheduling`, or
`No Show`. `/upcoming` selects future, `Confirmed`, non-completed schedules.

For reliable agent summaries, paginate rather than assuming a complete list.
The general schedule-search service currently uses random ordering, so sort
the returned items by `AppointmentTime` in the agent before presenting them.

### Create or update a schedule

The practical create payload needs `FK_Family`, `ScheduledBy`, `Status`,
`AppointmentTime`, and an `Appointments` array. A schedule may use these
statuses: `Confirmed`, `TBD`, `Rescheduling`, `Rescheduled`, `No Show`,
`Cancelled`, `Rejected`, `Interested`, or `Left a message`.

```json
{
  "FK_Family": 42,
  "ScheduledBy": 12,
  "AppointmentTime": "2026-08-10T10:00:00-04:00",
  "Status": "Confirmed",
  "Note": "Internal logistics note",
  "Appointments": [
    {
      "FK_Study": 7,
      "FK_Child": 105,
      "FK_Family": 42,
      "Experimenters": [12],
      "Experimenters_2nd": [18]
    }
  ],
  "lab": 3,
  "User": { "Name": "OpenClaw", "Email": "agent-account@example.edu", "LabName": "Example Lab" }
}
```

For an update, add the schedule `id` and include the complete intended
`Appointments` list. Existing appointments need their `id`; new ones omit it.
Include `Experimenters` and `Experimenters_2nd` arrays for each appointment
(empty arrays are valid). The update code replaces experimenter assignments
and applies status side effects: `Confirmed`, `Rescheduling`, and `TBD` keep
the family assigned to the lab, while `Cancelled`, `Rejected`, and `No Show`
mark the schedule completed and release the family assignment. Editing a
completed, confirmed schedule may return `403`, depending on lab settings.

Creating, updating, completing, reminding, recording thanks, or deleting can
change recruitment state and/or calendar/email-related records. OpenClaw
should draft the payload, display the schedule/time, family ID, study IDs,
status change, and any side effect, then wait for explicit human approval.
Do not use the undocumented `POST /api/schedule/special`; it is a
lab-specific bulk maintenance operation.

## Appointment API

An **appointment** links one schedule to one study, child, and family. Use it
when the workflow asks about a particular study's sessions or the personnel
assigned to them; use the schedule API for date/status queues.

| Purpose | Method and path | Inputs | Result |
|---|---|---|---|
| Search appointments | `GET /api/appointment` | `id`, `StudyId`, `FamilyId`, `ChildId`, `Email`, `NamePrimary`, `NameSecondary`, `Phone`, `ChildName`, `StudyName` | Array of appointments with related family, child, study, and experimenters |
| Add appointments to an existing schedule | `POST /api/appointment/add` | Wrapper payload below; Google OAuth required | Populated schedule |
| Replace appointment experimenter assignments | `POST /api/appointment` | Assignment payload; Google OAuth required | Updated schedule |
| Update an appointment's experimenters | `POST /api/appointment/exp` | `appointmentId`, primary/secondary experimenters, and optional calendar metadata; Google OAuth required | Confirmation text |
| Delete appointment | `DELETE /api/appointment?id={id}` | ID; Google OAuth required | Confirmation text |

Appointment search supports prefix matching for the family/contact and study
name fields. It returns potentially sensitive participant and personnel data;
when OpenClaw only needs recruitment counts, use `studyStats` instead.

The add endpoint expects a wrapper with an `appointment` **array**, even for a
single appointment. Each item must include `FK_Schedule`, `FK_Study`,
`FK_Family`, `FK_Child`, `Experimenters`, and `Experimenters_2nd`.

```json
{
  "appointment": [
    {
      "FK_Schedule": 55,
      "FK_Study": 7,
      "FK_Family": 42,
      "FK_Child": 105,
      "Experimenters": [12],
      "Experimenters_2nd": []
    }
  ],
  "lab": 3,
  "User": { "Name": "OpenClaw", "Email": "agent-account@example.edu", "LabName": "Example Lab" }
}
```

Appointment writes update assignment rows and may update Google Calendar
event attendees/descriptions. They are confirmation-only agent actions.
Before adding or deleting, fetch the schedule and appointment(s), show the
affected IDs and experimenters, and obtain human approval. The current
appointment-delete controller references undefined variables while attempting
to log the action, so it may return `500` after it has already deleted the
appointment. Do not expose that endpoint to OpenClaw until it is repaired and
tested. Do not use the unauthenticated `/api/appointment/monthYearN*`
statistics endpoints in OpenClaw workflows: they are global/lab-specific
legacy reporting endpoints, not lab-scoped agent interfaces.

## Personnel API

All endpoints in this section require the bearer token.

| Purpose | Method and path | Inputs | Result |
|---|---|---|---|
| List/search active personnel | `GET /api/personnel` | `id`, `Email`, `Name`, `Initial`, `Phone`, `Active`, `FK_Lab`, or `study` | Array of non-retired personnel |
| Personnel activity metrics | `GET /api/personnel/stats?id={id}` | Positive personnel ID | `{ "e1Count", "e2Count", "scheduledCount" }` |
| Create personnel record | `POST /api/personnel/add` | Personnel database payload | Created record |
| Update personnel | `POST /api/personnel` | Payload including `id` | Updated record |
| Retire personnel | `DELETE /api/personnel?id={id}` | ID; optional audit `User` | Update result; account disabled rather than removed |

Personnel search always excludes `Retired=true` records and includes `Lab`,
`AssignedStudies`, and `StudyinCharge`. Search strings use prefix matching
for `Email`, `Name`, `Initial`, and `Phone` (for example,
`?Name=Alex`). `study` filters by an assigned study ID.

For an operational agent, prefer the application-level account creation API
instead of `POST /api/personnel/add`:

```http
POST /api/user/signup
Authorization: Bearer <token>
```

This endpoint additionally requires Google OAuth and validates `Name`,
`Email`, `Initial`, `Role`, and `Calendar`; it generates a temporary password
and sends the welcome email. Valid roles are `Admin`, `PostDoc`, `PI`,
`GradStudent`, `Undergrad`, `RA`, `Lab manager`, and `Staff`.

Personnel update fields include `Name`, `Initial`, `Role`, `FK_Lab`,
`Active`, `Email`, `Calendar`, `Phone`, and `ZoomLink`. Do not send `Password`
or `temporaryPassword` through an agent workflow. Deleting personnel is a
soft retirement: DRDB resets their password, marks them retired/inactive, and
removes their study-assignment rows. Require explicit human approval.

## Safe OpenClaw workflow design

Use a dedicated service account assigned only to the intended lab. Start with
these read-only workflows:

- "Show active studies in my lab": `GET /api/study?FK_Lab={labId}`.
- "Who is assigned to study X?": `GET /api/personnel?study={studyId}`.
- "Show personnel workload": list personnel, then call
  `/api/personnel/stats?id={id}` for each selected person.
- "Recruitment summary for study X": `GET /api/study/studyStats?studyID={id}`;
  report status counts and the weekly trend, without a percentage unless a
  verified target N is available.

For every write, have the agent first fetch the target record, present a
field-level diff, and wait for explicit confirmation. It should not execute
deletes, retirements, password changes/resets, emails, calendar changes, or
new-account creation autonomously. Use stable numeric IDs instead of names,
restrict queries to the agent's expected `FK_Lab`, and record the human
approver plus the returned object ID.

## Important security limitation

The current middleware verifies that a request has a valid JWT, but most
study and personnel routes do **not** enforce role-based permissions or
tenant/lab ownership server-side. `GET /api/study/studyStats` does verify the
requester's lab, but the general study/personnel search and mutation routes
do not consistently do so. Therefore the agent's prompt or client-side
filters are not a security boundary.

Before connecting an autonomous agent to production participant or personnel
data, add server-side authorization that checks both role and `FK_Lab` on
every route, use a restricted service account, and place the API behind TLS.
Treat study scripts/templates and all personnel contact details as sensitive
research data; minimize access, outputs, retention, and logging in line with
your institution's ethics/IRB and privacy requirements.

## Errors and integration notes

- `401` normally means a missing, malformed, expired, or invalid JWT.
- `400` is returned for missing study fields or invalid statistics IDs.
- `403` is currently used by study statistics for a cross-lab request.
- `404` is returned for a missing study in the statistics endpoint.
- Other route failures may return `500` with an error message.
- The API uses `POST` rather than `PUT`/`PATCH` for normal updates.
- There is no pagination on these two list endpoints; avoid broad queries on
  large production datasets.
