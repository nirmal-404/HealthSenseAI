import { v4 as uuidv4 } from "uuid";
import SymptomCheck from "../models/SymptomCheck";
import { startSymptomPipeline, resumeSymptomPipeline } from "../ai/graph/symptomGraph";

export const checkSymptomsService = async (input: {
    rawInput: string;
    additionalContext?: string;
    patientId: string;
}) => {
    const threadId = uuidv4();

    const result = await startSymptomPipeline({
        rawInput: input.rawInput,
        additionalContext: input.additionalContext,
        threadId
    });

    const check = await SymptomCheck.create({
        patientId: input.patientId,
        threadId,
        rawInput: input.rawInput,
        status: "pending_answers",
        symptoms: result.symptoms,
        overallSeverity: result.overallSeverity,
        urgencyLevel: result.urgencyLevel,
        aiSuggestions: result.aiSuggestions,
        recommendedSpecialties: result.recommendedSpecialties,
        followUpQuestions: result.followUpQuestions,
        metadata: {
            modelUsed: "gemini-1.5-pro",
            extractionConfidence: result.extractionConfidence,
        },
    });

    return check;
}

export const answerFollowUpQuestionsService = async (
    { checkId, patientId, followUpAnswers }
        : { checkId: string, patientId: string, followUpAnswers: any }
) => {
    const check = await SymptomCheck.findById(checkId);

    if (!check)
        throw Object.assign(new Error("Not found."), { statusCode: 404 });
    // if (check.patientId.toString() !== patientId.toString())
    //     throw Object.assign(new Error("Forbidden."), { statusCode: 403 });
    if (check.status === "completed")
        throw Object.assign(new Error("This check is already completed."), { statusCode: 409 });

    const refined = await resumeSymptomPipeline({
        threadId: check.threadId!,
        followUpAnswers,
    });

    Object.assign(check, {
        status: "completed",
        overallSeverity: refined.overallSeverity,
        urgencyLevel: refined.urgencyLevel,
        aiSuggestions: refined.aiSuggestions,
        recommendedSpecialties: refined.recommendedSpecialties,
        followUpAnswers: followUpAnswers,
    });

    await check.save();
    return check;
}