import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { extractionModel } from "../models/geminiModels";
import { EXTRACTION_SYSTEM_PROMPT } from "../prompts/extractionPrompt";
import { safeParseJSON } from "../utils/jsonUtils";
import { extractTextContent } from "../utils/llmUtils";

export async function extractSymptomsNode(state: any) {
    const start = Date.now();

    const response = await extractionModel.invoke([
        new SystemMessage(EXTRACTION_SYSTEM_PROMPT),
        new HumanMessage(state.rawInput),
    ]);

    const rawText = extractTextContent(response.content);

    const parsed = safeParseJSON(rawText, "symptom extraction");

    return {
        ...state,
        symptoms: parsed.symptoms || [],
        extractionConfidence: parsed.extractionConfidence ?? 0.8,
        processingTimeMs: (state.processingTimeMs || 0) + (Date.now() - start),
    };
}