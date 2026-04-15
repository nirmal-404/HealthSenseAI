import {
  signPrescriptionToken,
  verifyPrescriptionToken,
} from "../src/utils/prescriptionJwt";

jest.mock("../src/config/envConfig", () => ({
  CONFIG: {
    PRESCRIPTION_JWT_SECRET: "test-secret",
  },
}));

describe("prescriptionJwt", () => {
  it("round-trips prescription id", () => {
    const token = signPrescriptionToken("rx-123");
    const out = verifyPrescriptionToken(token);
    expect(out?.prescriptionId).toBe("rx-123");
  });

  it("returns null for bad token", () => {
    expect(verifyPrescriptionToken("not-a-jwt")).toBeNull();
  });
});
