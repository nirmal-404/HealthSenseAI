
import { symptomGraph } from "../ai/graph/symptomGraph";

export const checkSymptomsService = async (input: {
    rawInput: string;
    additionalContext?: string;
}) => {

    const result = symptomGraph.invoke({
        rawInput: input.rawInput,
        additionalContext: input.additionalContext || null,
    });

    return result
}