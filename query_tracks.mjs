import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./drizzle/schema.js";
import { like, or } from "drizzle-orm";

const conn = await mysql.createConnection(process.env.DATABASE_URL);
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
await conn.end();
