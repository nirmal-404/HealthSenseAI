import { SessionPipelineService } from "../src/service/sessionPipelineService";
import { SessionRepository } from "../src/repositories/sessionRepository";
import { SUMMARY_STATUS, EVENT_CHANNELS } from "../src/constants";

describe("SessionPipelineService", () => {
  it("marks skipped when no recording URL", async () => {
    const repo = {
      findBySessionId: jest.fn().mockResolvedValue({
        sessionId: "s1",
        doctorId: "d1",
        patientId: "p1",
        recordingUrl: undefined,
      }),
      updateBySessionId: jest.fn().mockResolvedValue({}),
    } as unknown as SessionRepository;
    const events = { publish: jest.fn().mockResolvedValue(undefined) };
    const pipeline = new SessionPipelineService(
      repo,
      { transcribeFromUrl: jest.fn() },
      { generateSoapNote: jest.fn() },
      events,
    );
    await pipeline.run("s1");
    expect(repo.updateBySessionId).toHaveBeenCalledWith(
      "s1",
      expect.objectContaining({ summaryStatus: SUMMARY_STATUS.SKIPPED }),
    );
    expect(events.publish).toHaveBeenCalledWith(
      EVENT_CHANNELS.SESSION_SUMMARIZED,
      expect.objectContaining({ sessionId: "s1" }),
    );
  });
});
