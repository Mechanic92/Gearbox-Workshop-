import 'dotenv/config';
import { db } from '../src/lib/db.js';
import * as schema from '../src/lib/schema.js';

async function seedAI() {
  try {
    console.log('Seeding AI actions...');
    const actions = [
      {
        ledgerId: 1,
        type: 'Inventory',
        action: 'Autonomous Stock Analysis',
        result: 'Identified 4 imminent shortages. Prepared draft PO for BNT Parts Hub.',
        impact: 'high',
        confidence: 0.98
      },
      {
        ledgerId: 1,
        type: 'Communication',
        action: 'Client Pulse Sentiment',
        result: 'Analyzed 15 recent job feedbacks. 92% positive traction. Dispatched "Thank You" tokens to top 3 advocates.',
        impact: 'low',
        confidence: 0.92
      },
      {
        ledgerId: 1,
        type: 'Financial',
        action: 'Yield Optimization',
        result: 'Detected 4.2% margin leakage on small-engine labor. Proposing rate pivot for March.',
        impact: 'medium',
        confidence: 0.88
      }
    ];

    for (const action of actions) {
        await db.insert(schema.autonomousActions).values(action as any);
    }
    console.log('DONE');
  } catch (err) {
    console.error('Seed failed:', err);
  }
}

seedAI();
