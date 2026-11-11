const { buildWelcomeEmail, buildPasswordChangedEmail, buildPasswordResetEmail, buildFeedbackEmail } = require('../api/utils/userTemplates');
const { prepareEmail } = require('../api/services/emailBrandingService');
const { plainText } = require('../api/utils/emailLayout');

it('renders credentials safely and keeps them in the delivered text alternative', async () => {
  for (const message of [
    buildWelcomeEmail('Alex Smith', 'alex@example.org', 'Lab & manager', 'abc<&123'),
    buildPasswordResetEmail('Alex Smith', 'alex@example.org', 'abc<&123'),
  ]) {
    const { htmlBody } = await prepareEmail(message);
    expect(htmlBody.match(/data-drdb-email="v1"/g)).toHaveLength(1);
    expect(htmlBody).toContain('abc&lt;&amp;123');
    expect(htmlBody).not.toContain('abc<&123');
    expect(plainText(htmlBody)).toContain('abc<&123');
    expect(plainText(htmlBody)).toContain('Sign in to DRDB');
    expect(message.to).toBe('Alex Smith <alex@example.org>');
  }
});

it('preserves the security notice and safely renders feedback as multiline text', () => {
  expect(plainText(buildPasswordChangedEmail('Alex Smith', 'alex@example.org').htmlBody)).toContain('contact your lab manager');
  const feedback = buildFeedbackEmail('alex@example.org', 'Schedule <page>', 'Help & feedback', 'First line\n<script>alert(1)</script>');
  expect(feedback.cc).toBe('alex@example.org');
  expect(feedback.htmlBody).toContain('Schedule &lt;page&gt;');
  expect(feedback.htmlBody).toContain('First line<br>&lt;script&gt;alert(1)&lt;/script&gt;');
  expect(plainText(feedback.htmlBody)).toContain('First line\n<script>alert(1)</script>');
});
