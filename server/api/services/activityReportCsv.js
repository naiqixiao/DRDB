const HEADERS = ['full_name', 'email', 'schedules_created', 'schedules_updated', 'sessions_e1', 'sessions_e2', 'estimated_drdb_hours'];

function cell(value) {
  let text = value == null ? '' : String(value);
  // Prevent spreadsheet applications from evaluating text fields as formulas.
  if (/^[\s\u0000-\u001f]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function makeCsv(members) {
  return [HEADERS.join(','), ...members.map(member => HEADERS.map(header => cell(member[header])).join(','))].join('\r\n') + '\r\n';
}

module.exports = { HEADERS, makeCsv };
