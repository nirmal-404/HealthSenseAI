import { interrupt } from "@langchain/langgraph";

export function awaitAnswersNode(state: any) {

    const answers = interrupt({
        followUpQuestions: state.followUpQuestions,
        message: "Please answer the follow-up questions to receive a refined assessment.",
    });

    return { followUpAnswers: answers };
}