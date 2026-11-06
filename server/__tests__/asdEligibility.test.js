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

// Load the shared client eligibility helper (ES module) without a browser or bundler.
function loadEligibilityHelper() {
  const dir = path.join(__dirname, '../../client/src/assets/JS');
  const strip = (code) => code
    .replace(/^import .*$/gm, '')
    .replace(/export \{[^}]+\};?/g, '')
    .replace(/^export (async )?function/gm, '$1function');
  const code = strip(fs.readFileSync(path.join(dir, 'participationRules.js'), 'utf8'))
    + '\n' + strip(fs.readFileSync(path.join(dir, 'studyEligibility.js'), 'utf8'))
    + '\nreturn { isChildEligibleForStudy, explainIneligibility };';
  return new Function(code)();
}

describe('shared client study eligibility', () => {
  const { isChildEligibleForStudy, explainIneligibility } = loadEligibilityHelper();
  const monthsAgo = (months) => new Date(Date.now() - months * 30.5 * 24 * 3600 * 1000).toISOString();
  const study = {
    StudyType: 'Online', AgeGroups: [], Prerequisites: [], Exclusions: [],
    HearingLossParticipant: 'Include', VisionLossParticipant: 'Include',
    PrematureParticipant: 'Include', IllParticipant: 'Include',
  };

  test.each([0, 1, '0', '1', null])('excludes diagnosis or positive family history %s', (AutismHistory) => {
    for (const ASD of [0, 1, '0', '1']) {
      const child = { ASD, DoB: '2025-01-01', Family: { AutismHistory }, Appointments: [] };
      expect(isChildEligibleForStudy({ ...study, ASDParticipant: 'Exclude' }, child)).toBe(Number(ASD) !== 1 && Number(AutismHistory) !== 1);
      expect(isChildEligibleForStudy({ ...study, ASDParticipant: 'Only' }, child)).toBe(Number(ASD) === 1);
      expect(isChildEligibleForStudy({ ...study, ASDParticipant: 'Include' }, child)).toBe(true);
    }
  });

  describe('multiple age groups', () => {
    // API returns DECIMAL columns as strings.
    const multi = {
      ...study, ASDParticipant: 'Include',
      AgeGroups: [{ MinAge: '6.00', MaxAge: '9.00' }, { MinAge: '18.00', MaxAge: '21.00' }],
    };
    const childAt = (months) => ({ DoB: monthsAgo(months), Family: {}, Appointments: [] });

    test.each([[7, true], [8, true], [19, true], [20, true], [12, false], [4, false], [24, false]])(
      'child aged %s months -> eligible=%s', (months, expected) => {
        expect(isChildEligibleForStudy(multi, childAt(months))).toBe(expected);
      });

    test('a child in the FIRST group is eligible, not only the last group', () => {
      expect(isChildEligibleForStudy(multi, childAt(7))).toBe(true);
      expect(isChildEligibleForStudy({ ...multi, AgeGroups: [...multi.AgeGroups].reverse() }, childAt(7))).toBe(true);
    });

    test('explains which age groups were missed', () => {
      expect(explainIneligibility(multi, childAt(12)).join(' ')).toMatch(/outside every age group \(6–9 mo, 18–21 mo\)/);
    });
  });

  test('family-level online-only flag is honoured even when the child carries a partial Family', () => {
    const inLab = { ...study, StudyType: 'In-lab', ASDParticipant: 'Include' };
    const child = { DoB: '2025-01-01', Family: { AutismHistory: 0 }, Appointments: [] };
    expect(isChildEligibleForStudy(inLab, child, { OnlineStudyOnly: 1 })).toBe(false);
    expect(isChildEligibleForStudy(inLab, child, { OnlineStudyOnly: 0 })).toBe(true);
  });
});

test.each(['ChildInfo.vue', 'appointmentDetails.vue'])('%s uses the shared eligibility helper', (component) => {
  const source = fs.readFileSync(path.join(__dirname, '../../client/src/components', component), 'utf8');
  expect(source).toMatch(/import \{[^}]*isChildEligibleForStudy[^}]*\} from "@\/assets\/JS\/studyEligibility"/);
  expect(source).toMatch(/studyElegibility\(study, child\) \{\s*return isChildEligibleForStudy\(/);
});
