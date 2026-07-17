export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  studiosBridgeUrl: process.env.STUDIOS_BRIDGE_URL ?? "",
  studiosBridgeKey: process.env.BRIDGE_API_KEY ?? "",
  // Key Studios sends to Riff for inbound bridge calls (same shared secret, different direction)
  studiosBridgeKeyInbound: process.env.STUDIOS_BRIDGE_KEY ?? process.env.BRIDGE_API_KEY ?? "",
  clerkSecretKey: process.env.CLERK_SECRET_KEY ?? "",
  // Railway S3 storage — Railway Object Storage auto-injects AWS_* prefixed vars;
  // fall back to bare names for manual overrides
  s3Bucket: process.env.AWS_S3_BUCKET_NAME ?? process.env.BUCKET ?? "",
  s3Region: process.env.AWS_DEFAULT_REGION ?? process.env.REGION ?? "",
  s3Endpoint: process.env.AWS_ENDPOINT_URL ?? process.env.ENDPOINT ?? "",
  s3AccessKeyId: process.env.AWS_ACCESS_KEY_ID ?? process.env.ACCESS_KEY_ID ?? "",
  s3SecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? process.env.SECRET_ACCESS_KEY ?? "",
};
