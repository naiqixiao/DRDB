// MySQL/MariaDB column names are case-insensitive; metadata preserves the
// spelling used when the column was originally created.
function hasColumn(columns, name) {
  return Object.keys(columns).some(column => column.toLowerCase() === name.toLowerCase());
}

function isDuplicateColumn(error) {
  return [error, error.original, error.parent].some(cause => cause && (
    Number(cause.errno) === 1060 || cause.code === 'ER_DUP_FIELDNAME'
  ));
}

module.exports = { hasColumn, isDuplicateColumn };
