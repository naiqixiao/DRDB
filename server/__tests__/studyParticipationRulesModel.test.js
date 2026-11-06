const Sequelize = require('sequelize');
const defineStudy = require('../api/models/SequelizeAuto/Study');

// No connection is made: the model is only used to build rows and generate SQL.
const sequelize = new Sequelize('test', 'user', 'pass', { dialect: 'mariadb', logging: false });
const Study = defineStudy(sequelize, Sequelize);

const read = (value) => Study.build({ id: 1, ParticipationRules: value }, { raw: true }).toJSON().ParticipationRules;

describe('Study.ParticipationRules model field', () => {
  // The MariaDB driver JSON.parse()s JSON-typed columns, so an empty string used to fail
  // every study query with "Unexpected end of JSON input".
  test('is not a driver-parsed JSON column', () => {
    expect(Study.rawAttributes.ParticipationRules.type instanceof Sequelize.JSON).toBe(false);
  });

  test.each([[null], [''], ['{not json']])('%j reads as null (legacy rules)', (stored) => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(read(stored)).toBeNull();
    warn.mockRestore();
  });

  test('parses stored rules, including an explicit empty list', () => {
    expect(read('[]')).toEqual([]);
    expect(read('[{"operator":"ANY","studyIds":[2]}]')).toEqual([{ operator: 'ANY', studyIds: [2] }]);
  });

  test('writes rules as JSON text and null as NULL', async () => {
    const binds = [];
    sequelize.query = async (sql, options) => { binds.push((options && options.bind) || sql.bind || sql.values); return [[], 0]; };
    await Study.update({ ParticipationRules: [{ operator: 'NONE', studyIds: [3] }] }, { where: { id: 5 } });
    await Study.update({ ParticipationRules: [] }, { where: { id: 5 } });
    await Study.update({ ParticipationRules: null }, { where: { id: 5 } });
    expect(binds.map((bind) => bind[0])).toEqual(['[{"operator":"NONE","studyIds":[3]}]', '[]', null]);
  });
});
