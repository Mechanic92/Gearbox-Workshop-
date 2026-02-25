import 'dotenv/config';
import { initializeDatabase } from '../src/lib/db-init.js';

async function repair() {
  try {
    console.log('Running database repair/init...');
    await initializeDatabase();
    console.log('DONE');
  } catch (err) {
    console.error('Repair failed:', err);
  }
}

repair();
