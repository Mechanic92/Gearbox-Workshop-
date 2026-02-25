import { StateGraph, END, START } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage, BaseMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import { standardPriceTool } from "./tools/standard-prices.js";
import { partsLookupTool } from "./tools/parts-lookup.js";
import { db } from "../lib/db.js";
import { jobs, agentTasks, agentDraftQuotes, parts } from "../lib/schema.js";
import { eq } from "drizzle-orm";
import { ToolExecutor } from "@langchain/langgraph/prebuilt";

// Define the Agent State
interface AgentState {
  jobId: number;
  ledgerId: number;
  jobDescription: string;
  vehicleInfo: string;
  messages: BaseMessage[];
  quoteDraft: {
    labor: { description: string; hours: number; rate: number; total: number }[];
    parts: { description: string; partId?: number; price: number; quantity: number; total: number; source: string }[];
    total: number;
  } | null;
  status: "processing" | "complete" | "failed";
  error?: string;
  [key: string]: any;
}

// 1. Initialize Tools and Model
const tools = [standardPriceTool, partsLookupTool];
const toolExecutor = new ToolExecutor({ tools });

const model = new ChatOpenAI({ 
    modelName: "gpt-4-turbo-preview", 
    temperature: 0,
    apiKey: process.env.OPENAI_API_KEY 
}).bindTools(tools);

// 2. Define Nodes

// Node: Analysis - figures out what needs to be done
async function analyzeJob(state: AgentState) {
  const { jobDescription, vehicleInfo, messages } = state;
  const sysMsg = new SystemMessage(`
    You are an expert Automotive Service Advisor Agent.
    Your goal is to analyze a job description and vehicle info to determine the necessary parts and labor.
    
    Job Description: ${jobDescription}
    Vehicle: ${vehicleInfo}
    
    1. Identify the services requested (e.g., "Oil Change", "Brake Job").
    2. Identify potential parts needed.
    3. Use the available tools to lookup 'standard prices' for labor and 'parts' for components.
    4. If you call 'standard_prices', use 'Oil Change Service' or similar relevant services.
    
    If you have enough information to generate a quote, output a final JSON structure.
    If you need to look up information, call the appropriate tools.
  `);

  const response = await model.invoke([sysMsg, ...messages]);
  return { messages: [response] };
}

// Node: Run Tools
async function runTools(state: AgentState) {
    const lastMessage = state.messages[state.messages.length - 1];
    const toolCalls = (lastMessage as any).tool_calls || [];
    
    const results = await Promise.all(toolCalls.map(async (call: any) => {
        const output = await toolExecutor.invoke(call);
        return new ToolMessage({
            tool_call_id: call.id,
            content: String(output)
        });
    }));
    
    return { messages: results };
}

// 3. Define Graph Configuration with explicit ANY cast to bypass strict typing issues
const workflow = new StateGraph<AgentState>({
    channels: {
        jobId: { reducer: (x: any, y: any) => y ?? x ?? 0, default: () => 0 },
        ledgerId: { reducer: (x: any, y: any) => y ?? x ?? 0, default: () => 0 },
        jobDescription: { reducer: (x: any, y: any) => y ?? x ?? "", default: () => "" },
        vehicleInfo: { reducer: (x: any, y: any) => y ?? x ?? "", default: () => "" },
        messages: { reducer: (x: any, y: any) => (x ?? []).concat(y ?? []), default: () => [] },
        quoteDraft: { reducer: (x: any, y: any) => y ?? x, default: () => null },
        status: { reducer: (x: any, y: any) => y ?? x, default: () => "processing" },
        error: { reducer: (x: any, y: any) => y ?? x, default: () => undefined },
    }
} as any);

// Define logic to decide next step
function shouldContinue(state: AgentState) {
  const lastMessage = state.messages[state.messages.length - 1];
  
  if ((lastMessage as any).tool_calls && (lastMessage as any).tool_calls.length > 0) {
    return "tools";
  }
  return END;
}

(workflow as any).addNode("agent", analyzeJob);
(workflow as any).addNode("tools", runTools);

(workflow as any).addEdge(START, "agent");
(workflow as any).addEdge("tools", "agent");
(workflow as any).addConditionalEdges("agent", shouldContinue);

const app = workflow.compile();

