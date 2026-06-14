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
      // Diagnostic: log key presence and token prefix so we can trace Railway failures
      const secretKeyPrefix = ENV.clerkSecretKey?.slice(0, 12) ?? "(empty)";
      console.log(`[Auth] Verifying token. secretKey prefix: ${secretKeyPrefix}, tokenLen: ${sessionToken.length}`);

      // Verify the Clerk session token
      const verifiedToken = await verifyToken(sessionToken, {
        secretKey: ENV.clerkSecretKey,
      });
      const clerkUserId = verifiedToken.sub;
      console.log(`[Auth] Token verified OK. clerkUserId: ${clerkUserId}`);

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
        console.log(`[Auth] User resolved: ${user ? `id=${user.id} openId=${user.openId}` : "null (not in DB)"}`);
      }
    } else {
      // No token present — public request
      const hasAuthHeader = !!opts.req.headers.authorization;
      if (hasAuthHeader) {
        console.warn(`[Auth] Authorization header present but not a Bearer token: ${opts.req.headers.authorization?.slice(0, 20)}`);
      }
    }
  } catch (authErr) {
    // Authentication is optional for public procedures.
    console.error(`[Auth] Token verification failed: ${authErr instanceof Error ? authErr.message : String(authErr)}`);
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    authHeader: opts.req.headers.authorization,
  };
}
