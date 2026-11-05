const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { createRequire } = require('module');

// Execute the real startup gate against an older schema, without a live database.
async function startWithLabColumns(labColumns, addColumnError, studyColumns = { ParticipationRules: {}, IntroductionEmailSubject: {} }) {
  const tables = { Lab: { ...labColumns }, Family: { OnlineStudyOnly: {} }, Study: { ...studyColumns } };
  const qi = {
    describeTable: jest.fn(async table => tables[table]),
    addColumn: jest.fn(async (table, column, options) => {
      if (addColumnError) throw addColumnError;
      tables[table][column] = options;
    }),
  };
  const modelFile = path.resolve(__dirname, '../api/models/DRDB.js');
  const source = fs.readFileSync(modelFile, 'utf8');
  const gate = source.slice(source.indexOf('exports.schemaReady ='), source.indexOf('// Remaining patches'));
  const context = {
    exports: {}, require: createRequire(modelFile),
    sequelize: { sync: jest.fn().mockResolvedValue(), getQueryInterface: () => qi },
    patchLegacyFamilySchemaIfNeeded: require('../api/utils/familySchemaPatch').patchLegacyFamilySchemaIfNeeded,
  };
  vm.runInNewContext(gate, context);
  await context.exports.schemaReady;
  return { qi, tables };
}

test('startup makes Lab.Timezone selectable by the login query on older databases', async () => {
  const { qi, tables } = await startWithLabColumns({ id: {}, LabName: {} });
  // Login includes the Lab model, which automatically selects its Timezone field.
  const selectLoginLab = () => {
    if (!Object.hasOwn(tables.Lab, 'Timezone')) throw new Error("Unknown column 'Lab.Timezone' in 'field list'");
    return tables.Lab.Timezone;
  };
  expect(selectLoginLab).not.toThrow();
  expect(qi.addColumn).toHaveBeenCalledWith('Lab', 'Timezone', expect.objectContaining({ allowNull: true, defaultValue: '' }));
});

test('startup preserves existing per-lab timezone values', async () => {
  const column = { type: 'VARCHAR(45)', defaultValue: 'America/Vancouver' };
  const { qi, tables } = await startWithLabColumns({ id: {}, Timezone: column });
  expect(qi.addColumn).not.toHaveBeenCalled();
  expect(tables.Lab.Timezone).toEqual(column);
});

test('a failed ALTER rejects the schema gate with manual recovery instructions', async () => {
  await expect(startWithLabColumns({ id: {} }, new Error('ALTER command denied')))
    .rejects.toThrow('MySQL/migrate_lab_timezone.sql');
});

test('tolerates a concurrent process adding the same column', async () => {
  const { patchLabTimezoneSchema } = require('../api/utils/labSchemaPatch');
  const qi = {
    describeTable: jest.fn().mockResolvedValueOnce({ id: {} }).mockResolvedValueOnce({ id: {}, Timezone: {} }),
    addColumn: jest.fn().mockRejectedValue({ original: { errno: 1060 } }),
  };
  await expect(patchLabTimezoneSchema(qi)).resolves.toBeUndefined();
  expect(qi.describeTable).toHaveBeenCalledTimes(2);
});

test('startup adds Study.IntroductionEmailSubject to an older database before listening', async () => {
  const { tables } = await startWithLabColumns({ id: {}, Timezone: {} }, undefined, { ParticipationRules: {} });
  expect(tables.Study).toHaveProperty('IntroductionEmailSubject');
});