// 5. Deterministic Agent (No LLM Fallback)
async function runDeterministicAgent(jobId: number, job: any, task: any) {
    console.log(`OpenAI API Key missing. Running deterministic fallback for Job ${jobId}`);
    
    // Simple keyword analysis
    const desc = job.description.toLowerCase();
    
    // 1. Labor Lookup
    const labor = [];
    if (desc.includes("oil") || desc.includes("service")) {
        // Query standard price list with partial match
        const prices = await db.query.standardPriceList.findMany({
            where: (t, { like, and, eq }) => and(
                eq(t.ledgerId, job.ledgerId),
                like(t.serviceName, "%Oil%")
            ),
            limit: 1
        });
        if (prices.length > 0) {
            labor.push({
                description: prices[0].serviceName,
                hours: prices[0].baseLaborHours,
                rate: prices[0].hourlyRate,
                total: prices[0].baseLaborHours * prices[0].hourlyRate
            });
        } else {
             labor.push({ description: "Standard Service (Est)", hours: 1, rate: 100, total: 100 });
        }
    }
    
    // Fallback if nothing found
    let confidence = 0.9;
    if (labor.length === 0) {
        labor.push({ description: "General Diagnosis", hours: 1, rate: 120, total: 120 });
        confidence = 0.5;
    }

    // 2. Parts Lookup (Mock)
    const partsList = [];
    if (desc.includes("oil")) {
        partsList.push({ description: "Premium Oil Filter", quantity: 1, price: 25.00, total: 25.00 });
        partsList.push({ description: "Synthetic Oil (5L)", quantity: 1, price: 85.00, total: 85.00 });
    }

    // Construct the Quote JSON
    const quoteData = {
        labor,
        parts: partsList,
        total: labor.reduce((acc: number, l: any) => acc + l.total, 0) + partsList.reduce((acc: number, p: any) => acc + p.total, 0),
        summary: "Generated via Offline Auto-Advisor (Keywords Detected)"
    };

    // Save
    await db.insert(agentDraftQuotes).values({
        jobId,
        taskId: task.id,
        quoteData: JSON.stringify(quoteData),
        status: "DRAFT",
        confidenceScore: confidence,
        agentNotes: "Generated in Offline Mode (No API Key). Logic based on keywords.",
    });

    await db.update(agentTasks).set({
        status: "COMPLETED",
        resultSummary: "Offline Quote Generated",
        updatedAt: new Date(),
    }).where(eq(agentTasks.id, task.id));

    await db.update(jobs).set({
        agentStatus: "AWAITING_APPROVAL",
    }).where(eq(jobs.id, jobId));
}

// 4. Main Exported Function called by Triggers
export async function runPartsLaborAgent(jobId: number) {
  console.log(`Starting Agent for Job ${jobId}`);
  
  // 1. Fetch Job Data
  const job: any = await db.query.jobs.findFirst({
    where: eq(jobs.id, jobId),
    with: {
        vehicle: true,
        customer: true,
    } as any
  });

  if (!job) {
    console.error(`Job ${jobId} not found`);
    return;
  }

  // 2. Create AgentTask record
  // Check if a task already exists for this job in pending state to reuse or fail? 
  // For now create new.
  const [task] = await db.insert(agentTasks).values({
    jobId,
    status: "ANALYZING",
    currentStep: "Initializing",
  }).returning();

  // 3. Prepare State OR Run Deterministic
  if (!process.env.OPENAI_API_KEY) {
      await runDeterministicAgent(jobId, job, task);
      return;
  }

  const initialState: AgentState = {
    jobId,
    ledgerId: job.ledgerId,
    jobDescription: job.description,
    vehicleInfo: job.vehicle ? `${job.vehicle.year} ${job.vehicle.make} ${job.vehicle.model}` : "Unknown Vehicle",
    messages: [new HumanMessage(`Please create a quote for this job: ${job.description}`)],
    quoteDraft: null,
    status: "processing",
  };

  try {
    // 4. Run Graph
    // Cast app to any to define invoke method type implicitly/loosely
    const result = await (app as any).invoke(initialState);
    
    // 5. Parse Final Output
    const lastMsg = result.messages[result.messages.length - 1];
    const content = typeof lastMsg.content === 'string' ? lastMsg.content : JSON.stringify(lastMsg.content);
    
    // Heuristic: Extract JSON from markdown block if present
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || [null, content];
    let quoteData = {};
    try {
        quoteData = JSON.parse(jsonMatch[1] || content);
    } catch (e) {
        quoteData = { raw_output: content, error: "Failed to parse JSON" };
    }

    // 6. Save Draft Quote
    await db.insert(agentDraftQuotes).values({
        jobId,
        taskId: task.id,
        quoteData: JSON.stringify(quoteData),
        status: "DRAFT",
        confidenceScore: 0.85, 
        agentNotes: "Generated by Parts & Labor Agent",
    });

    // 7. Update Task & Job Status
    await db.update(agentTasks).set({
        status: "COMPLETED",
        resultSummary: "Quote generated successfully",
        updatedAt: new Date(),
    }).where(eq(agentTasks.id, task.id));

    await db.update(jobs).set({
        agentStatus: "AWAITING_APPROVAL",
    }).where(eq(jobs.id, jobId));

    console.log("Agent finished successfully");

  } catch (err: any) {
    console.error("Agent failed", err);
    await db.update(agentTasks).set({
        status: "FAILED",
        error: err.message,
        updatedAt: new Date(),
    }).where(eq(agentTasks.id, task.id));
    
    await db.update(jobs).set({
        agentStatus: "FAILED",
    }).where(eq(jobs.id, jobId));
  }
}
