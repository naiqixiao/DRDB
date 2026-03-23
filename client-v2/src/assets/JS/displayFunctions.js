export function childAge(child) {
  const Age = Math.floor(
    (new Date() - new Date(child.DoB)) / (1000 * 60 * 60 * 24)
  );

  const years = Math.floor(Age / 365);
  let months = (Age % 365) / 30.5;
  months = months.toFixed(1);
  // var days = Math.floor((Age % 365) % 30.5);
  const Y = years > 0 ? years + "y " : "";
  const M = months + "m";
  const formated = Y + M;
  return formated;
}


export function childStudyAge(child, studyDate) {
  const Age = Math.floor(
    (new Date(studyDate) - new Date(child.DoB)) / (1000 * 60 * 60 * 24)
  );

  return Age + " days at study";
}