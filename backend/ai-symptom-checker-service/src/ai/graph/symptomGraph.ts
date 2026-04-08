import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { extractSymptomsNode } from "../nodes/extractSymptoms";
import { analyzeSymptomsNode } from "../nodes/analyzeSymptoms";

type GraphState = {
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

const graphChannels = Annotation.Root({
  rawInput: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),

  additionalContext: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),

  symptoms: Annotation<any[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),

  extractionConfidence: Annotation<number>({
    reducer: (x, y) => y ?? x,
    default: () => 1,
  }),

  overallSeverity: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),

  urgencyLevel: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),

  aiSuggestions: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),

  recommendedSpecialties: Annotation<any[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),

  followUpQuestions: Annotation<any[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),

  processingTimeMs: Annotation<number>({
    reducer: (x, y) => y ?? x,
    default: () => 0,
  }),
});

const workflow = new StateGraph(graphChannels)
  .addNode("extractSymptoms", extractSymptomsNode)
  .addNode("analyzeSymptoms", analyzeSymptomsNode)
  .addEdge(START, "extractSymptoms")
  .addEdge("extractSymptoms", "analyzeSymptoms")
  .addEdge("analyzeSymptoms", END);

export const symptomGraph = workflow.compile();