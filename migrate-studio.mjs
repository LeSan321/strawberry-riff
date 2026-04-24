import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL);
try {
  // Add voiceReferenceUrl to music_generations if not exists
  await conn.execute(
    "ALTER TABLE `music_generations` ADD COLUMN `voiceReferenceUrl` text"
  ).catch(e => {
    if (e.code === 'ER_DUP_FIELDNAME') console.log("voiceReferenceUrl already exists, skipping");
    else throw e;
  });
  console.log("✓ voiceReferenceUrl column ready");

  // Add studioTheme to users if not exists
  await conn.execute(
    "ALTER TABLE `users` ADD COLUMN `studioTheme` varchar(64) DEFAULT 'forest-studio' NOT NULL"
  ).catch(e => {
    if (e.code === 'ER_DUP_FIELDNAME') console.log("studioTheme already exists, skipping");
    else throw e;
  });
  console.log("✓ studioTheme column ready");

  console.log("Migration complete!");
} finally {
  await conn.end();
}
