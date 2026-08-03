import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./drizzle/schema";
import { inArray } from "drizzle-orm";

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(conn, { schema, mode: "default" });

  // We already know the IDs from the previous query:
  // 2970001 = Frank and Dean Ride
  // 16830001 = Violet Sky
  // 16860001 = violet sky Vegas style
  const targetIds = [2970001, 16830001, 16860001];

  const stems = await db.select({
    id: schema.stemSplits.id,
    generationId: schema.stemSplits.generationId,
    status: schema.stemSplits.status,
    vocalUrl: schema.stemSplits.vocalUrl,
    drumsUrl: schema.stemSplits.drumsUrl,
    bassUrl: schema.stemSplits.bassUrl,
    otherUrl: schema.stemSplits.otherUrl,
  }).from(schema.stemSplits)
    .where(inArray(schema.stemSplits.generationId, targetIds));

  const trackNames: Record<number, string> = {
    2970001: "Frank and Dean Ride",
    16830001: "Violet Sky",
    16860001: "violet sky Vegas style",
  };

  console.log("=== Stem Splits ===");
  for (const s of stems) {
    console.log(`\nStem ID=${s.id} | Track: "${trackNames[s.generationId]}" (genID=${s.generationId}) | status=${s.status}`);
    console.log(`  Vocals:       ${s.vocalUrl || "(none)"}`);
    console.log(`  Drums:        ${s.drumsUrl || "(none)"}`);
    console.log(`  Bass:         ${s.bassUrl || "(none)"}`);
    console.log(`  Other:        ${s.otherUrl || "(none)"}`);
  }

  if (stems.length === 0) {
    console.log("No stem splits found for these tracks.");
  }

  await conn.end();
}
main().catch(console.error);
