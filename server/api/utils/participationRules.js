// A null value uses the legacy ANY prerequisites / NONE exclusions rules.
function getParticipationGroups(study) {
  if (study.ParticipationRules != null) return study.ParticipationRules;
  const groups = [];
  const prerequisites = (study.Prerequisites || []).map(s => Number(s.id));
  const exclusions = (study.Exclusions || []).map(s => Number(s.id));
  if (prerequisites.length) groups.push({ operator: 'ANY', studyIds: prerequisites });
  if (exclusions.length) groups.push({ operator: 'NONE', studyIds: exclusions });
  return groups;
}

function validateParticipationGroups(groups) {
  if (!Array.isArray(groups) || groups.length > 50) return false;
  return groups.every(group => group && ['ANY', 'ALL', 'NONE'].includes(group.operator)
    && Array.isArray(group.studyIds) && group.studyIds.length > 0 && group.studyIds.length <= 500
    && group.studyIds.every(id => Number.isInteger(id) && id > 0));
}

function matchesParticipationRules(study, appointments) {
  const groups = getParticipationGroups(study);
  // Invalid saved rules must not silently qualify participants.
  if (!validateParticipationGroups(groups)) return false;
  const contacted = new Set(appointments.map(appointment => Number(appointment.FK_Study)));
  const completed = new Set(appointments
    .filter(({ Schedule }) => Schedule && Schedule.Status === "Confirmed" && Number(Schedule.Completed) === 1)
    .map(appointment => Number(appointment.FK_Study)));
  return groups.every(group => {
    if (group.operator === 'ALL') return group.studyIds.every(id => completed.has(id));
    if (group.operator === 'NONE') return !group.studyIds.some(id => contacted.has(id));
    return group.studyIds.some(id => completed.has(id));
  });
}

module.exports = { getParticipationGroups, validateParticipationGroups, matchesParticipationRules };
