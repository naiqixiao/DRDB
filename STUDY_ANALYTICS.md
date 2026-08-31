# Study analytics researcher inclusion

## Purpose

The Study **Analysis** tab reports researcher workload and recruitment without losing former or zero-activity researchers. Personnel identity is based on the personnel ID; names are display labels and are not unique keys.

## Researcher roster

The analytics API builds a study roster from the union of:

- current `Experimenter` study assignments;
- `project_started` and `project_ended` personnel-history events;
- primary and secondary appointment assignments; and
- personnel who recruited a schedule containing an appointment for the study.

This roster is returned as `researchers` by the existing study-stats endpoint. Each item contains `PersonnelId`, `Name`, and `Retired`. Existing response fields remain available for backward compatibility.

Researchers in the roster are displayed even when their workload or recruitment count is zero. Retired personnel are labeled `(Retired)` but their historical activity remains part of the figures.

## Counting rules

- **Primary workload:** distinct confirmed study appointments in `ExperimenterAssignment`.
- **Assistant workload:** distinct confirmed study appointments in `SecondExperimenterAssignment`. A primary assignment is not required for the assistant record to count.
- **Recruitment:** distinct study appointments grouped by the schedule creator and current schedule status.
- Training-set families are excluded, matching the existing analytics behavior.

Counts and chart rows are joined by personnel ID. Two researchers with the same name therefore remain separate.

## Assignment and retirement history

Both assignment interfaces compare the prior and requested study assignments in a transaction. They create `project_started` and `project_ended` history events for additions and removals, including an empty requested assignment list.

Retiring personnel is also transactional. Before current `Experimenter` rows are removed, a `project_ended` event is recorded for every active study assignment. Repeating retirement does not create duplicate end events.

Appointment assignment rows are retained by retirement, preserving completed workload statistics.

## Transition from earlier versions

Existing API consumers can ignore the added IDs, retirement flag, and `researchers` field. The previous aggregate arrays are still returned.

During a rolling deployment, the upgraded charts fall back to name-based grouping if they receive an older stats response without personnel IDs. Once the backend is upgraded, ID-based grouping takes over automatically.

The client associates each analytics request with the selected study ID. A delayed response from a previously selected study is discarded, preventing stale researcher figures from replacing the current study's data.

The roster reconstructs most earlier activity from current assignments, appointment assignments, recruitment records, and previously imported project history. A person who was removed before personnel history existed and had no appointments or recruitment activity cannot be associated with a study automatically; that missing association requires a manager-entered history correction.

## Regression checks

- Retire a currently assigned researcher and confirm a `project_ended` event is created.
- Confirm the retired researcher remains in both researcher figures with `(Retired)`.
- Assign a researcher with no appointments and confirm a zero row appears.
- Remove all study experimenters and confirm the update succeeds and end events are created.
- Give two personnel the same display name and confirm they remain separate rows.
- Confirm an assistant assignment counts even when the appointment has no primary assignment row.
