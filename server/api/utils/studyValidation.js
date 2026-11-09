// Server-side validation for study create/update. Returns a list of
// { field, step, message } so the client can show every problem at once.
// Keep in sync with client/src/assets/JS/studyValidation.js.

const STUDY_NAME_MAX_LENGTH = 45;
const STUDY_TYPE_MAX_LENGTH = 30;

const isBlank = (v) => v === null || v === undefined || v === "";

// lenient: skip the Min < Max check so status toggles on legacy data still save.
function validateStudyPayload(study = {}, { AgeGroups = [], lenient = false } = {}) {
  const problems = [];
  const add = (field, step, message) => problems.push({ field, step, message });

  const name = typeof study.StudyName === "string" ? study.StudyName.trim() : "";
  if (!name) add("StudyName", 1, "Study Name is required.");
  else if (name.length > STUDY_NAME_MAX_LENGTH)
    add("StudyName", 1, `Study Name is ${name.length} characters; the limit is ${STUDY_NAME_MAX_LENGTH}.`);

  if (typeof study.StudyType === "string" && study.StudyType.length > STUDY_TYPE_MAX_LENGTH)
    add("StudyType", 1, `Study Type must be at most ${STUDY_TYPE_MAX_LENGTH} characters.`);
  if (isBlank(study.FK_Lab)) add("FK_Lab", 1, "No lab is selected for this study.");
  if (isBlank(study.FK_Personnel)) add("FK_Personnel", 3, "Point of Contact is required.");

  if (AgeGroups != null && !Array.isArray(AgeGroups)) {
    add("AgeGroups", 2, "Age groups are malformed.");
  } else {
    (AgeGroups || []).forEach((g, i) => {
      const min = g?.MinAge;
      const max = g?.MaxAge;
      if (isBlank(min) || isBlank(max) || !Number.isFinite(Number(min)) || !Number.isFinite(Number(max)))
        add("AgeGroups", 2, `Age Group ${i + 1}: enter both Min and Max age (months), or remove the group.`);
      else if (Number(min) < 0 || Number(max) < 0)
        add("AgeGroups", 2, `Age Group ${i + 1}: ages must be 0 or higher.`);
      else if (!lenient && Number(min) >= Number(max))
        add("AgeGroups", 2, `Age Group ${i + 1}: Min age (${min}) must be less than Max age (${max}).`);
    });
  }
  return problems;
}

// Maps database errors to a status and message a user can act on.
function describeDbError(error) {
  const name = error?.name || "";
  if (name === "SequelizeUniqueConstraintError")
    return { status: 409, message: "A study with these details already exists." };
  if (name === "SequelizeForeignKeyConstraintError")
    return { status: 400, message: "A selected lab, person or study no longer exists. Refresh the page and try again." };
  if (name === "SequelizeValidationError")
    return {
      status: 400,
      message: (error.errors || []).map((e) => e.message).join("; ") || "Invalid study data.",
    };
  if (/data too long/i.test(error?.message || ""))
    return { status: 400, message: "One of the fields is too long. Shorten the Study Name and try again." };
  return { status: 500, message: "Could not save the study because of a server error. Please try again or contact an admin." };
}

module.exports = { validateStudyPayload, describeDbError, STUDY_NAME_MAX_LENGTH };
