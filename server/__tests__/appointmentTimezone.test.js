const {
  formatDateInTimezone,
  normalizeAppointmentTime,
} = require("../api/utils/dateTime");

describe("appointment timezone handling", () => {
  it("interprets a timezone-less appointment in the lab timezone", () => {
    const appointment = normalizeAppointmentTime(
      "2026-09-14T17:30",
      "America/Toronto"
    );

    expect(appointment.toISOString()).toBe("2026-09-14T21:30:00.000Z");
  });

  it("preserves an appointment that already includes an offset", () => {
    const appointment = normalizeAppointmentTime(
      "2026-09-14T17:30:00-04:00",
      "UTC"
    );

    expect(appointment.toISOString()).toBe("2026-09-14T21:30:00.000Z");
  });

  it("renders a stored instant in the lab timezone", () => {
    expect(
      formatDateInTimezone(
        "2026-09-14T21:30:00.000Z",
        "h:mma",
        "America/Toronto"
      )
    ).toBe("5:30pm");
  });
});
