import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./drizzle/schema";
import { like, or } from "drizzle-orm";

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(conn, { schema, mode: "default" });

  const tracks = await db.select({
    id: schema.musicGenerations.id,
    title: schema.musicGenerations.title,
    audioUrl: schema.musicGenerations.audioUrl,
    status: schema.musicGenerations.status,
  }).from(schema.musicGenerations)
    .where(or(
      like(schema.musicGenerations.title, "%iolet%ky%"),
      like(schema.musicGenerations.title, "%rank%ean%"),
    ))
    .limit(20);

  console.log("=== Matching Tracks ===");
  for (const t of tracks) {
    console.log(`\nID=${t.id} | "${t.title}" | status=${t.status}`);
    console.log(`  URL: ${t.audioUrl}`);
  }

  // Also find stem splits for these tracks
  if (tracks.length > 0) {
    const ids = tracks.map(t => t.id);
    const stems = await db.select({
      id: schema.stemSplits.id,
      generationId: schema.stemSplits.musicGenerationId,
      vocalsUrl: schema.stemSplits.vocalsUrl,
      instrumentalUrl: schema.stemSplits.instrumentalUrl,
      status: schema.stemSplits.status,
    }).from(schema.stemSplits)
      .limit(20);
    
    const relevantStems = stems.filter(s => ids.includes(s.generationId!));
    console.log("\n=== Stem Splits ===");
    for (const s of relevantStems) {
      console.log(`\nStem ID=${s.id} | genID=${s.generationId} | status=${s.status}`);
      console.log(`  Vocals: ${s.vocalsUrl}`);
      console.log(`  Instrumental: ${s.instrumentalUrl}`);
    }
  }

  await conn.end();
}
main().catch(console.error);
