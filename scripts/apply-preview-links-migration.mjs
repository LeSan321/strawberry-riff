import { createConnection } from "mysql2/promise";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not found in environment");
  process.exit(1);
}

const conn = await createConnection(url);

// Check if table already exists
const [rows] = await conn.query(
  `SELECT COUNT(*) as cnt FROM information_schema.tables 
   WHERE table_schema = DATABASE() AND table_name = 'preview_links'`
);
const exists = rows[0].cnt > 0;

if (exists) {
  console.log("✅ preview_links table already exists — nothing to do.");
} else {
  await conn.query(`
    CREATE TABLE \`preview_links\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`trackId\` int NOT NULL,
      \`ownerId\` int NOT NULL,
      \`token\` varchar(64) NOT NULL,
      \`playsRemaining\` int NOT NULL DEFAULT 3,
      \`playsTotal\` int NOT NULL DEFAULT 3,
      \`isActive\` boolean NOT NULL DEFAULT true,
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      \`lastPlayedAt\` timestamp,
      CONSTRAINT \`preview_links_id\` PRIMARY KEY(\`id\`),
      CONSTRAINT \`preview_links_token_unique\` UNIQUE(\`token\`)
    )
  `);
  console.log("✅ preview_links table created successfully.");
}

await conn.end();
