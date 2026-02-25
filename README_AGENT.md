# Parts & Labor Agent Implementation

This directory contains the implementation of the "Autonomous Service Advisor" agent for Gearbox.

## Overview

The agent is designed to:
1.  Monitor new jobs created in the system.
2.  Analyze the job description and vehicle information.
3.  Query the `standard_price_list` for labor estimation.
4.  Look up parts in the local inventory.
5.  Generate a draft quote and save it to `agent_draft_quotes`.
6.  Update the job status to `AWAITING_APPROVAL`.

## Setup

### 1. Environment Variables

You must add your OpenAI API Key to the `.env` file:

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. Database Migration

The database schema has been updated. If you are setting this up on a fresh machine, ensure migrations are applied:

```bash
# Apply migrations manually if needed (safe for existing data)
npx tsx scripts/manual-migration.ts
```

### 3. Seed Data (Recommended)

To populate the `standard_price_list` with common services (Oil Change, Brakes, WOF, etc.), run:

```bash
npx tsx scripts/seed-standard-prices.ts
```

### 4. Dependencies

The following packages were installed:
- `@langchain/openai`
- `@langchain/langgraph`
- `@langchain/core`
- `zod`

## Usage

### User Interface 🚀
Go to any Job Detail page. You will see a new **Autonomous Advisor** panel.
- Shows real-time status (`ANALYZING`, `QUOTING`, etc.).
- Click **"Run Auto-Quote"** to manually trigger the agent for that job.

### Automatic Trigger
The agent is automatically triggered when a new job is created via the TRPC API (`job.create`) if the status is `NEW`.

### Manual Trigger (API)
You can manually trigger the agent for an existing job via the new TRPC endpoint:
`client.agent.trigger({ jobId: 123 })`

Test this with:
```bash
npx tsx scripts/test-manual-trigger.ts
```

### Test Script
You can create a dummy job and trigger the agent in one go:
```bash
npx tsx scripts/test-agent.ts
```

## Files Created/Modified

-   `src/agents/parts-labor-agent.ts`: Main agent logic (LangGraph).
-   `src/agents/tools/standard-prices.ts`: Tool for labor lookup.
-   `src/agents/tools/parts-lookup.ts`: Tool for parts lookup.
-   `src/server/automations.ts`: Event listener to trigger the agent.
-   `src/server/routers.ts`: Updated with `agent.trigger` router.
-   `src/pages/JobDetail.tsx`: Updated with `AgentControlPanel` UI.
-   `scripts/manual-migration.ts`: Database migration script.
-   `scripts/seed-standard-prices.ts`: Data seeding script.
-   `scripts/test-agent.ts`: Verification script.
-   `scripts/test-manual-trigger.ts`: Manual trigger verification script.

## Database Changes

-   Modified `jobs`: Added `agentStatus`.
-   New Table `agent_tasks`: Tracks agent lifecycle.
-   New Table `standard_price_list`: Lookup table for labor rates.
-   New Table `agent_draft_quotes`: Stores generated JSON quotes.
