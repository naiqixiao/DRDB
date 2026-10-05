const { patchLegacyFamilySchemaIfNeeded } = require('../api/utils/familySchemaPatch');

function fakeQueryInterface(columns) {
  return {
    describeTable: jest.fn().mockResolvedValue(columns),
    addColumn: jest.fn().mockResolvedValue(),
  };
}

beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('Family OnlineStudyOnly startup patch', () => {
  test('adds the column with a 0 default when it is missing', async () => {
    const qi = fakeQueryInterface({ id: {}, NamePrimary: {} });
    await expect(patchLegacyFamilySchemaIfNeeded(qi)).resolves.toBe(true);
    expect(qi.addColumn).toHaveBeenCalledWith('Family', 'OnlineStudyOnly',
      expect.objectContaining({ allowNull: false, defaultValue: 0 }));
  });

  test('does nothing when the column already exists', async () => {
    const qi = fakeQueryInterface({ id: {}, OnlineStudyOnly: {} });
    await expect(patchLegacyFamilySchemaIfNeeded(qi)).resolves.toBe(true);
    expect(qi.addColumn).not.toHaveBeenCalled();
  });

  test('logs and resolves instead of throwing when ALTER is not permitted', async () => {
    const qi = fakeQueryInterface({ id: {} });
    qi.addColumn.mockRejectedValue(new Error('ALTER command denied'));
    await expect(patchLegacyFamilySchemaIfNeeded(qi)).resolves.toBe(false);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('migrate_online_study_only.sql'), 'ALTER command denied');
  });

  test('resolves instead of throwing when the table cannot be described', async () => {
    const qi = fakeQueryInterface({});
    qi.describeTable.mockRejectedValue(new Error('connection lost'));
    await expect(patchLegacyFamilySchemaIfNeeded(qi)).resolves.toBe(false);
  });
});
