import 'dotenv/config';
import { db } from '../src/lib/db.js';
import * as schema from '../src/lib/schema.js';

async function checkUsers() {
  try {
    const users = await db.query.users.findMany();
    console.log('--- PRODUCTION USERS ---');
    console.log(JSON.stringify(users, null, 2));
    console.log('------------------------');
    
    if (users.length === 0) {
      console.log('EMPTY DATABASE: No users found.');
    }
  } catch (err) {
    console.error('Error checking users:', err);
  }
}

checkUsers();
