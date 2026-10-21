// Creates a CMS account, or sets a new password for an existing one.
//   npm run admin:add -- you@example.com            → production database (D1, remote)
//   npm run admin:add -- you@example.com --local    → local database used by `npm run dev`
// The password is asked for interactively and only its PBKDF2 hash is stored.

import { execFileSync } from "node:child_process";
import { createInterface } from "node:readline";
import { hashPassword } from "../src/lib/admin/password";

const args = process.argv.slice(2);
const email = args.find((a) => !a.startsWith("--"))?.trim().toLowerCase();
const target = args.includes("--local") ? "--local" : "--remote";

if (!email || !/^[^\s@']+@[^\s@']+\.[^\s@']+$/.test(email)) {
  console.error("Usage: npm run admin:add -- <email> [--local]");
  process.exit(1);
}

/** Reads a line without echoing it to the terminal. */
function askHidden(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  const output = rl as unknown as { _writeToOutput: (s: string) => void };
  const write = output._writeToOutput.bind(rl);
  let muted = false;
  output._writeToOutput = (s) => (muted ? undefined : write(s));
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
    muted = true;
  });
}

const password = await askHidden(`Password for ${email}: `);
if (password.length < 10) {
  console.error("Use at least 10 characters.");
  process.exit(1);
}
if ((await askHidden("Repeat password: ")) !== password) {
  console.error("Passwords don't match.");
  process.exit(1);
}

const hash = await hashPassword(password);
// Email is validated above (no quotes) and the hash is base64, so both are safe as SQL literals.
const sql = `insert into admin_users (email, password_hash) values ('${email}', '${hash}')
  on conflict (email) do update set password_hash = excluded.password_hash`;
execFileSync("npx", ["wrangler", "d1", "execute", "DB", target, "--command", sql], { stdio: "inherit" });
console.log(`✓ ${email} can sign in at /admin (${target === "--local" ? "local" : "production"} database).`);
