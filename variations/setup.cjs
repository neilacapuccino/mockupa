// runs "npm install" inside every backend (only needed once, or after deleting node_modules)
// run it with:  npm run setup
const { execSync } = require("child_process");
const path = require("path");

const backends = [
  "1-studynotes",
  "2-libraryhub",
  "3-stockroom",
  "4-projectboard",
  "5-staffdirectory",
  "6-cafeorders",
  "7-classportal",
  "8-forumboard",
  "9-eventpass",
];

// start each "npm install" fresh, without the settings "npm run" passes down
const env = { ...process.env };
for (const key of Object.keys(env)) {
  if (key.toLowerCase().startsWith("npm_")) delete env[key];
}

for (const name of backends) {
  console.log(`\n--- installing ${name}/backend ---`);
  execSync("npm install", { cwd: path.join(__dirname, name, "backend"), stdio: "inherit", env });
}
