import { AssemblyAI } from "assemblyai";
import { CONFIG } from "../config/envConfig";
import { withRetry } from "../utils/retry";
import type { ITranscriptionService } from "./interfaces";

/**
 * AssemblyAI-backed transcription implementation.
 */
export class AssemblyaiTranscriptionService implements ITranscriptionService {
  private readonly client: AssemblyAI;

  constructor(apiKey = CONFIG.ASSEMBLYAI_API_KEY) {
    this.client = new AssemblyAI({ apiKey });
  }

  /** Transcribes remote audio URL to plain text. */
  async transcribeFromUrl(audioUrl: string): Promise<string> {
    return withRetry("assemblyai.transcribe", async () => {
      const transcript = await this.client.transcripts.transcribe({
        audio: audioUrl,
      });
      const text = transcript.text;
      if (!text) throw new Error("Empty transcript");
      return text;
    });
  }
}
