const { patchStudyParticipationSchema } = require('../api/utils/studySchemaPatch');

test('adds the optional subject to an existing study table', async () => {
  const qi = { describeTable: jest.fn().mockResolvedValue({ ParticipationRules: {} }), addColumn: jest.fn().mockResolvedValue() };
  await patchStudyParticipationSchema(qi);
  expect(qi.addColumn).toHaveBeenCalledWith('Study', 'IntroductionEmailSubject', expect.objectContaining({ allowNull: true }));
  expect(qi.addColumn).toHaveBeenCalledTimes(1);
});

test('leaves an already upgraded study table unchanged', async () => {
  const qi = { describeTable: jest.fn().mockResolvedValue({ ParticipationRules: {}, IntroductionEmailSubject: {} }), addColumn: jest.fn() };
  await patchStudyParticipationSchema(qi);
  expect(qi.addColumn).not.toHaveBeenCalled();
});

test('adds every missing study column in one pass', async () => {
  const qi = { describeTable: jest.fn().mockResolvedValue({ id: {} }), addColumn: jest.fn().mockResolvedValue() };
  await patchStudyParticipationSchema(qi);
  expect(qi.addColumn.mock.calls.map(call => call[1]).sort()).toEqual(['IntroductionEmailSubject', 'ParticipationRules']);
});

test('tolerates a concurrent process adding the same column', async () => {
  const qi = {
    describeTable: jest.fn().mockResolvedValueOnce({ ParticipationRules: {} }).mockResolvedValueOnce({ ParticipationRules: {}, IntroductionEmailSubject: {} }),
    addColumn: jest.fn().mockRejectedValue({ original: { errno: 1060 } }),
  };
  await expect(patchStudyParticipationSchema(qi)).resolves.toBeUndefined();
});

test('a failed ALTER names the manual SQL fallback', async () => {
  const qi = { describeTable: jest.fn().mockResolvedValue({ ParticipationRules: {} }), addColumn: jest.fn().mockRejectedValue(new Error('ALTER command denied')) };
  await expect(patchStudyParticipationSchema(qi)).rejects.toThrow('MySQL/migrate_study_introduction_subject.sql');
});
