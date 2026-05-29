import { v4 as uuidv4 } from "uuid";
import SymptomCheck from "../models/SymptomCheck";
import { startSymptomPipeline, resumeSymptomPipeline } from "../ai/graph/symptomGraph";
import httpStatus from "http-status"
import { ApiError } from "../utils/ApiError";

export const checkSymptomsService = async (input: {
    rawInput: string; additionalContext?: string; patientId: string;
}) => {
    try {
        const threadId = uuidv4();

        const data = {
            rawInput: input.rawInput,
            additionalContext: input.additionalContext,
            threadId
        }
        const result = await startSymptomPipeline(data);

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
    } catch (error: any) {
        console.error(error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Server error');
    }
}

export const answerFollowUpQuestionsService = async (input: {
    checkId: string, patientId: string, followUpAnswers: any
}) => {
    try {
        const check = await SymptomCheck.findById(input.checkId);

        if (!check)
            throw new ApiError(httpStatus.NOT_FOUND, "No check found");
        if (check.patientId.toString() !== input.patientId.toString())
            throw new ApiError(httpStatus.FORBIDDEN, "Forbidden");
        if (check.status === "completed")
            throw new ApiError(httpStatus.CONFLICT, "This check is already completed.");

        const data = {
            threadId: check.threadId!,
            followUpAnswers: input.followUpAnswers,
        }
        const refined = await resumeSymptomPipeline(data);

        Object.assign(check, {
            status: "completed",
            overallSeverity: refined.overallSeverity,
            urgencyLevel: refined.urgencyLevel,
            aiSuggestions: refined.aiSuggestions,
            recommendedSpecialties: refined.recommendedSpecialties,
            followUpAnswers: input.followUpAnswers,
        });

        await check.save();
        return check;
    } catch (error: any) {
        console.error(error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Server error');
    }
}

export const getUserHistoryService = async (patientId: string) => {
    try {
        const history = await SymptomCheck.find({ patientId }).sort({ createdAt: -1 });
        return history;
    } catch (error: any) {
        console.error(error);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Server error');
    }
}