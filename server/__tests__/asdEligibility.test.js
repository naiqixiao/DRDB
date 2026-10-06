jest.mock('../api/models/DRDB', () => ({
  child: { findAll: jest.fn() },
  study: { findOne: jest.fn() },
}));
jest.mock('../api/controllers/log', () => ({ createLog: jest.fn() }));

const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const model = require('../api/models/DRDB');
const controller = require('../api/controllers/child');

async function search(query) {
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn(), send: jest.fn() };
  const next = jest.fn();
  await controller.search({ query }, res, next);
  expect(next).not.toHaveBeenCalled();
  return model.child.findAll.mock.calls[0][0].where;
}

beforeEach(() => {
  jest.clearAllMocks();
  model.child.findAll.mockResolvedValue([]);
});

test.each(['true', 'false'])('enforces saved ASD criteria in slim=%s recruitment', async (slim) => {
  for (const [ASDParticipant, expected] of [['Exclude', 0], ['Only', 1], ['Include', undefined]]) {
    model.study.findOne.mockResolvedValue({ ASDParticipant, StudyType: 'Online', Appointments: [] });
    for (const supplied of [undefined, '0', '1']) {
      model.child.findAll.mockClear();
      const where = await search({ studyID: '1', minAge: '1', maxAge: '24', slim, ASDParticipant: supplied });
      expect(where.ASD).toBe(expected);
      if (ASDParticipant === 'Exclude') {
        expect(where['$Family.AutismHistory$']).toEqual({ [Op.or]: [0, null] });
      } else {
        expect(where).not.toHaveProperty('$Family.AutismHistory$');
      }
    }
  }
});

test.each(['0', '1'])('general ASD filter %s uses child diagnosis', async (ASDParticipant) => {
  const where = await search({ ASDParticipant });
  expect(where.ASD).toBe(ASDParticipant);
  if (ASDParticipant === '0') {
    expect(where['$Family.AutismHistory$']).toEqual({ [Op.or]: [0, null] });
  } else {
    expect(where).not.toHaveProperty('$Family.AutismHistory$');
  }
});

// Exercise the actual Vue methods without needing a browser or Vue test runner.
describe.each(['ChildInfo.vue', 'appointmentDetails.vue'])('%s study eligibility', (component) => {
  const source = fs.readFileSync(path.join(__dirname, '../../client/src/components', component), 'utf8');
  const start = source.indexOf('studyElegibility(study, child) {');
  const end = source.indexOf('\n    },', start);
  const method = new Function(`return ({${source.slice(start, end)}\n}}).studyElegibility`)();
  const study = {
    StudyType: 'Online', AgeGroups: [], Prerequisites: [], Exclusions: [],
    HearingLossParticipant: 'Include', VisionLossParticipant: 'Include',
    PrematureParticipant: 'Include', IllParticipant: 'Include',
  };
  test.each([0, 1, '0', '1', null])('excludes diagnosis or positive family history %s', (AutismHistory) => {
    for (const ASD of [0, 1, '0', '1']) {
      const child = { ASD, DoB: '2025-01-01', Family: { AutismHistory }, Appointments: [] };
      expect(method.call({}, { ...study, ASDParticipant: 'Exclude' }, child)).toBe(Number(ASD) !== 1 && Number(AutismHistory) !== 1);
      expect(method.call({}, { ...study, ASDParticipant: 'Only' }, child)).toBe(Number(ASD) === 1);
      expect(method.call({}, { ...study, ASDParticipant: 'Include' }, child)).toBe(true);
    }
  });
});
