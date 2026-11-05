# Study introduction email subjects

- Add a nullable, 255-character plain-text subject to each study, with an idempotent startup schema patch. Existing blank subjects use the current system subject.
- Allow editing and previewing the subject in study communications and the study form. Reject line breaks and overlong values on the server.
- For introduction emails, initialize the subject from the first included study with a custom subject. Offer each distinct included study's custom subject and the system default in the composer; choosing one replaces the editable subject. Other email types are unchanged.
- Include the field in study data used by email composition. Verify migration, validation, single- and multi-study choices, blank fallback, and client build.
