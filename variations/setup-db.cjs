// Creates the databases (if they don't exist yet) and runs each schema.sql.
// Run it with:  npm run db
// (running it again resets the databases back to the sample data)
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
const dotenv = require("dotenv");

const allVariations = [
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

// "npm run db"                     -> all of them
// "npm run db -- 8-forumboard"     -> only the ones you name
const variations = process.argv.length > 2 ? process.argv.slice(2) : allVariations;

async function main() {
  for (const name of variations) {
    const folder = path.join(__dirname, name, "backend");

    // read that backend's .env (PGUSER, PGPASSWORD, PGDATABASE, ...)
    const env = dotenv.parse(fs.readFileSync(path.join(folder, ".env")));

    const config = {
      user: env.PGUSER,
      host: env.PGHOST,
      password: env.PGPASSWORD,
      port: Number(env.PGPORT) || 5432,
    };

    // 1. create the database (you must connect to the default "postgres" db to do that)
    const admin = new Client({ ...config, database: "postgres" });
    await admin.connect();

    const exists = await admin.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [env.PGDATABASE]
    );

    if (exists.rows.length === 0) {
      await admin.query(`CREATE DATABASE ${env.PGDATABASE}`);
    }

    await admin.end();

    // 2. run schema.sql inside the new database
    const db = new Client({ ...config, database: env.PGDATABASE });
    await db.connect();
    await db.query(fs.readFileSync(path.join(folder, "schema.sql"), "utf8"));
    await db.end();

    console.log(`${name}: database "${env.PGDATABASE}" is ready`);
  }
}

main().catch((error) => {
  console.error("Database setup failed:", error.message);
  process.exit(1);
});
