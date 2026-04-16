import type { SoapNote } from "../models/Session";

export interface ITranscriptionService {
  transcribeFromUrl(audioUrl: string): Promise<string>;
}

export interface ISummaryService {
  generateSoapNote(transcript: string): Promise<SoapNote>;
}

export interface IEventPublisher {
  publish(channel: string, payload: unknown): Promise<void>;
}
