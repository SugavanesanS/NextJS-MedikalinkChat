const fs = require("fs");
const path = require("path");

const environment = process.argv[2];

if (!environment) {
  console.error("❌ Please provide an environment name (e.g., 'dev', 'demo', 'prod').");
  process.exit(1);
}

// Copy .env.{env} -> .env.local
const envSource = path.resolve(__dirname, `.env.${environment}`);
const envDest = path.resolve(__dirname, ".env.local");

if (!fs.existsSync(envSource)) {
  console.error(`❌ Environment file '.env.${environment}' does not exist.`);
  process.exit(1);
}

fs.copyFileSync(envSource, envDest);
console.log(`✅ Copied '.env.${environment}' to '.env.local'.`);

// Generate firebase-messaging-sw.js from the new .env.local
require("./GenerateSW");
