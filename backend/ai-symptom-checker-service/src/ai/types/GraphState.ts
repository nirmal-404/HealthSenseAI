export type GraphState = {
    rawInput: string;
    additionalContext: any;

    symptoms: any[];
    extractionConfidence: number;

    overallSeverity: any;
    urgencyLevel: any;
    aiSuggestions: any;
    recommendedSpecialties: any[];
    followUpQuestions: any[];

    processingTimeMs: number;
};