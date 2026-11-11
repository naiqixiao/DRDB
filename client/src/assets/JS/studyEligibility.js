import { matchesParticipationRules } from "@/assets/JS/participationRules";

// Single source of truth for "can this child be offered this study?".
// Used by ChildInfo.vue (Schedule Study button) and appointmentDetails.vue
// (study pickers, including the "additional appointment" / 2nd-study picker),
// so the two can never drift apart again.

const DAYS_PER_MONTH = 30.5; // Same month length the server uses in child.js.

export function childAgeInDays(child, referenceDate = new Date()) {
  if (!child || !child.DoB) return null;
  return Math.floor((referenceDate - new Date(child.DoB)) / (1000 * 60 * 60 * 24));
}

// A child fits a study when their age falls inside AT LEAST ONE of its age groups.
// MinAge/MaxAge are months and arrive from the API as DECIMAL strings, so coerce.
export function fitsAnyAgeGroup(study, ageInDays) {
  const groups = study?.AgeGroups;
  if (!groups || groups.length === 0) return true; // legacy fallback: no age groups defined
  return groups.some((group) => {
    const min = Number(group.MinAge);
    const max = Number(group.MaxAge);
    if (!Number.isFinite(min) || !Number.isFinite(max)) return false;
    return ageInDays >= min * DAYS_PER_MONTH - 1 && ageInDays <= max * DAYS_PER_MONTH - 1;
  });
}

function matchesCriterion(setting, value) {
  switch (setting) {
    case "Only":
      return !!value;
    case "Exclude":
      return !value;
    case "Include":
      return true;
    default:
      return false;
  }
}

function describeGroups(study) {
  return (study.AgeGroups || [])
    .map((g) => `${Number(g.MinAge)}–${Number(g.MaxAge)} mo`)
    .join(", ");
}

// Returns the list of reasons the child cannot be offered the study (empty = eligible).
// `family` is optional. Children nested under Family.Children only carry a
// partial Family (AutismHistory, no OnlineStudyOnly), so callers that know the
// real family should pass it; either source flagging the family is enough.
export function explainIneligibility(study, child, family = null) {
  const reasons = [];
  if (!study || !child) return ["Missing study or child data"];

  const onlineOnly =
    Number(family?.OnlineStudyOnly) === 1 || Number(child.Family?.OnlineStudyOnly) === 1;
  if (onlineOnly && study.StudyType !== "Online") reasons.push("Family only accepts online studies");

  const ageInDays = childAgeInDays(child);
  if (ageInDays === null) {
    reasons.push("Child has no date of birth");
  } else if (!fitsAnyAgeGroup(study, ageInDays)) {
    reasons.push(
      `Age ${(ageInDays / DAYS_PER_MONTH).toFixed(1)} mo is outside every age group (${describeGroups(study)})`
    );
  }

  if (!matchesParticipationRules(study, child.Appointments || [])) reasons.push("Participation rules not met (prerequisites/exclusions)");

  const autismInFamily =
    Number(family?.AutismHistory) === 1 || Number(child.Family?.AutismHistory) === 1;
  let asd;
  switch (study.ASDParticipant) {
    case "Only":
      asd = Number(child.ASD) === 1;
      break;
    case "Exclude":
      asd = !(Number(child.ASD) === 1 || autismInFamily);
      break;
    case "Include":
      asd = true;
      break;
    default:
      asd = false;
  }
  if (!asd) reasons.push(`ASD criterion (${study.ASDParticipant || "unset"}) not met`);

  const criteria = [
    ["Hearing loss", study.HearingLossParticipant, child.HearingLoss],
    ["Vision loss", study.VisionLossParticipant, child.VisionLoss],
    ["Premature birth", study.PrematureParticipant, child.PrematureBirth],
    ["Illness", study.IllParticipant, child.Illness],
  ];
  criteria.forEach(([label, setting, value]) => {
    if (!matchesCriterion(setting, value)) reasons.push(`${label} criterion (${setting || "unset"}) not met`);
  });

  return reasons;
}

export function isChildEligibleForStudy(study, child, family = null) {
  return explainIneligibility(study, child, family).length === 0;
}
