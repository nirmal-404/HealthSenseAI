import { SUMMARY_STATUS, EVENT_CHANNELS } from "../constants";
import { SessionRepository } from "../repositories/sessionRepository";
import { logger } from "../utils/logger";
import type {
  IEventPublisher,
  ISummaryService,
  ITranscriptionService,
} from "./interfaces";

/**
 * Post-session transcription and SOAP summarization pipeline.
 */
export class SessionPipelineService {
  constructor(
    private readonly repo: SessionRepository,
    private readonly transcription: ITranscriptionService,
    private readonly summary: ISummaryService,
    private readonly events: IEventPublisher,
  ) {}

  /** Runs async summarization for a completed session. */
  async run(sessionId: string): Promise<void> {
    const session = await this.repo.findBySessionId(sessionId);
    if (!session) return;
    if (!session.recordingUrl) {
      await this.repo.updateBySessionId(sessionId, {
        summaryStatus: SUMMARY_STATUS.SKIPPED,
      });
      await this.events.publish(EVENT_CHANNELS.SESSION_SUMMARIZED, {
        sessionId,
        doctorId: session.doctorId,
        patientId: session.patientId,
        status: SUMMARY_STATUS.SKIPPED,
      });
      return;
    }

    await this.repo.updateBySessionId(sessionId, {
      summaryStatus: SUMMARY_STATUS.PROCESSING,
    });

    try {
      const text = await this.transcription.transcribeFromUrl(
        session.recordingUrl,
      );
      const soap = await this.summary.generateSoapNote(text);
      await this.repo.updateBySessionId(sessionId, {
        transcript: text,
        soapNote: soap,
        summaryStatus: SUMMARY_STATUS.COMPLETED,
        summaryError: undefined,
      });
      await this.events.publish(EVENT_CHANNELS.SESSION_SUMMARIZED, {
        sessionId,
        doctorId: session.doctorId,
        patientId: session.patientId,
        urgencyLevel: soap.urgencyLevel,
        status: SUMMARY_STATUS.COMPLETED,
      });
    } catch (e) {
      logger.error("Session pipeline failed", { sessionId, err: String(e) });
      await this.repo.updateBySessionId(sessionId, {
        summaryStatus: SUMMARY_STATUS.FAILED,
        summaryError: String((e as Error)?.message || e),
      });
      await this.events.publish(EVENT_CHANNELS.SESSION_SUMMARIZED, {
        sessionId,
        doctorId: session.doctorId,
        patientId: session.patientId,
        status: SUMMARY_STATUS.FAILED,
      });
    }
  }
}
