function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[character]));
}

// Shared by actual parent confirmations and the Study Communications sample.
export function buildConfirmationOpening({ parentName, childNames }) {
  return `<p>Dear ${escapeHtml(parentName)},</p><p>Thanks for your support to our research! This is a confirmation for your participation in our study with <strong>${escapeHtml(childNames)}</strong>.</p>`;
}
