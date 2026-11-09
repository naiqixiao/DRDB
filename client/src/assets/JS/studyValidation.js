// Pure validation for the study create/edit wizard. Each problem names the
// wizard step it lives on so the UI can list it and jump to it. Keep the rules
// in sync with server/api/utils/studyValidation.js (the server re-checks them).

export const STUDY_NAME_MAX_LENGTH = 45;
const OPERATORS = ["ANY", "ALL", "NONE"];

export const STUDY_STEPS = {
  1: "Core Identity",
  2: "Eligibility Rules",
  3: "Team Logistics",
  4: "Communications",
};

const isBlank = (v) => v === null || v === undefined || v === "";

export function validateStudyDraft(study = {}, pointOfContact = null) {
  const errors = [];
  const add = (step, message) => errors.push({ step, message });

  const name = typeof study.StudyName === "string" ? study.StudyName.trim() : "";
  if (!name) add(1, "Study Name is required.");
  else if (name.length > STUDY_NAME_MAX_LENGTH)
    add(1, `Study Name is ${name.length} characters; the limit is ${STUDY_NAME_MAX_LENGTH}.`);

  if (isBlank(study.StudyType)) add(1, "Study Type is required.");
  if (isBlank(study.FK_Lab))
    add(1, "No lab is selected for your account. Log out and back in, or contact an admin.");

  (study.AgeGroups || []).forEach((group, i) => {
    const label = `Age Group ${i + 1}`;
    const min = group?.MinAge;
    const max = group?.MaxAge;
    if (isBlank(min) || isBlank(max) || !Number.isFinite(Number(min)) || !Number.isFinite(Number(max))) {
      add(2, `${label}: enter both Min and Max age (months), or remove the group.`);
    } else if (Number(min) < 0 || Number(max) < 0) {
      add(2, `${label}: ages must be 0 or higher.`);
    } else if (Number(min) >= Number(max)) {
      add(2, `${label}: Min age (${min}) must be less than Max age (${max}).`);
    }
  });

  const rules = study.ParticipationRules;
  if (rules != null) {
    if (!Array.isArray(rules)) add(2, "Participation Requirements are malformed.");
    else {
      if (rules.length > 50) add(2, "Participation Requirements allow at most 50 groups.");
      rules.forEach((group, i) => {
        const label = `Participation group ${i + 1}`;
        if (!group || !OPERATORS.includes(group.operator))
          add(2, `${label}: choose ANY, ALL or NONE.`);
        if (!group || !Array.isArray(group.studyIds) || group.studyIds.length === 0)
          add(2, `${label}: select at least one study, or remove the group.`);
        else if (!group.studyIds.every((id) => Number.isInteger(id) && id > 0))
          add(2, `${label}: contains an invalid study.`);
      });
    }
  }

  if (!pointOfContact || isBlank(pointOfContact.id)) add(3, "Point of Contact is required.");

  const subject = study.IntroductionEmailSubject;
  if (
    !(subject == null || (typeof subject === "string" && subject.length <= 255 && !/[\r\n]/.test(subject)))
  )
    add(4, "Introduction email subject must be a single line of at most 255 characters.");

  return errors;
}

// Turns an axios error into a list of problems the wizard can show.
export function describeSaveError(error) {
  const res = error?.response;
  if (!res) {
    return [{ step: null, message: error?.code === "ECONNABORTED"
      ? "The server took too long to respond. Please try again."
      : "Could not reach the server. Check your connection and try again." }];
  }
  const details = Array.isArray(res.data?.details) ? res.data.details : [];
  if (details.length) {
    return details.map((d) => ({ step: d.step ?? null, message: d.message }));
  }
  return [{ step: null, message: res.data?.error || `Save failed (HTTP ${res.status}).` }];
}
