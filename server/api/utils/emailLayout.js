/** Shared, image-independent email shell. Existing rich-text bodies remain HTML. */
const SYSTEM_NAME = "Developmental Research Management System";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[char]));
}

// Legacy reminder builders emit full documents. Extract their body before wrapping.
function bodyFragment(html) {
  const source = String(html || "");
  const body = source.match(/<body\b[^>]*>([\s\S]*?)<\/body\s*>/i);
  return (body ? body[1] : source)
    .replace(/<!doctype[^>]*>/gi, "")
    .replace(/<head\b[^>]*>[\s\S]*?<\/head\s*>/gi, "")
    .replace(/<\/?(?:html|body)\b[^>]*>/gi, "");
}

function renderEmail({ htmlBody, subject = "", lab, category, title, reason, wide = false, details = [], preheader = "" }) {
  if (String(htmlBody).includes('data-drdb-email="v1"')) return htmlBody;
  const name = lab?.LabName || SYSTEM_NAME;
  category = category || (lab?.LabName ? "Research participation" : "DRDB notification");
  title = title || subject || "A message from your research team";
  reason = reason || (lab?.LabName
    ? "A message from your research team. Please reply if you have any questions."
    : "This notification was sent by the Developmental Research Management System.");
  const width = wide ? 800 : 600;
  // Use only a validated mailbox in href. Display-only location is escaped as text.
  const email = lab?.Email && /^[^\s<>@"'?:]+@[^\s<>@"'?:]+\.[^\s<>@"'?:]+$/.test(lab.Email) ? lab.Email : "";
  const contactLines = [
    email ? `<a href="mailto:${escapeHtml(email)}" style="color:#245c54;text-decoration:underline;">${escapeHtml(email)}</a>` : "",
    lab?.Location ? escapeHtml(lab.Location) : "",
  ].filter(Boolean).join("<br>");
  const contact = contactLines ? `<p style="margin:0 0 12px;">${contactLines}</p>` : "";
  const detailsHtml = details.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef4f1;border:1px solid #d5e2dc;margin-bottom:24px;"><tr><td style="padding:20px 24px;font-size:16px;line-height:24px;">
    <p style="margin:0 0 12px;font-weight:bold;color:#245c54;">Your appointment</p>
    ${details.map(({ label, value }) => `<p style="margin:0 0 8px;"><strong>${escapeHtml(label)}</strong><br>${escapeHtml(value)}</p>`).join("")}
  </td></tr></table>` : "";
  const content = bodyFragment(htmlBody)
    .replace(/<p>/gi, '<p style="margin:0 0 16px;">');
  return `<!doctype html>
<html lang="en" data-drdb-email="v1">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
@media screen and (max-width:640px){.outer{padding:16px 8px!important}.content{padding:24px!important}.headline{font-size:28px!important}}
a{color:#245c54} table{max-width:100%} td,th{overflow-wrap:anywhere}
</style></head>
<body style="margin:0;background:#f3f4f2;color:#243536;font-family:Arial,Helvetica,sans-serif;">
  ${preheader ? `<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f2;">
    <tr><td align="center" class="outer" style="padding:40px 16px;">
      <!--[if mso]><table role="presentation" width="${width}"><tr><td><![endif]-->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:${width}px;background:#ffffff;border:1px solid #dce2df;border-top:5px solid #245c54;">
        <tr><td class="content" style="padding:32px 40px 24px;border-bottom:1px solid #e4e8e5;">
          <p style="margin:0 0 8px;font-size:12px;line-height:18px;color:#526760;letter-spacing:1px;text-transform:uppercase;">${escapeHtml(category)}</p>
          <p style="margin:0;font-size:22px;line-height:30px;font-weight:bold;color:#245c54;">${escapeHtml(name)}</p>
        </td></tr>
        <tr><td class="content" style="padding:32px 40px 16px;font-size:16px;line-height:26px;">
          <h1 class="headline" style="margin:0 0 24px;font-family:Georgia,'Times New Roman',serif;font-size:32px;line-height:40px;font-weight:normal;color:#243536;">${escapeHtml(title)}</h1>
          ${detailsHtml}
          ${content}
        </td></tr>
        <tr><td class="content" style="padding:24px 40px;background:#fafbf9;border-top:1px solid #e4e8e5;font-size:13px;line-height:21px;color:#526760;">
          <!--drdb-email-logo-->
          <p style="margin:0 0 8px;font-weight:bold;color:#243536;">${escapeHtml(name)}</p>
          ${contact}
          <p style="margin:0;">${escapeHtml(reason)}</p>
        </td></tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td></tr>
  </table>
</body></html>`;
}

function plainText(html) {
  return bodyFragment(html)
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<a\b[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, "$2 ($1)")
    .replace(/<(?:br\s*\/?|\/(?:p|div|tr|h[1-6]))>/gi, "\n")
    .replace(/<\/(?:td|th)>/gi, " | ")
    .replace(/<[^>]*>/g, "")
    .replace(/&#(x[0-9a-f]+|[0-9]+);/gi, (_, n) => {
      const point = n[0].toLowerCase() === "x" ? parseInt(n.slice(1), 16) : Number(n);
      return point <= 0x10ffff ? String.fromCodePoint(point) : "";
    })
    .replace(/&(amp|lt|gt|quot|apos|nbsp|#39);/g, (_, entity) => ({amp:"&",lt:"<",gt:">",quot:'"',apos:"'",nbsp:" ","#39":"'"}[entity]))
    .replace(/\n[ \t]+/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

module.exports = { renderEmail, bodyFragment, escapeHtml, plainText };
