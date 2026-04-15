import { soapNoteResponseSchema } from "../src/validations/sessionSchemas";

describe("soapNoteResponseSchema", () => {
  it("accepts valid SOAP JSON", () => {
    const parsed = soapNoteResponseSchema.parse({
      subjective: "cough",
      objective: "afebrile",
      assessment: "URI",
      plan: "rest",
      followUpDate: null,
      urgencyLevel: "low",
    });
    expect(parsed.urgencyLevel).toBe("low");
  });

  it("rejects bad urgency", () => {
    expect(() =>
      soapNoteResponseSchema.parse({
        subjective: "a",
        objective: "b",
        assessment: "c",
        plan: "d",
        followUpDate: null,
        urgencyLevel: "extreme",
      }),
    ).toThrow();
  });
});
