AI Family Participation Summary
================================

Purpose
-------

DRDB includes an optional AI assistant that summarizes a family's
participation history and produces an advisory intention-to-participate
assessment, so staff have context before reaching out about a study. The
assessment is a qualitative judgment made from scheduling history, not a
trained predictive model, and it is never used automatically to schedule,
release, or otherwise act on a family. Staff review it and decide.

Phase 1 scope (this version) uses only structured data already in DRDB:

* Schedule/Appointment/Study history for every child in the family
  (completed sessions, no-shows, cancellations, study types).
* Conversations records (contact count and recency only; conversation text
  is not sent to any provider).

Reading actual Gmail message content is explicitly out of scope for this
version. DRDB's Gmail integration is currently send-only; adding message
reading would require a new OAuth scope, thread-matching by family address,
and a separate privacy/consent review before any content is sent to an AI
provider, local or cloud. It may be added as a later phase.

Provider configuration
-----------------------

This feature shares its provider configuration with AI email personalization
(see AI_Email_Personalization). The default and recommended provider is the
lab's OpenAI-compatible NInfer server, since a family summary aggregates more
history than a single email draft:

::

   AI_FAMILY_SUMMARY_ENABLED=true
   AI_PROVIDER=local
   AI_FAMILY_SUMMARY_ALLOW_REAL_DATA=true
   LOCAL_LLM_BASE_URL=http://<host>:8080/v1
   LOCAL_LLM_MODEL=Qwen3.8-27B
   LOCAL_LLM_ENABLE_THINKING=false

Set AI_FAMILY_SUMMARY_PROVIDER instead of AI_PROVIDER to use a different
provider for this feature only. Ollama and Groq are supported the same way
as for email personalization; Groq should be limited to training-set or
de-identified families.

AI_FAMILY_SUMMARY_ALLOW_REAL_DATA is false by default. When false, the
endpoint accepts only families marked as training-set records. Enable it for
real participant data only after the lab has approved the selected provider
and its data-processing terms — independently from the
AI_EMAIL_ALLOW_REAL_DATA decision, since the two features can be approved on
different timelines.

User workflow
-------------

1. Open a family's details (currently available from the Appointment view's
   family details dialog).
2. Select Generate summary. This opens a separate popup dialog and
   immediately requests a summary (a loading state is shown while it
   generates).
3. Review the participation summary, the intention-to-participate chip, and
   the supporting stats in the popup.
4. Select Regenerate to request a fresh summary without closing the popup, or
   Close to dismiss it.

Nothing is written back to the family record and nothing is persisted in a
new DRDB table; the summary is regenerated each time it is requested (on
first opening the popup, and again on Regenerate) so it always reflects
current data.

API
---

Endpoint
~~~~~~~~

POST /api/ai/family-summary

The endpoint requires the normal DRDB bearer token. It accepts only a
database identifier; the client cannot provide its own participation data.

Request:

::

   {
     "familyId": 123
   }

Successful response:

::

   {
     "participationSummary": "This family has completed two prior sessions and shows a pattern of steady contact.",
     "intentionAssessment": "Likely",
     "intentionRationale": "Two completed sessions with no recent no-shows or cancellations.",
     "tone": "returning",
     "stats": {
       "completedSessionCount": 2,
       "recentNoShowCount": 0,
       "recentCancellationCount": 0,
       "contactAttemptCount": 4,
       "daysSinceLastContact": 12,
       "childCount": 1,
       "distinctStudyCount": 2,
       "studyTypes": ["Behavioural"]
     },
     "provider": "local",
     "model": "Qwen3.8-27B"
   }

A family with no schedule or conversation history on record returns a fixed
"Uncertain" result without calling any AI provider, since there is nothing
to summarize.

Supported error codes include AI_DISABLED, AI_NOT_CONFIGURED,
AI_TRAINING_DATA_ONLY, AI_SCOPE_ERROR, AI_RATE_LIMITED, AI_TIMEOUT, and
AI_INVALID_RESPONSE.

Context and personalization rules
----------------------------------

* The backend aggregates every schedule/appointment for the family (across
  all children/siblings), not just a single child or study.
* intentionAssessment is restricted to exactly Likely, Uncertain, or
  Unlikely; any other model output is replaced with Uncertain rather than
  trusted.
* The model is instructed to prefer Uncertain over a confident guess when
  the family's history is sparse.
* The model must not make medical, developmental, or personal-character
  judgments, must not invent facts beyond the supplied counts, and must not
  include names, contact details, or exact calendar dates.
* This assessment is explicitly framed to the model, and should be treated
  by staff, as advisory only — a conversation starter, not a determination
  about whether to keep pursuing a family.

Security and privacy
---------------------

* AI requests are authenticated and checked against the family and current
  lab scope.
* Provider credentials/URLs are server-side environment variables.
* AI output is never persisted and never triggers an automatic action.
* Cloud (Groq) testing should use training-set or de-identified records; the
  local/Ollama providers are preferred for real participant data.

Testing and verification
-------------------------

Run the isolated AI family summary tests:

::

   cd server
   npm test -- --runInBand aiFamilySummaryService.test.js

Run the full server test suite:

::

   cd server
   npm test -- --runInBand

The tests cover study-type aggregation, most-recently-completed-study
selection, and distinct child/study counting from a family's history.

Implementation locations
-------------------------

* server/api/services/aiFamilySummaryService.js contains the family-level
  aggregation, prompt rules, and the no-history short-circuit.
* server/api/services/aiProvider.js and
  server/api/services/participationProfile.js are shared with AI email
  personalization (see AI_Email_Personalization).
* server/api/controllers/ai.js and server/api/routes/ai.js expose the
  authenticated backend endpoint.
* client/src/services/ai.js is the frontend API wrapper.
* client/src/components/FamilyDetailsDialog.vue contains the Generate
  summary control and the popup dialog that displays the result
  (auto-generated on open, with a Regenerate action).
* server/__tests__/aiFamilySummaryService.test.js contains the isolated unit
  tests.

Future phases
-------------

* Reading Gmail message content as an additional signal, gated behind its
  own OAuth scope and lab approval, kept separate from the structured-data
  signals used today.
* Surfacing the summary from the main Family view, not only from the
  Appointment view's family details dialog.
