import { copyFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

function run(command) {
  console.log(`\n$ ${command}`);
  execSync(command, { stdio: "inherit" });
}

if (!existsSync(".env")) {
  copyFileSync(".env.example", ".env");
  console.log("Created .env from .env.example");
}

const isFreshDatabase = !existsSync("prisma/dev.db");

run("npx prisma generate");
run("npx prisma db push");

if (isFreshDatabase) {
  run("npx tsx prisma/seed.ts");
} else {
  console.log("\nDatabase already exists — skipping seed (run `npm run db:seed` to reset demo data).");
}

console.log("\nSetup complete. Start the app with `npm run dev` and sign in as demo@gohighlevel.dev / demo1234.");
