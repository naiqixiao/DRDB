AI-assisted Email Personalization
================================

Purpose
-------

DRDB includes two optional, human-reviewed AI assistants in the existing
email composer. Neither sends email automatically, and neither replaces the
existing study templates, appointment details, transportation instructions,
or Gmail delivery flow. Every suggestion is opt-in: staff choose whether and
how to use it, and nothing is applied to the draft without an explicit click.

* **Suggest personalization** — generates a short additional paragraph (and
  optional subject) from the family's participation history. Available for
  Introduction, Follow-up, and ThankYou emails only; Confirmation,
  ScheduleUpdate, and Reminder emails remain fully deterministic because they
  contain important scheduling and logistics information.
* **Polish with AI** — rewrites the wording of whatever is currently in the
  subject/body fields (including staff edits), while preserving every fact,
  link, and placeholder. Available for any email type, since it only rewords
  what is already there rather than adding new claims.

Both show a preview card the user must explicitly accept before it changes
the draft; dismissing or ignoring the preview leaves the original draft
untouched.

Provider configuration
-----------------------

AI email personalization shares its provider configuration with every AI
feature in DRDB (see AI_Family_Participation_Summary). The default and
recommended provider is a lab-hosted OpenAI-compatible endpoint (the
LOCAL_LLM_* variables below default to the lab's NInfer server, so it works
out of the box on the lab network). Ollama and the Groq cloud provider remain
available as alternatives, mainly for testing.

To point the local provider at a different OpenAI-compatible endpoint, first
obtain the model identifier from ``/v1/models`` while connected to that
network or VPN, then configure the server:

::

   AI_EMAIL_ENABLED=true
   AI_PROVIDER=local
   AI_EMAIL_ALLOW_REAL_DATA=true
   LOCAL_LLM_BASE_URL=http://<host>:8080/v1
   LOCAL_LLM_MODEL=replace-with-model-id-from-v1-models
   LOCAL_LLM_JSON_MODE=false
   LOCAL_LLM_ENABLE_THINKING=false

``LOCAL_LLM_API_KEY`` is optional and should be set only when the endpoint
requires bearer authentication. Enable ``LOCAL_LLM_JSON_MODE`` only after
confirming that the server accepts ``response_format`` with ``json_object``.
``LOCAL_LLM_ENABLE_THINKING`` is false by default; this feature only needs a
short, direct JSON reply, not a Qwen3-style model's chain-of-thought/reasoning
output (enable it only if a different local model requires it).

For local inference with Ollama instead:

::

   AI_EMAIL_ENABLED=true
   AI_PROVIDER=ollama
   AI_EMAIL_ALLOW_REAL_DATA=true
   OLLAMA_URL=http://127.0.0.1:11434/api/chat
   OLLAMA_MODEL=gemma3

Groq is suitable for testing with training-set or de-identified data only:

::

   AI_EMAIL_ENABLED=true
   AI_PROVIDER=groq
   AI_EMAIL_ALLOW_REAL_DATA=false
   GROQ_API_KEY=replace-with-your-key
   GROQ_MODEL=openai/gpt-oss-20b

The Groq API key must be configured in server/.env and must never be placed
in the Vue client or committed to Git.

Set AI_EMAIL_PROVIDER instead of AI_PROVIDER to use a different provider for
this feature only, without changing the provider used by other AI features.

The AI_EMAIL_ALLOW_REAL_DATA setting is false by default. When false,
the endpoint accepts only families marked as training-set records. Enable it
for real participant data only after the lab has approved the selected
provider and its data-processing terms.

The lab endpoint currently uses plain HTTP. Deployments sending participant
context should reach it only over a trusted private network or VPN, or place it
behind HTTPS with access control. OpenAI API compatibility does not itself
provide encryption or authentication.

User workflow
-------------

Suggest personalization:

1. Open an Introduction, Follow-up, or ThankYou email in the existing composer.
2. Select Suggest personalization.
3. Review the proposed paragraph and optional subject.
4. Select Insert paragraph, Use subject, or Dismiss.
5. Edit the email as needed and send it through the existing Gmail workflow.

Polish with AI:

1. Draft or edit the email body/subject as usual, in any email type.
2. Select Polish with AI.
3. Review the polished preview (rendered, not raw HTML) alongside a
   suggested subject if one was returned.
4. Select Replace draft to overwrite the current subject/body, or Discard to
   keep the original untouched.
5. Edit the email as needed and send it through the existing Gmail workflow.

