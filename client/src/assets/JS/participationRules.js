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

function matchesParticipationRules(study, history) {
  const groups = getParticipationGroups(study);
  // Invalid saved rules must not silently qualify participants.
  if (!validateParticipationGroups(groups)) return false;
  const ids = new Set(history.map(Number));
  return groups.every(group => {
    if (group.operator === 'ALL') return group.studyIds.every(id => ids.has(id));
    if (group.operator === 'NONE') return !group.studyIds.some(id => ids.has(id));
    return group.studyIds.some(id => ids.has(id));
  });
}

export { getParticipationGroups, validateParticipationGroups, matchesParticipationRules };
