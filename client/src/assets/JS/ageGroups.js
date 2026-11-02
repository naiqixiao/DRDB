// Sequelize DECIMAL values may arrive as strings. Compare numeric bounds so
// duplicate records such as 6–12 and "6.00"–"12.00" display as one range.
export function uniqueAgeGroups(groups = []) {
  const seen = new Set();
  return (groups || []).filter(group => {
    const key = JSON.stringify([Number(group.MinAge), Number(group.MaxAge)]);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
