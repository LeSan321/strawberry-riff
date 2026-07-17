// Storage helpers for Strawberry Riff
// Priority: Railway S3/R2 (when BUCKET + ACCESS_KEY_ID + SECRET_ACCESS_KEY are set)
//           → Manus Forge proxy (fallback for local dev / Manus-hosted deployment)
//
// S3 path uses AWS Signature V4 via Node.js crypto — no SDK required.
// Supports Railway Object Storage (t3.storageapi.dev, region=auto/us-west-1, path-style URLs)

import { ENV } from './_core/env';
import { createHmac, createHash } from 'crypto';

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Log S3 config status at startup so Railway logs show what's available
console.log('[Storage] Config check — BUCKET:', ENV.s3Bucket ? `"${ENV.s3Bucket}"` : 'EMPTY', '| REGION:', ENV.s3Region || 'EMPTY', '| ENDPOINT:', ENV.s3Endpoint || 'EMPTY', '| ACCESS_KEY_ID:', ENV.s3AccessKeyId ? `set (${ENV.s3AccessKeyId.slice(0,8)}...)` : 'EMPTY', '| SECRET:', ENV.s3SecretAccessKey ? 'set' : 'EMPTY');

function hasS3Config(): boolean {
  return !!(
    ENV.s3Bucket &&
    ENV.s3AccessKeyId &&
    ENV.s3SecretAccessKey
  );
}

// Railway Object Storage uses 'auto' as the region label but signs with 'auto'
// For Cloudflare R2-compatible stores, the signing region is literally 'auto'
function signingRegion(): string {
  const r = ENV.s3Region || 'auto';
  return r;
}

function sha256hex(data: string | Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return createHmac('sha256', key).update(data).digest();
}

function getSigningKey(secretKey: string, dateStamp: string, region: string, service: string): Buffer {
  const kDate = hmacSha256(`AWS4${secretKey}`, dateStamp);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  return hmacSha256(kService, 'aws4_request');
}

// For Railway Object Storage (path-style): https://endpoint/bucket/key
// For standard AWS S3 (virtual-hosted): https://bucket.s3.region.amazonaws.com/key
function s3ObjectUrl(key: string): string {
  if (ENV.s3Endpoint) {
    return `${ENV.s3Endpoint.replace(/\/+$/, '')}/${ENV.s3Bucket}/${key}`;
  }
  return `https://${ENV.s3Bucket}.s3.${signingRegion()}.amazonaws.com/${key}`;
}

// Sign and execute an S3 PUT using AWS Signature V4
async function s3Put(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType: string
): Promise<{ key: string; url: string }> {
  const key = relKey.replace(/^\/+/, '');
  const body = typeof data === 'string' ? Buffer.from(data) : Buffer.from(data as any);

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '').slice(0, 15) + 'Z';
  const dateStamp = amzDate.slice(0, 8);
  const region = signingRegion();

  const url = s3ObjectUrl(key);
  const parsedUrl = new URL(url);
  const host = parsedUrl.host;
  const path = parsedUrl.pathname;

  const payloadHash = sha256hex(body);
  const canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = `PUT\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${sha256hex(canonicalRequest)}`;

  const signingKey = getSigningKey(ENV.s3SecretAccessKey, dateStamp, region, 's3');
  const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex');

  const authHeader = `AWS4-HMAC-SHA256 Credential=${ENV.s3AccessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  console.log(`[Storage S3] Uploading ${key} to ${url} (region=${region})`);

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'Host': host,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
      'Authorization': authHeader,
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    console.error(`[Storage S3] Upload failed (${response.status}): ${text}`);
    throw new Error(`S3 upload failed (${response.status}): ${text}`);
  }

  console.log(`[Storage S3] Uploaded ${key} → ${url}`);
  return { key, url };
}

// ─── Forge proxy path ─────────────────────────────────────────────────────────

type StorageConfig = { baseUrl: string; apiKey: string };

function getForgeConfig(): StorageConfig {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;
  if (!baseUrl || !apiKey) {
    throw new Error(
      'Storage credentials missing: set BUCKET/ACCESS_KEY_ID/SECRET_ACCESS_KEY for S3, or BUILT_IN_FORGE_API_URL/BUILT_IN_FORGE_API_KEY for Forge proxy'
    );
  }
  return { baseUrl: baseUrl.replace(/\/+$/, ''), apiKey };
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, '');
}

function toFormData(data: Buffer | Uint8Array | string, contentType: string, fileName: string): FormData {
  const blob =
    typeof data === 'string'
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });
  const form = new FormData();
  form.append('file', blob, fileName || 'file');
  return form;
}

function buildAuthHeaders(apiKey: string): HeadersInit {
  return { Authorization: `Bearer ${apiKey}` };
}

async function forgePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType: string
): Promise<{ key: string; url: string }> {
  const { baseUrl, apiKey } = getForgeConfig();
  const key = normalizeKey(relKey);
  const uploadUrl = new URL('v1/storage/upload', ensureTrailingSlash(baseUrl));
  uploadUrl.searchParams.set('path', key);
  const formData = toFormData(data, contentType, key.split('/').pop() ?? key);
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: buildAuthHeaders(apiKey),
    body: formData,
  });
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`Storage upload failed (${response.status} ${response.statusText}): ${message}`);
  }
  const url = (await response.json()).url;
  console.log(`[Storage Forge] Uploaded ${key} → ${url}`);
  return { key, url };
}

async function forgeGet(relKey: string): Promise<{ key: string; url: string }> {
  const { baseUrl, apiKey } = getForgeConfig();
  const key = normalizeKey(relKey);
  const downloadApiUrl = new URL('v1/storage/downloadUrl', ensureTrailingSlash(baseUrl));
  downloadApiUrl.searchParams.set('path', key);
  const response = await fetch(downloadApiUrl, {
    method: 'GET',
    headers: buildAuthHeaders(apiKey),
  });
  return { key, url: (await response.json()).url };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = 'application/octet-stream'
): Promise<{ key: string; url: string }> {
  if (hasS3Config()) {
    return s3Put(relKey, data, contentType);
  }
  return forgePut(relKey, data, contentType);
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  if (hasS3Config()) {
    const key = relKey.replace(/^\/+/, '');
    return { key, url: s3ObjectUrl(key) };
  }
  return forgeGet(relKey);
}
