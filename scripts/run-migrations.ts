import { sql } from "drizzle-orm";
import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load .env file
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    console.log("Connecting to database...");
    const client = await pool.connect();
    console.log("✓ Connected");

    const migrationPath = path.resolve(process.cwd(), "migrations", "0001_initial_schema.sql");
    const migrationSql = fs.readFileSync(migrationPath, "utf-8");

    console.log("Running migration: 0001_initial_schema.sql");
    await client.query(migrationSql);
    console.log("✓ Migration applied successfully");

    client.release();
  } catch (error) {
    console.error("Migration error:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigrations().catch(console.error);
