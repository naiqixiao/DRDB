const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Exercise the Vue Options API logic without mounting or sending email.
function load(file) {
  const source = fs.readFileSync(path.join(__dirname, '../../client/src', file), 'utf8');
  const bindings = {};
  const script = source.match(/<script>([\s\S]*?)<\/script>/)[1]
    .replace(/import\s+([\s\S]*?)\s+from\s+['"][^'"]+['"];?/g, (_, names) => {
      names.replace(/[{}]/g, '').split(',').forEach(name => { bindings[name.trim()] = {}; });
      return '';
    }).replace('export default', 'result =');
  return vm.runInNewContext(script, { ...bindings, result: null });
}
const study = load('views/Study.vue');
const schedule = load('components/scheduleDialog.vue');
const email = load('components/emailComponent.vue');

it.each(['Interested', 'Left a message'])('uses invitation subjects for tentative updates: %s', status => {
  const context = { emailAppointments: [{ status }], generateNextContactNote() {} };
  schedule.methods.step12.call(context);
  expect(context.emailType).toBe('Introduction');
  expect(context.emailDialog).toBe(true);
  const composer = {
    emailType: context.emailType,
    appointments: [1, 1, 2].map(id => ({ FK_Study: id, Study: {
      StudyName: 'Study ' + id, IntroductionEmailSubject: id === 1 ? '  Join our study  ' : 'Another invitation',
    } })),
    defaultIntroductionSubject: 'An eligible study for Emma',
    resetPersonalization() {}, resetPolish() {}, generateEmailBody() { return 'Body'; },
  };
  composer.introductionSubjectChoices = email.computed.introductionSubjectChoices.call(composer);
  email.methods.initializeEmail.call(composer);
  expect(composer.emailSubject).toBe('Join our study');
  expect(composer.introductionSubjectChoices).toHaveLength(3);
  composer.appointments = [{ Study: { IntroductionEmailSubject: '  ' } }];
  composer.introductionSubjectChoices = email.computed.introductionSubjectChoices.call(composer);
  email.methods.initializeEmail.call(composer);
  expect(composer.emailSubject).toBe('An eligible study for Emma');
});

it('rejects invalid subjects in both study editors', async () => {
  const validate = study.methods.validateIntroductionSubject;
  for (const value of [null, undefined, '', 'Invitation', 'x'.repeat(255)]) expect(validate(value)).toBe(true);
  for (const value of ['line\nbreak', 'line\rbreak', 'x'.repeat(256)]) {
    const context = { editedStudy: { IntroductionEmailSubject: value }, currentStudy: { IntroductionEmailSubject: value }, validateIntroductionSubject: validate };
    expect(validate(value)).not.toBe(true);
    await study.methods.save.call(context);
    expect(context.studyStepper).toBe(4);
    expect(context.emailTemplateTab).toBe('introduction');
    await study.methods.saveEmailTemplates.call(context);
    expect(context.commTab).toBe('introduction');
  }
});
