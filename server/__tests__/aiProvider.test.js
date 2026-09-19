const { parseModelJson, cleanModelText, AiServiceError } = require("../api/services/aiProvider");

describe("aiProvider.parseModelJson", () => {
  const FIELD_SPECS = [
    { key: "summary", maxLength: 20 },
    { key: "category", maxLength: 10, allowedValues: ["Likely", "Uncertain", "Unlikely"], fallback: "Uncertain" },
  ];

  test("parses and trims fields to their max length", () => {
    const result = parseModelJson(
      JSON.stringify({ summary: "a".repeat(30), category: "Likely" }),
      FIELD_SPECS
    );
    expect(result.summary).toHaveLength(20);
    expect(result.category).toBe("Likely");
  });

  test("falls back an out-of-set enum value instead of trusting the model", () => {
    const result = parseModelJson(
      JSON.stringify({ summary: "fine", category: "Definitely yes" }),
      FIELD_SPECS
    );
    expect(result.category).toBe("Uncertain");
  });

  test("throws AiServiceError on invalid JSON instead of leaking raw text", () => {
    expect(() => parseModelJson("not json", FIELD_SPECS)).toThrow(AiServiceError);
  });

  test("strips HTML from model output", () => {
    const result = parseModelJson(
      JSON.stringify({ summary: "<b>Hi</b> there", category: "Likely" }),
      FIELD_SPECS
    );
    expect(result.summary).not.toMatch(/[<>]/);
  });
});

describe("aiProvider.parseModelJson with preserveHtml", () => {
  const HTML_FIELD_SPECS = [
    { key: "polishedBody", maxLength: 200, preserveHtml: true },
  ];

  test("keeps HTML tags intact instead of stripping them", () => {
    const result = parseModelJson(
      JSON.stringify({ polishedBody: "<p>Hello <a href=\"https://x.test\">link</a></p>" }),
      HTML_FIELD_SPECS
    );
    expect(result.polishedBody).toContain("<a href=\"https://x.test\">link</a>");
  });

  test("still trims to maxLength", () => {
    const shortSpec = [{ key: "polishedBody", maxLength: 40, preserveHtml: true }];
    const result = parseModelJson(
      JSON.stringify({ polishedBody: "<p>" + "a".repeat(60) + "</p>" }),
      shortSpec
    );
    expect(result.polishedBody).toHaveLength(40);
  });
});

describe("aiProvider.cleanModelText", () => {
  test("collapses newlines and strips markup", () => {
    expect(cleanModelText("Line one\nLine <i>two</i>", 100)).toBe("Line one Line two");
  });
});
