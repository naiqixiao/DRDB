jest.mock('../api/models/DRDB', () => ({
  child: { findAll: jest.fn() },
  study: { findOne: jest.fn() },
  family: { findAll: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn() },
}));
jest.mock('../api/controllers/log', () => ({ createLog: jest.fn() }));

const model = require('../api/models/DRDB');
const childController = require('../api/controllers/child');
const familyController = require('../api/controllers/family');

async function invoke(handler, query = {}, body = {}) {
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn(), send: jest.fn() };
  const next = jest.fn();
  await handler({ query, body }, res, next);
  expect(next).not.toHaveBeenCalled();
  return res;
}

beforeEach(() => {
  jest.clearAllMocks();
  model.child.findAll.mockResolvedValue([]);
  model.family.findAll.mockResolvedValue([]);
  model.family.count.mockResolvedValue(0);
});

describe('Recruitment participation availability', () => {
  test.each(['true', 'false'])('excludes online-only families in slim=%s searches for every in-person format', async (slim) => {
    for (const StudyType of ['Behavioural', 'EEG/ERP', 'EyeTracking', 'fNIRS']) {
      model.study.findOne.mockResolvedValue({ StudyType, Appointments: [] });
      await invoke(childController.search, { studyID: '1', minAge: '1', maxAge: '24', slim, StudyType: 'Online' });
      const options = model.child.findAll.mock.calls.at(-1)[0];
      expect(options.where['$Family.OnlineStudyOnly$']).toBe(0);
      if (slim === 'true') expect(options.include[1].attributes).toContain('OnlineStudyOnly');
    }
  });
  test.each(['true', 'false'])('includes online-only families for online studies in slim=%s', async (slim) => {
    model.study.findOne.mockResolvedValue({ StudyType: 'Online', Appointments: [] });
    await invoke(childController.search, { studyID: '1', minAge: '1', maxAge: '24', slim });
    expect(model.child.findAll.mock.calls[0][0].where).not.toHaveProperty('$Family.OnlineStudyOnly$');
  });
  test('keeps general child lookup available', async () => {
    await invoke(childController.search, { FamilyId: '1' });
    expect(model.child.findAll.mock.calls[0][0].where).not.toHaveProperty('$Family.OnlineStudyOnly$');
  });
  test('returns 404 for a missing study', async () => {
    model.study.findOne.mockResolvedValue(null);
    const res = await invoke(childController.search, { studyID: '1', minAge: '1', maxAge: '24' });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(model.child.findAll).not.toHaveBeenCalled();
  });
});

describe('Family availability filter and persistence', () => {
  test.each([['In person', 0], ['Online studies only', 1]])('filters %s before counting and paging', async (ParticipationAvailability, expected) => {
    await invoke(familyController.search, { ParticipationAvailability });
    expect(model.family.count.mock.calls[0][0].where.OnlineStudyOnly).toBe(expected);
    expect(model.family.findAll.mock.calls[0][0].where.OnlineStudyOnly).toBe(expected);
  });
  test('includes all availability when filter is cleared', async () => {
    await invoke(familyController.search, {});
    expect(model.family.findAll.mock.calls[0][0].where).not.toHaveProperty('OnlineStudyOnly');
  });
  test.each([0, 1])('persists OnlineStudyOnly=%s when creating a family', async (OnlineStudyOnly) => {
    model.family.create.mockResolvedValue({ id: 1, OnlineStudyOnly });
    await invoke(familyController.create, {}, { NamePrimary: 'Test', OnlineStudyOnly, User: 'Tester' });
    expect(model.family.create.mock.calls[0][0].OnlineStudyOnly).toBe(OnlineStudyOnly);
  });
  test.each([1, 0])('can save and clear OnlineStudyOnly=%s on an existing family', async (OnlineStudyOnly) => {
    model.family.update.mockResolvedValue([1]);
    const res = await invoke(familyController.update, {}, { id: 1, OnlineStudyOnly });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(model.family.update).toHaveBeenCalledWith(
      { id: 1, OnlineStudyOnly }, { where: { id: 1 } }
    );
  });

});
