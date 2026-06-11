import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { verifyToken } from "@clerk/express";
import { clerkClient } from "./clerkClient";
import * as db from "../db";
import { ENV } from "./env";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  authHeader?: string; // Clerk Bearer token for cross-service calls
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // Extract Clerk session token from Authorization header or __session cookie
    const authHeader = opts.req.headers.authorization;
    const sessionToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : opts.req.cookies?.["__session"] ?? null;

    if (sessionToken) {
      // Verify the Clerk session token
      const verifiedToken = await verifyToken(sessionToken, {
        secretKey: ENV.clerkSecretKey,
      });
      const clerkUserId = verifiedToken.sub;

      if (clerkUserId) {
        // Look up or create the local user record using Clerk ID as openId
        let localUser = await db.getUserByOpenId(clerkUserId);

        if (!localUser) {
          // First time this Clerk user hits the API — sync their info
          try {
            const client = clerkClient();
            const clerkUser = await client.users.getUser(clerkUserId);
            const email = clerkUser.emailAddresses?.[0]?.emailAddress ?? null;
            const name = [clerkUser.firstName, clerkUser.lastName]
              .filter(Boolean)
              .join(" ") || clerkUser.username || email || null;

            await db.upsertUser({
              openId: clerkUserId,
              name,
              email,
              loginMethod: "clerk",
              lastSignedIn: new Date(),
            });
            localUser = await db.getUserByOpenId(clerkUserId);
          } catch (syncError) {
            console.error("[Auth] Failed to sync Clerk user:", syncError);
          }
        } else {
          // Update last signed in timestamp
          await db.upsertUser({
            openId: clerkUserId,
            lastSignedIn: new Date(),
          });
        }

        user = localUser ?? null;
      }
    }
  } catch {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    authHeader: opts.req.headers.authorization,
  };
}
