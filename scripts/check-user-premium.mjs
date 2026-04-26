import { createConnection } from "mysql2/promise";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const conn = await createConnection(process.env.DATABASE_URL);

const [rows] = await conn.query(
  `SELECT id, name, email, role, isPremium, stripeCustomerId, stripeSubscriptionId 
   FROM users ORDER BY id LIMIT 10`
);

console.log("Users in DB:");
console.table(rows);

await conn.end();
