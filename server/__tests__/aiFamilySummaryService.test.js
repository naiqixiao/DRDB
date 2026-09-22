jest.mock("../api/models/DRDB", () => ({}));

const {
  INTENTION_VALUES,
  summarizeStudyTypes,
  mostRecentCompletedStudy,
  distinctChildCount,
  distinctStudyCount,
} = require("../api/services/aiFamilySummaryService");

const NOW = new Date("2026-09-18T12:00:00.000Z");

function completedSchedule(overrides = {}) {
  return {
    id: 1,
    Status: "Confirmed",
    Completed: 1,
    AppointmentTime: "2026-07-01T12:00:00.000Z",
    ...overrides,
  };
}

function appointment({ scheduleOverrides = {}, study = {}, child = {} } = {}) {
  return {
    Study: { id: 10, StudyName: "Infant Language Study", StudyType: "Behavioural", ...study },
    Child: { id: 100, Name: "Alex", ...child },
    Schedule: completedSchedule(scheduleOverrides),
  };
}

describe("aiFamilySummaryService", () => {
  test("exposes exactly the three intention categories", () => {
    expect(INTENTION_VALUES).toEqual(["Likely", "Uncertain", "Unlikely"]);
  });

  test("collects distinct study types only from completed schedules", () => {
    const appointments = [
      appointment({ study: { StudyType: "Behavioural" } }),
      appointment({ study: { StudyType: "Online" } }),
      appointment({ study: { StudyType: "Behavioural" } }),
      appointment({ scheduleOverrides: { Status: "No Show", Completed: 0 }, study: { StudyType: "EEG" } }),
    ];
    expect(summarizeStudyTypes(appointments).sort()).toEqual(["Behavioural", "Online"]);
  });

  test("picks the most recently completed study and its recency in days", () => {
    const appointments = [
      appointment({ scheduleOverrides: { AppointmentTime: "2026-06-01T12:00:00.000Z" }, study: { StudyName: "Old Study" } }),
      appointment({ scheduleOverrides: { AppointmentTime: "2026-09-01T12:00:00.000Z" }, study: { StudyName: "Recent Study" } }),
      appointment({ scheduleOverrides: { Status: "Cancelled", Completed: 0, AppointmentTime: "2026-09-15T12:00:00.000Z" }, study: { StudyName: "Cancelled Study" } }),
    ];
    const result = mostRecentCompletedStudy(appointments, NOW);
    expect(result.studyName).toBe("Recent Study");
    expect(result.daysAgo).toBe(17);
  });

  test("returns null when no schedule was ever completed", () => {
    const appointments = [
      appointment({ scheduleOverrides: { Status: "Cancelled", Completed: 0 } }),
    ];
    expect(mostRecentCompletedStudy(appointments, NOW)).toBeNull();
  });

  test("counts distinct children and distinct completed studies, ignoring duplicates", () => {
    const appointments = [
      appointment({ child: { id: 1 }, study: { id: 10 } }),
      appointment({ child: { id: 1 }, study: { id: 11 } }),
      appointment({ child: { id: 2 }, study: { id: 10 } }),
      appointment({ child: { id: 2 }, study: { id: 12 }, scheduleOverrides: { Status: "No Show", Completed: 0 } }),
    ];
    expect(distinctChildCount(appointments)).toBe(2);
    expect(distinctStudyCount(appointments)).toBe(2);
  });
});
