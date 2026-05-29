import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { analysisModel } from "../models/geminiModels";
import { ANALYSIS_SYSTEM_PROMPT } from "../prompts/analysisPrompt";
import { safeParseJSON } from "../utils/jsonUtils";
import { extractTextContent } from "../utils/llmUtils";

export async function analyzeSymptomsNode(state: any) {
    const start = Date.now();

    const symptomsText = state.symptoms
        .map(
            (s: any) =>
                `- ${s.name}: ${s.duration.value} ${s.duration.unit} (${s.severity})`
        )
        .join("\n");

    const response = await analysisModel.invoke([
        new SystemMessage(ANALYSIS_SYSTEM_PROMPT),
        new HumanMessage(`Patient symptoms:\n${symptomsText}`),
    ]);

    const rawText = extractTextContent(response.content);

    const parsed = safeParseJSON(rawText, "clinical analysis");

    return {
        ...state,
        overallSeverity: parsed.overallSeverity,
        urgencyLevel: parsed.urgencyLevel,
        aiSuggestions: parsed.aiSuggestions,
        recommendedSpecialties: parsed.recommendedSpecialties || [],
        followUpQuestions: parsed.followUpQuestions || [],
        processingTimeMs: (state.processingTimeMs || 0) + (Date.now() - start),
    };
}