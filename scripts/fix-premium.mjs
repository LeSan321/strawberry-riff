import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { createConnection } from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const connection = await createConnection(DATABASE_URL);
const db = drizzle(connection);

// Dynamically import the schema
const { users } = await import("../drizzle/schema.ts");

// Update user ID 1 to Premium
const result = await db
  .update(users)
  .set({
    isPremium: true,
    premiumSince: new Date(),
  })
  .where(eq(users.id, 1));

console.log("Update result:", result);

// Verify
const [user] = await db
  .select({
    id: users.id,
    name: users.name,
    isPremium: users.isPremium,
    premiumSince: users.premiumSince,
    stripeCustomerId: users.stripeCustomerId,
  })
  .from(users)
  .where(eq(users.id, 1));

console.log("User after update:", user);
await connection.end();
