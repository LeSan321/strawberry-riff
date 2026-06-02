import { createClerkClient } from "@clerk/express";
import { ENV } from "./env";

let _client: ReturnType<typeof createClerkClient> | null = null;

export function clerkClient() {
  if (!_client) {
    if (!ENV.clerkSecretKey) {
      throw new Error("CLERK_SECRET_KEY is not configured");
    }
    _client = createClerkClient({ secretKey: ENV.clerkSecretKey });
  }
  return _client;
}
