import express, { Express } from "express";
import routes from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import { SessionRepository } from "./repositories/sessionRepository";
import { SessionPipelineService } from "./service/sessionPipelineService";
import { SessionService } from "./service/sessionService";
import { AssemblyaiTranscriptionService } from "./service/assemblyaiTranscriptionService";
import { AnthropicSummaryService } from "./service/anthropicSummaryService";
import { RedisEventPublisher } from "./events/redisPublisher";

/**
 * Builds the Express application with injected domain services.
 */
export function createApp(): Express {
  const app = express();
  app.use(express.json());

  const repo = new SessionRepository();
  const events = new RedisEventPublisher();
  const transcription = new AssemblyaiTranscriptionService();
  const summary = new AnthropicSummaryService();
  const pipeline = new SessionPipelineService(
    repo,
    transcription,
    summary,
    events,
  );
  const sessionService = new SessionService(repo, pipeline, events);
  app.locals.sessionService = sessionService;

  app.use("/", routes);
  app.use(errorHandler);
  return app;
}
