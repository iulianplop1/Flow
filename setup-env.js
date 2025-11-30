// Quick setup script to create .env file
// Run: node setup-env.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envContent = `VITE_SUPABASE_URL=https://pwlybloxddlltolduwok.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bHlibG94ZGRsbHRvbGR1d29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNzcxMTgsImV4cCI6MjA3OTk1MzExOH0.J-dEpLqj13PZfSkirNKc61XbOUzGvIVFgfdkrUckIyM
VITE_GEMINI_API_KEY=AIzaSyCv9ADJ81Pt-_tV54HszYyHoiaA_0cTmoc
`;

const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envPath)) {
  console.log('⚠️  .env file already exists. Skipping creation.');
  console.log('If you want to overwrite, delete .env and run this script again.');
} else {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Install dependencies: npm install');
  console.log('2. Deploy Supabase Edge Functions (see DEPLOYMENT.md)');
  console.log('3. Run the app: npm run dev');
}

