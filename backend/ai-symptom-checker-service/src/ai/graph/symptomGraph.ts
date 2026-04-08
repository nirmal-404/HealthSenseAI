import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { extractSymptomsNode } from "../nodes/extractSymptomsNode";
import { analyzeSymptomsNode } from "../nodes/analyzeSymptomsNode";
import { awaitAnswersNode } from "../nodes/awaitAnswersNode";
import { refineAssessmentNode } from "../nodes/refineAssessmentNode";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";
import { MongoClient } from "mongodb";
import { CONFIG } from "../../config/envConfig";

const graphChannels = Annotation.Root({
  rawInput: Annotation<string>({ reducer: (x, y) => y ?? x, default: () => "", }),
  additionalContext: Annotation<any>({ reducer: (x, y) => y ?? x, default: () => null, }),
  symptoms: Annotation<any[]>({ reducer: (x, y) => y ?? x, default: () => [], }),
  extractionConfidence: Annotation<number>({ reducer: (x, y) => y ?? x, default: () => 1, }),
  overallSeverity: Annotation<any>({ reducer: (x, y) => y ?? x, default: () => null, }),
  urgencyLevel: Annotation<any>({ reducer: (x, y) => y ?? x, default: () => null, }),
  aiSuggestions: Annotation<any>({ reducer: (x, y) => y ?? x, default: () => null, }),
  recommendedSpecialties: Annotation<any[]>({ reducer: (x, y) => y ?? x, default: () => [], }),
  followUpQuestions: Annotation<any[]>({ reducer: (x, y) => y ?? x, default: () => [], }),
  processingTimeMs: Annotation<number>({ reducer: (x, y) => y ?? x, default: () => 0, }),
});

const workflow = new StateGraph(graphChannels)
  .addNode("extractSymptoms", extractSymptomsNode)
  .addNode("analyzeAndAsk", analyzeSymptomsNode)
  .addNode("awaitAnswers", awaitAnswersNode)
  .addNode("refineAssessment", refineAssessmentNode)
  .addEdge(START, "extractSymptoms")
  .addEdge("extractSymptoms", "analyzeAndAsk")
  .addEdge("analyzeAndAsk", "awaitAnswers")
  .addEdge("awaitAnswers", "refineAssessment")
  .addEdge("refineAssessment", END);

let checkpointer: any;
async function getCheckpointer() {
  if (checkpointer) return checkpointer;
  const client = new MongoClient(CONFIG.MONGO_URI);
  await client.connect();
  checkpointer = new MongoDBSaver({
    client: client as any,
    dbName: "symptom-checker",
  });
  return checkpointer;
}

async function buildGraph() {
  const cp = await getCheckpointer();
  return workflow.compile({ checkpointer: cp, interruptBefore: ["awaitAnswers"] });
}

let compiledGraph: any;
async function getGraph() {
  if (!compiledGraph) compiledGraph = await buildGraph();
  return compiledGraph;
}

export async function startSymptomPipeline(
  { rawInput, additionalContext, threadId }:
    { rawInput: string; additionalContext?: string; threadId: string; }
) {
  const graph = await getGraph();

  const config = { configurable: { thread_id: threadId } };

  const result = await graph.invoke(
    { rawInput, additionalContext },
    config
  );

  return {
    symptoms: result.symptoms,
    followUpQuestions: result.followUpQuestions,
    overallSeverity: result.overallSeverity,
    urgencyLevel: result.urgencyLevel,
    aiSuggestions: result.aiSuggestions,
    recommendedSpecialties: result.recommendedSpecialties,
    extractionConfidence: result.extractionConfidence,
  };
}

export async function resumeSymptomPipeline(
  { threadId, followUpAnswers }:
    { threadId: string, followUpAnswers: any }
) {
  const graph = await getGraph();
  const config = { configurable: { thread_id: threadId } };

  const result = await graph.invoke(
    { followUpAnswers },
    config
  );

  return {
    symptoms: result.symptoms,
    overallSeverity: result.overallSeverity,
    urgencyLevel: result.urgencyLevel,
    aiSuggestions: result.aiSuggestions,
    recommendedSpecialties: result.recommendedSpecialties,
    followUpAnswers: result.followUpAnswers,
    extractionConfidence: result.extractionConfidence,
  };
}
