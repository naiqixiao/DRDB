jest.mock('../api/models/DRDB', () => ({
  child: { findAll: jest.fn() },
  study: { findOne: jest.fn() },
  family: { findAll: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn() },
}));
jest.mock('../api/controllers/log', () => ({ createLog: jest.fn() }));

const model = require('../api/models/DRDB');
const { Op } = require('sequelize');
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
      model.child.findAll.mockClear();
      if (slim === 'true') {
        model.child.findAll.mockResolvedValueOnce([{ id: 2 }]).mockResolvedValueOnce([{ id: 2 }]);
      }
      await invoke(childController.search, { studyID: '1', minAge: '1', maxAge: '24', slim, StudyType: 'Online' });
      const options = model.child.findAll.mock.calls[0][0];
      expect(options.where['$Family.OnlineStudyOnly$']).toBe(0);
      if (slim === 'true') {
        expect(options.attributes).toEqual(['id']);
        expect(options.include).toHaveLength(1);
        expect(model.child.findAll.mock.calls[1][0].include[1].attributes).toContain('OnlineStudyOnly');
      }
    }
  });
  test('loads only the appointment studies used by participation rules', async () => {
    model.study.findOne.mockResolvedValue({
      StudyType: 'Online',
      Appointments: [{ FK_Child: 4 }],
      ParticipationRules: [{ operator: 'ALL', studyIds: [10] }, { operator: 'NONE', studyIds: [11] }],
    });
    model.child.findAll.mockResolvedValueOnce([
      { id: 1, Appointments: [{ FK_Study: 10, Schedule: { Status: 'Confirmed', Completed: 1 } }] },
      { id: 2, Appointments: [{ FK_Study: 10, Schedule: { Status: 'Confirmed', Completed: 1 } }, { FK_Study: 11 }] },
      { id: 5, Appointments: [{ FK_Study: 10 }] },
      { id: 6, Appointments: [{ FK_Study: 10, Schedule: { Status: 'Rejected', Completed: 1 } }] },
      { id: 7, Appointments: [{ FK_Study: 10, Schedule: { Status: 'Confirmed', Completed: 0 } }] },
      { id: 3, Appointments: [] },
    ]).mockResolvedValueOnce([{ id: 1 }]);
    const res = await invoke(childController.search, { studyID: '1', minAge: '1', maxAge: '24', slim: 'true' });
    const scan = model.child.findAll.mock.calls[0][0];
    expect(scan.where.id).toEqual({ [Op.notIn]: [4] });
    expect(scan.include[1].where.FK_Study).toEqual({ [Op.in]: [10, 11] });
    expect(res.json).toHaveBeenCalledWith({
      children: [{ id: 1 }],
      pagination: { limit: 100, offset: 0, total: 1, hasMore: false },
    });
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
