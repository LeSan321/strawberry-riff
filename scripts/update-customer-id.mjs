import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const conn = await mysql.createConnection(DATABASE_URL);

const [result] = await conn.execute(
  "UPDATE users SET stripeCustomerId = ? WHERE id = 1",
  ["cus_UFzxWGM5Gal7qA"]
);
console.log("Rows affected:", result.affectedRows);

const [rows] = await conn.execute(
  "SELECT id, stripeCustomerId, isPremium FROM users WHERE id = 1"
);
console.log("User record:", rows[0]);

await conn.end();
process.exit(0);
