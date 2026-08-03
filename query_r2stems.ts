import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./drizzle/schema";
import { eq, inArray } from "drizzle-orm";

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(conn, { schema, mode: "default" });

  // Check individual stems table for R2-mirrored URLs
  // The repair script mirrored stems to R2 in Aug 1 session
  const stems = await db.select().from(schema.stemSplits)
    .where(inArray(schema.stemSplits.generationId, [2970001, 16830001, 16860001]));

  console.log("=== All stem split fields ===");
  for (const s of stems) {
    console.log(JSON.stringify(s, null, 2));
  }

  // Also check individual_stems table if it exists
  try {
    const indivStems = await db.execute(
      `SELECT * FROM individual_stems WHERE generation_id IN (2970001, 16830001, 16860001) LIMIT 20`
    );
    console.log("\n=== Individual Stems ===");
    console.log(JSON.stringify(indivStems[0], null, 2));
  } catch (e) {
    console.log("\nNo individual_stems table:", (e as Error).message);
  }

  // Check stems table
  try {
    const rawStems = await db.execute(
      `SELECT id, generation_id, stem_type, r2_url, url FROM stems WHERE generation_id IN (2970001, 16830001, 16860001) LIMIT 20`
    );
    console.log("\n=== stems table ===");
    console.log(JSON.stringify(rawStems[0], null, 2));
  } catch (e) {
    console.log("\nNo stems table:", (e as Error).message);
  }

  await conn.end();
}
main().catch(console.error);
