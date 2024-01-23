export function childAge(child) {
  var Age = Math.floor(
    (new Date() - new Date(child.DoB)) / (1000 * 60 * 60 * 24)
  );

  var years = Math.floor(Age / 365);
  var months = (Age % 365) / 30.5;
  months = months.toFixed(1);
  // var days = Math.floor((Age % 365) % 30.5);
  var Y = years > 0 ? years + "y " : "";
  var M = months + "m";
  var formated = Y + M;
  return formated;
}
