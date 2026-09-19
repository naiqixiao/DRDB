AI-assisted Email Personalization
================================

Purpose
-------

DRDB includes an optional AI assistant for creating short, human-reviewed
personalization suggestions in the existing email composer. The assistant does
not send email automatically and does not replace the existing study templates,
appointment details, transportation instructions, or Gmail delivery flow.

The first version is available for these email types:

* Introduction
* Follow-up
* ThankYou

Confirmation, ScheduleUpdate, and Reminder emails remain deterministic because
they contain important scheduling and logistics information.

Provider configuration
----------------------

The preferred provider is a lab-hosted OpenAI-compatible endpoint. The
implementation also supports Groq and a local Ollama endpoint.

For the lab-hosted model, first obtain the model identifier from ``/v1/models``
while connected to the lab network or VPN. Then configure the server:

::

   AI_EMAIL_ENABLED=true
   AI_EMAIL_PROVIDER=local
   AI_EMAIL_ALLOW_REAL_DATA=false
   AI_EMAIL_TIMEOUT_MS=15000
   LOCAL_LLM_BASE_URL=http://130.113.218.247:8080/v1
   LOCAL_LLM_MODEL=replace-with-model-id-from-v1-models
   LOCAL_LLM_JSON_MODE=false

``LOCAL_LLM_API_KEY`` is optional and should be set only when the endpoint
requires bearer authentication. Enable ``LOCAL_LLM_JSON_MODE`` only after
confirming that the server accepts ``response_format`` with ``json_object``.

Groq is suitable for testing with training-set or de-identified data:

::

   AI_EMAIL_ENABLED=true
   AI_EMAIL_PROVIDER=groq
   AI_EMAIL_ALLOW_REAL_DATA=false
   AI_EMAIL_TIMEOUT_MS=15000
   GROQ_API_KEY=replace-with-your-key
   GROQ_MODEL=openai/gpt-oss-20b

The API key must be configured in server/.env and must never be placed in
the Vue client or committed to Git.

For local inference with Ollama:

::

   AI_EMAIL_ENABLED=true
   AI_EMAIL_PROVIDER=ollama
   AI_EMAIL_ALLOW_REAL_DATA=true
   OLLAMA_URL=http://127.0.0.1:11434/api/chat
   OLLAMA_MODEL=gemma3

The AI_EMAIL_ALLOW_REAL_DATA setting is false by default. When false,
the endpoint accepts only families marked as training-set records. Enable it
for real participant data only after the lab has approved the selected
provider and its data-processing terms. Ollama is the preferred option when
participant context must remain on the DRDB machine.

The lab endpoint currently uses plain HTTP. Deployments sending participant
context should reach it only over a trusted private network or VPN, or place it
behind HTTPS with access control. OpenAI API compatibility does not itself
provide encryption or authentication.

User workflow
-------------

1. Open an Introduction, Follow-up, or ThankYou email in the existing composer.
2. Select Suggest personalization.
3. Review the proposed paragraph and optional subject.
4. Select Insert paragraph, Use subject, or Dismiss.
5. Edit the email as needed and send it through the existing Gmail workflow.

The original email body remains unchanged if the provider is disabled,
unconfigured, rate-limited, unreachable, times out, or returns invalid JSON.

API
---

Endpoint
~~~~~~~~

POST /api/ai/email-personalization

The endpoint requires the normal DRDB bearer token. It accepts only database
identifiers; the client cannot provide its own participant history.

Request:

::

   {
     "familyId": 123,
     "appointmentIds": [456],
     "emailType": "Follow-up"
   }

Successful response:

::

   {
     "personalizationText": "We would be delighted to welcome your family back.",
     "subjectSuggestion": "An invitation from our research team",
     "tone": "returning",
     "evidence": {
       "recentSimilarStudy": true,
       "repeatParticipant": true
     },
     "provider": "groq",
     "model": "openai/gpt-oss-20b"
   }

Supported error codes include AI_DISABLED, AI_NOT_CONFIGURED,
AI_TRAINING_DATA_ONLY, AI_SCOPE_ERROR, AI_RATE_LIMITED, AI_TIMEOUT, and
AI_INVALID_RESPONSE.

Context and personalization rules
----------------------------------

The backend builds context from the selected family, schedules, appointments,
studies, and structured conversation timestamps.

* A prior participation is successful only when its schedule is Confirmed and
  Completed.
* A prior study is considered recent when its appointment was within 180 days.
* Similarity requires the same StudyType, at least two shared meaningful terms,
  and a normalized overlap score of at least 0.18 across study name and
  description.
* The current email appointment and its entire schedule are excluded from prior
  participation counts.
* Tone is new for zero completed sessions, returning for one or more completed
  sessions, and engaged for at least three completed sessions without a recent
  no-show.
* Contact history is represented by conversation count and days since the most
  recent contact. Conversation text is not sent to the cloud provider.
* Study descriptions are HTML-stripped, length-capped, and delimiter-escaped
  before being included in the provider prompt.

Prompts use a stable system message for privacy, safety, and output rules, plus
task-specific user instructions for Introduction, Follow-up, and ThankYou
emails. Runtime context is placed in delimited fields so that instructions and
data remain distinct.

The model is instructed to return plain text JSON only. It must not invent
facts, make medical or developmental inferences, mention internal notes, use
pressure or guilt, include exact dates, or include names and contact details.
The client escapes generated text before inserting it into the HTML editor.

Security and privacy
--------------------

* AI requests are authenticated and checked against the family and current lab
  scope.
* Provider credentials are server-side environment variables.
* AI output is never sent automatically.
* Prompts and generated suggestions are not persisted in a new DRDB table.
* Cloud testing should use training-set or de-identified records.
* Do not enable real-data processing until the lab approves the provider,
  retention, transfer, and consent requirements.

Testing and verification
------------------------

Run the isolated AI service tests:

::

   cd server
   npm test -- --runInBand aiEmailService.test.js

Run the full server test suite:

::

   cd server
   npm test -- --runInBand

Build the client:

::

   cd client
   npm run build

The tests cover meaningful-term extraction, recent same-type study matching,
new/returning/engaged tone selection, no-show handling, and exclusion of the
current appointment from historical participation.

Implementation locations
------------------------

* server/api/services/aiEmailService.js contains provider calls, context
  construction, similarity scoring, tone derivation, prompt rules, and output
  validation.
* server/api/controllers/ai.js and server/api/routes/ai.js expose the
  authenticated backend endpoint.
* client/src/services/ai.js is the frontend API wrapper.
* client/src/components/emailComponent.vue contains the opt-in controls,
  preview, acceptance, dismissal, and safe HTML insertion.
* server/__tests__/aiEmailService.test.js contains the isolated unit tests.
