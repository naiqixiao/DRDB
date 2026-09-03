jest.mock("../api/models/DRDB", () => ({}));

const {
  buildParticipationProfile,
  findSimilarStudy,
  meaningfulWords,
} = require("../api/services/aiEmailService");

const NOW = new Date("2026-09-03T12:00:00.000Z");

function schedule(overrides = {}) {
  return {
    id: 1,
    Status: "Confirmed",
    Completed: 1,
    AppointmentTime: "2026-07-01T12:00:00.000Z",
    Appointments: [],
    ...overrides,
  };
}

describe("AI email context signals", () => {
  test("removes stop words and keeps meaningful study terms", () => {
    expect([...meaningfulWords("The infant language study with videos")]).toEqual(
      expect.arrayContaining(["infant", "language", "videos"])
    );
  });

  test("selects only a recent completed study with the same type", () => {
    const currentStudy = {
      StudyName: "Infant Language and Video Study",
      Description: "Children watch videos while researchers measure language attention.",
      StudyType: "Behavioural",
    };
    const match = {
      id: 50,
      Study: {
        StudyName: "Early Language Video Study",
        Description: "Researchers measure language while children watch videos.",
        StudyType: "Behavioural",
      },
      Schedule: schedule(),
    };
    const wrongType = {
      ...match,
      Study: { ...match.Study, StudyType: "Online" },
    };
    const old = {
      ...match,
      Schedule: schedule({ AppointmentTime: "2025-01-01T12:00:00.000Z" }),
    };

    expect(findSimilarStudy(currentStudy, [wrongType, old, match], NOW)).toMatchObject({
      studyName: "Early Language Video Study",
    });
  });

  test("derives returning and engaged tones from completed sessions", () => {
    const returning = buildParticipationProfile([
      schedule({ id: 1 }),
    ], [{ Time: "2026-08-01T12:00:00.000Z" }], [], NOW);
    expect(returning.tone).toBe("returning");
    expect(returning.completedSessionCount).toBe(1);
    expect(returning.contactAttemptCount).toBe(1);

    const engagedSchedules = [1, 2, 3].map((id) => schedule({ id }));
    const engaged = buildParticipationProfile(engagedSchedules, [], [], NOW);
    expect(engaged.tone).toBe("engaged");
  });

  test("does not classify no-shows as completed sessions", () => {
    const profile = buildParticipationProfile([
      schedule({ Status: "No Show", Completed: 0 }),
    ], [], [], NOW);
    expect(profile.completedSessionCount).toBe(0);
    expect(profile.tone).toBe("new");
  });

  test("does not count the current email appointment as prior participation", () => {
    const profile = buildParticipationProfile([
      schedule({
        Appointments: [{ id: 99, Study: { StudyName: "Current study" } }],
      }),
    ], [], [99], NOW);
    expect(profile.completedSessionCount).toBe(0);
    expect(profile.historicalAppointments).toHaveLength(0);
  });
});
