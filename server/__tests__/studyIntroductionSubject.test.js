jest.mock('../api/models/DRDB', () => ({
  sequelize: { transaction: jest.fn(async fn => fn('tx')) },
  study: { create: jest.fn(), update: jest.fn(), findOne: jest.fn(), findByPk: jest.fn() },
  studyAgeGroup: { destroy: jest.fn(), bulkCreate: jest.fn() },
}));
jest.mock('../api/controllers/log', () => ({ createLog: jest.fn() }));
jest.mock('../api/services/personnelHistoryService', () => ({ recordPersonnelHistory: jest.fn() }));

const model = require('../api/models/DRDB');
const controller = require('../api/controllers/study');

const base = { StudyName: 'Study A', FK_Lab: 1, FK_Personnel: 2 };

async function call(handler, body) {
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn(), send: jest.fn() };
  const next = jest.fn();
  await handler({ body, userData: { id: 1 } }, res, next);
  expect(next).not.toHaveBeenCalled();
  return res;
}

beforeEach(() => {
  jest.clearAllMocks();
  model.study.create.mockResolvedValue({ id: 5, FK_Lab: 1, FK_Personnel: 2, StudyName: 'Study A' });
  model.study.findOne.mockResolvedValue({ id: 5, StudyName: 'Study A' });
  model.study.findByPk.mockResolvedValue({ id: 5, FK_Lab: 1, FK_Personnel: 2, StudyName: 'Study A' });
});

const rejected = [
  ['a line feed', 'Hello\nWorld'],
  ['a carriage return', 'Hello\rWorld'],
  ['256 characters', 'x'.repeat(256)],
  ['a number', 123],
  ['an object', { subject: 'x' }],
];
const accepted = [
  ['a custom subject', 'Join our word-learning study'],
  ['exactly 255 characters', 'x'.repeat(255)],
  ['a blank string', ''],
  ['null', null],
];

describe.each([['create', 'create', {}], ['update', 'update', { id: 5 }]])('study %s', (_name, method, extra) => {
  test.each(rejected)('rejects %s with a 400 and writes nothing', async (_label, value) => {
    const res = await call(controller[method], { ...base, ...extra, IntroductionEmailSubject: value });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].error).toMatch(/Introduction email subject/);
    expect(model.sequelize.transaction).not.toHaveBeenCalled();
    expect(model.study.create).not.toHaveBeenCalled();
    expect(model.study.update).not.toHaveBeenCalled();
  });

  test.each(accepted)('accepts %s and passes it to the model', async (_label, value) => {
    const res = await call(controller[method], { ...base, ...extra, IntroductionEmailSubject: value });
    expect(res.status).toHaveBeenCalledWith(200);
    const written = (method === 'create' ? model.study.create : model.study.update).mock.calls[0][0];
    expect(written.IntroductionEmailSubject).toBe(value);
  });

  test('accepts a request that omits the subject', async () => {
    const res = await call(controller[method], { ...base, ...extra });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
