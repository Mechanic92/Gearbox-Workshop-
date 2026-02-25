import 'dotenv/config';
import { db } from '../src/lib/db.js';
import { jobs } from '../src/lib/schema.js';
import { count } from 'drizzle-orm';

async function inspect() {
    try {
        const result = await db.select({ value: count() }).from(jobs);
        console.log(`Total Jobs: ${result[0].value}`);
        
        const latest = await db.select().from(jobs).orderBy(jobs.createdAt).limit(5);
        console.log('Latest 5 jobs:');
        console.log(JSON.stringify(latest, null, 2));
    } catch (err) {
        console.error(err);
    }
}

inspect();
