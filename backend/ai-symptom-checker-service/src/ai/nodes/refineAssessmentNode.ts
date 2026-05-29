import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { analysisModel } from "../models/geminiModels";
import { safeParseJSON } from "../utils/jsonUtils";
import { REFINEMENT_SYSTEM_PROMPT } from "../prompts/refinementPrompt";
import { extractTextContent } from "../utils/llmUtils";

export async function refineAssessmentNode(state: any) {
    const start = Date.now();

    const symptomsText = state.symptoms
        .map((s: any) => `- ${s.name}: ${s.duration.value} ${s.duration.unit} (${s.severity})`)
        .join("\n");

    const answersText = (state.followUpAnswers || [])
        .map((a: any) => `Q: ${a.question}\nA: ${a.answer}`)
        .join("\n\n");

    const response = await analysisModel.invoke([
        new SystemMessage(REFINEMENT_SYSTEM_PROMPT),
        new HumanMessage(
            `Original symptoms:\n${symptomsText}\n\nInitial assessment:\n` +
            `- Severity: ${state.overallSeverity}\n` +
            `- Urgency: ${state.urgencyLevel}\n` +
            `- Suggestions: ${state.aiSuggestions}\n\n` +
            `Follow-up Q&A:\n${answersText}`
        ),
    ]);

    const rawText = extractTextContent(response.content);

    const parsed = safeParseJSON(rawText, "clinical analysis");

    return {
        overallSeverity: parsed.overallSeverity,
        urgencyLevel: parsed.urgencyLevel,
        aiSuggestions: parsed.aiSuggestions,
        recommendedSpecialties: parsed.recommendedSpecialties || [],
        processingTimeMs: (state.processingTimeMs || 0) + (Date.now() - start)
    };
}