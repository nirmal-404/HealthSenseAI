import Anthropic from "@anthropic-ai/sdk";
import { CONFIG } from "../config/envConfig";
import { soapNoteResponseSchema } from "../validations/sessionSchemas";
import { withRetry } from "../utils/retry";
import type { SoapNote } from "../models/Session";
import type { ISummaryService } from "./interfaces";

const SYSTEM = `You are a medical scribe. Given a doctor-patient consultation transcript, produce a structured SOAP note in JSON format with keys: subjective, objective, assessment, plan, followUpDate, urgencyLevel (low/medium/high). Output JSON only, no markdown.`;

/**
 * Claude-backed SOAP note generator.
 */
export class AnthropicSummaryService implements ISummaryService {
  private readonly client: Anthropic;

  constructor(apiKey = CONFIG.ANTHROPIC_API_KEY) {
    this.client = new Anthropic({ apiKey });
  }

  /** Produces a validated SOAP note object from transcript text. */
  async generateSoapNote(transcript: string): Promise<SoapNote> {
    return withRetry("anthropic.soap", async () => {
      const msg = await this.client.messages.create({
        model: CONFIG.CLAUDE_MODEL,
        max_tokens: 1024,
        system: SYSTEM,
        messages: [{ role: "user", content: transcript }],
      });
      const block = msg.content.find(
        (b: { type: string }) => b.type === "text",
      ) as { type: "text"; text: string } | undefined;
      if (!block || block.type !== "text") {
        throw new Error("No text from Claude");
      }
      const raw = block.text.trim();
      const jsonStart = raw.indexOf("{");
      const jsonEnd = raw.lastIndexOf("}");
      const slice =
        jsonStart >= 0 && jsonEnd > jsonStart
          ? raw.slice(jsonStart, jsonEnd + 1)
          : raw;
      const parsed = JSON.parse(slice);
      return soapNoteResponseSchema.parse(parsed);
    });
  }
}