The original email body remains unchanged if the provider is disabled,
unconfigured, rate-limited, unreachable, times out, or returns invalid JSON,
and in every case the user must explicitly accept the suggestion before it
touches the draft.

API
---

Suggest personalization endpoint
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

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

Polish with AI endpoint
~~~~~~~~~~~~~~~~~~~~~~~~

POST /api/ai/email-polish

Unlike the personalization endpoint, this one sends the actual current
subject and HTML body — whatever the user has typed or left from the
template, which may include the family's name, child's name, appointment
details, and links — to the configured AI provider. It is gated by the same
family/appointment/lab scope checks and AI_EMAIL_ALLOW_REAL_DATA flag as
personalization, but because it forwards real drafted content rather than
aggregate statistics, the local/Ollama providers are strongly preferred for
it; reserve Groq for training-set/de-identified testing.

Request:

::

   {
     "familyId": 123,
     "appointmentIds": [456],
     "emailType": "Introduction",
     "subject": "An eligible study for Alex",
     "body": "<p>Dear Alex's caregiver,</p><p>We would love to have...</p>"
   }

Successful response:

::

   {
     "polishedSubject": "An eligible study for Alex",
     "polishedBody": "<p>Dear Alex's caregiver,</p><p>We would be delighted to have...</p>",
     "provider": "local",
     "model": "Qwen3.8-27B"
   }

polishedBody is restricted to a small allow-list of tags (p, br, strong, b,
em, i, u, ul, ol, li, a) and every link href must be left unchanged by the
model. The client re-sanitizes the returned HTML with DOMPurify (using the
same allow-list) before rendering the preview or writing it into the rich
text editor — the server-side prompt constraint is not treated as a
sufficient safeguard on its own.

Supported error codes include AI_DISABLED, AI_NOT_CONFIGURED,
AI_TRAINING_DATA_ONLY, AI_SCOPE_ERROR, AI_EMPTY_DRAFT, AI_RATE_LIMITED,
AI_TIMEOUT, and AI_INVALID_RESPONSE.

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

Polishing works differently: it is explicitly given the current subject and
body (so it necessarily sees whatever real content is already in them) and is
instructed to change wording only — never add, remove, or alter a fact, name,
date, time, link URL, phone number, or template placeholder, and never add a
greeting/signature or new information beyond what's already there. This is an
instruction to the model, not a guarantee; that is why the preview-before-
replace step exists, so staff can catch anything altered incorrectly before
it reaches the draft.

Security and privacy
--------------------

* AI requests are authenticated and checked against the family and current lab
  scope.
* Provider credentials are server-side environment variables.
* AI output is never sent automatically; both features require an explicit
  user action (Insert/Use subject, or Replace draft) before touching the
  email draft, and sending the email is still a separate, manual step.
* Prompts and generated suggestions are not persisted in a new DRDB table.
* Suggest personalization only ever sends aggregate participation statistics
  to the provider, never conversation text or the drafted email itself.
  Polish with AI sends the actual current draft, which may contain the
  family's and child's names and appointment details — treat it as real
  participant data for provider-choice purposes even when personalization
  alone would be safe to test on Groq.
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

The aiEmailService tests cover meaningful-term extraction, recent same-type
study matching, new/returning/engaged tone selection, no-show handling, and
exclusion of the current appointment from historical participation. The
aiProvider tests cover strict-JSON parsing, enum fallback for out-of-set
values, and that preserveHtml fields (used by polishedBody) keep their markup
instead of being stripped like every other field.

Implementation locations
------------------------

* server/api/services/aiProvider.js contains the shared provider client
  (local/OpenAI-compatible — defaulting to the lab's NInfer server — plus
  Ollama and Groq), timeout handling, and strict-JSON output validation used
  by every AI feature.
* server/api/services/participationProfile.js contains the shared scheduling
  history aggregation (tone, completed/no-show/cancelled counts, similar-study
  matching) used by every AI feature.
* server/api/services/aiEmailService.js contains the email-specific context
  construction and prompt rules for this feature.
* server/api/controllers/ai.js and server/api/routes/ai.js expose the
  authenticated backend endpoint.
* client/src/services/ai.js is the frontend API wrapper.
* client/src/components/emailComponent.vue contains the opt-in controls,
  preview, acceptance, dismissal, and safe HTML insertion for both features.
  It sanitizes the polished HTML preview with the dompurify package before
  rendering it or writing it into the rich text editor.
* server/__tests__/aiEmailService.test.js and
  server/__tests__/aiProvider.test.js contain the isolated unit tests.
