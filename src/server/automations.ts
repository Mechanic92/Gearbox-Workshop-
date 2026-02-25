import { eventBus, EVENTS, JobStatusChangedEvent } from '../lib/events/index.js';
import * as db from '../lib/db.js';
import { runPartsLaborAgent } from '../agents/parts-labor-agent.js';
// import { sendEmail } from '../lib/notifications/email';
// import { sendSMS } from '../lib/notifications/sms';

/**
 * Autonomous Automation Engine
 * 
 * Directs the flow of communications and system updates 
 * based on platform events.
 */

export function initializeAutomations() {
    console.log("🤖 [Automation Engine] Initializing Operational Loops...");

    // 1. Job Status Change Automations
    eventBus.on(EVENTS.JOB_STATUS_CHANGED, async (event: JobStatusChangedEvent) => {
        console.log(`📡 [Automation] Job ${event.jobNumber} status transitioned to ${event.newStatus}`);
        
        // Automated notification logic
        if (event.newStatus === 'COMPLETED') {
            await handleJobCompletion(event);
        } else if (event.newStatus === 'WAITING_APPROVAL') {
            await handleApprovalRequest(event);
        }
    }); 
    
    // 1b. New Job Created -> Trigger Agent
    eventBus.on(EVENTS.JOB_STATUS_CHANGED, async (event: JobStatusChangedEvent) => {
        if (event.newStatus === 'NEW' || (event.oldStatus === 'NONE' && event.newStatus === 'NEW')) {
            console.log(`🤖 [Automation] Specific Trigger: New Job ${event.jobNumber} detected. starting Parts & Labor Agent...`);
            // Fire and forget - don't block the event loop
            runPartsLaborAgent(event.jobId).catch(err => 
                console.error(`❌ [Agent Error] Failed to run for Job ${event.jobId}:`, err)
            );
        }
    });

    // 2. DVI Ready Automations
    eventBus.on(EVENTS.DVI_READY, async (event: any) => {
        console.log(`📋 [Automation] DVI ${event.inspectionNumber} initialized. Generating shareable link...`);
    });
}

async function handleJobCompletion(event: JobStatusChangedEvent) {
    try {
        // Fetch customer details
        if (event.customerId) {
            const customer = await db.getCustomerById(event.customerId);
            if (customer?.email) {
                console.log(`📧 [Automation] Queueing Job Completion Receipt for ${customer.name}`);
                // In production, we would call sendEmail here
            }
        }
    } catch (error) {
        console.error("❌ [Automation Error] handleJobCompletion:", error);
    }
}

async function handleApprovalRequest(event: JobStatusChangedEvent) {
    try {
        if (event.customerId) {
            const customer = await db.getCustomerById(event.customerId);
            if (customer) {
                console.log(`📱 [Automation] Dispatching Approval Request Link to ${customer.name}`);
                // Simulate SMS/Email dispatch
            }
        }
    } catch (error) {
        console.error("❌ [Automation Error] handleApprovalRequest:", error);
    }
}
