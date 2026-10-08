jest.mock('../api/models/DRDB', () => ({
  schedule: { findAll: jest.fn() },
  lab: { findAll: jest.fn() },
  systemSetting: { findOne: jest.fn() },
}));
jest.mock('../api/controllers/log', () => ({ createLog: jest.fn() }));

const model = require('../api/models/DRDB');
const scheduleController = require('../api/controllers/schedule');
const { maskCaregiverName, toParkingVisits, toParkingLabs } = scheduleController;

const lead = { Name: 'Lead Person', Email: 'lead@lab.ca', Phone: '905-000-0000', Password: 'secret' };
const exp = { Name: 'RA Person', Email: 'ra@lab.ca', Phone: null };

function appt(StudyType, StudyName = 'Study A') {
  return {
    Study: { StudyName, StudyType, Lab: { id: 1, LabName: 'Baby Lab' }, PointofContact: lead },
    PrimaryExperimenter: [exp],
  };
}

describe('maskCaregiverName', () => {
  test.each([
    ['Sarah Kim', 'Sarah K.'],
    ['  maria de la cruz ', 'maria C.'],
    ['Alex', 'Alex'],
    ['', 'Participant family'],
    [null, 'Participant family'],
  ])('%p -> %p', (input, expected) => {
    expect(maskCaregiverName(input)).toBe(expected);
  });
});

describe('toParkingVisits', () => {
  test('drops online-only visits and online appointments in mixed visits', () => {
    const visits = toParkingVisits([
      { id: 1, AppointmentTime: 't1', Family: { NamePrimary: 'Sarah Kim', Phone: '123', Email: 'x@y' }, Appointments: [appt('Online')] },
      { id: 2, AppointmentTime: 't2', Family: { NamePrimary: 'Jo Lee' }, Appointments: [appt('Online', 'Zoom'), appt('EEG/ERP', 'EEG')] },
    ]);
    expect(visits).toHaveLength(1);
    expect(visits[0].id).toBe(2);
    expect(visits[0].studies.map((s) => s.studyName)).toEqual(['EEG']);
  });

  test('exposes only masked caregiver and staff contact fields', () => {
    const [visit] = toParkingVisits([
      { id: 3, AppointmentTime: 't', Family: { NamePrimary: 'Sarah Kim', Phone: '123', Email: 'fam@x.ca' }, Appointments: [appt('Behavioural')] },
    ]);
    expect(visit).toEqual({
      id: 3,
      time: 't',
      caregiver: 'Sarah K.',
      studies: [{
        studyName: 'Study A',
        studyType: 'Behavioural',
        labId: 1,
        lab: 'Baby Lab',
        lead: { name: 'Lead Person', email: 'lead@lab.ca', phone: '905-000-0000' },
        experimenter: { name: 'RA Person', email: 'ra@lab.ca', phone: null },
      }],
    });
    expect(JSON.stringify(visit)).not.toMatch(/fam@x\.ca|secret|Kim/);
  });

  test('handles missing experimenter assignment', () => {
    const [visit] = toParkingVisits([
      { id: 4, AppointmentTime: 't', Family: null, Appointments: [{ ...appt('Behavioural'), PrimaryExperimenter: [] }] },
    ]);
    expect(visit.studies[0].experimenter).toBeNull();
    expect(visit.caregiver).toBe('Participant family');
  });
});

describe('parkingBoard handler', () => {
  test('queries confirmed, non-training visits in a 7-day window', async () => {
    model.systemSetting.findOne.mockResolvedValue({ SettingValue: 'America/Toronto' });
    model.schedule.findAll.mockResolvedValue([]);
    model.lab.findAll.mockResolvedValue([]);
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
    const next = jest.fn();
    await scheduleController.parkingBoard({ query: {} }, res, next);
    expect(next).not.toHaveBeenCalled();

    const { where } = model.schedule.findAll.mock.calls[0][0];
    expect(where.Status).toBe('Confirmed');
    expect(where.Completed).toBe(false);
    expect(where['$Family.TrainingSet$']).toBe(false);
    const [start, end] = where.AppointmentTime[require('sequelize').Op.between];
    const days = (end - start) / 86400000;
    expect(days).toBeGreaterThan(6.9);
    expect(days).toBeLessThan(7.1);
    expect(res.send).toHaveBeenCalledWith({ timeZone: 'America/Toronto', labs: [], visits: [] });
  });
});

describe('toParkingLabs', () => {
  const original = process.env.PARKING_EXCLUDED_LABS;
  afterEach(() => {
    if (original === undefined) delete process.env.PARKING_EXCLUDED_LABS;
    else process.env.PARKING_EXCLUDED_LABS = original;
  });

  test('marks labs listed in PARKING_EXCLUDED_LABS, case-insensitively', () => {
    process.env.PARKING_EXCLUDED_LABS = ' vision lab , Off-site Lab';
    expect(toParkingLabs([
      { id: 1, LabName: 'Baby Lab' },
      { id: 2, LabName: 'Vision Lab' },
      { id: 3, LabName: 'Off-site Lab' },
    ])).toEqual([
      { id: 1, name: 'Baby Lab', countsForParking: true },
      { id: 2, name: 'Vision Lab', countsForParking: false },
      { id: 3, name: 'Off-site Lab', countsForParking: false },
    ]);
  });

  test('counts every lab when unset', () => {
    delete process.env.PARKING_EXCLUDED_LABS;
    expect(toParkingLabs([{ id: 1, LabName: 'Baby Lab' }])[0].countsForParking).toBe(true);
  });
});
