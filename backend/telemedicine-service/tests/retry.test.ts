import { withRetry } from "../src/utils/retry";

describe("withRetry", () => {
  it("returns result after transient failures", async () => {
    let n = 0;
    const result = await withRetry("test", async () => {
      n += 1;
      if (n < 2) throw new Error("fail");
      return 42;
    });
    expect(result).toBe(42);
    expect(n).toBe(2);
  });
});
