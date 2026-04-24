import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL);
try {
  await conn.execute("ALTER TABLE `music_generations` ADD COLUMN `voiceReferenceUrl` text");
  console.log("Migration applied: voiceReferenceUrl column added");
} catch (e) {
  if (e.code === "ER_DUP_FIELDNAME") {
    console.log("Column already exists — skipping");
  } else {
    throw e;
  }
} finally {
  await conn.end();
}
