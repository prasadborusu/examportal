import { supabase, isSupabaseConfigured } from './supabase.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORE_FILE = path.resolve(__dirname, '../data/store.json');

async function seedSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    console.error('❌ Supabase credentials are not configured in server/.env');
    process.exit(1);
  }

  console.log('🔄 Checking Supabase connection and tables...');

  // Test table existence
  const { error: testError } = await supabase.from('exams').select('id').limit(1);
  if (testError) {
    console.error('\n❌ Could not find tables in Supabase:', testError.message);
    console.error('\n👉 Please run the SQL file in your Supabase Dashboard:');
    console.error('   1. Open: https://supabase.com/dashboard/project/uglvofhlqjmpqclzvivi/sql');
    console.error('   2. Paste the contents of: supabase_schema.sql');
    console.error('   3. Click "Run"\n');
    process.exit(1);
  }

  console.log('✅ Supabase tables verified!');

  // Check if exams already seeded
  const { data: existingExams } = await supabase.from('exams').select('id');
  if (existingExams && existingExams.length > 0) {
    console.log(`ℹ️ Supabase already has ${existingExams.length} exam(s). No seeding needed.`);
    process.exit(0);
  }

  console.log('📦 Seeding default exam, questions, and test cases to Supabase...');

  const store = JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8'));

  if (store.exams && store.exams.length > 0) {
    const { error: examErr } = await supabase.from('exams').insert(store.exams);
    if (examErr) console.error('Error inserting exams:', examErr.message);
    else console.log(`✅ Seeded ${store.exams.length} exam(s)`);
  }

  if (store.questions && store.questions.length > 0) {
    const { error: qErr } = await supabase.from('questions').insert(store.questions);
    if (qErr) console.error('Error inserting questions:', qErr.message);
    else console.log(`✅ Seeded ${store.questions.length} question(s)`);
  }

  if (store.testCases && store.testCases.length > 0) {
    const { error: tcErr } = await supabase.from('test_cases').insert(store.testCases);
    if (tcErr) console.error('Error inserting test cases:', tcErr.message);
    else console.log(`✅ Seeded ${store.testCases.length} test case(s)`);
  }

  console.log('🎉 Supabase database seeding complete!');
}

seedSupabase().catch((err) => {
  console.error('Unexpected seeding error:', err);
  process.exit(1);
});
