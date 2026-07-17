// Storage helpers for Strawberry Riff
// Priority: Railway S3/Tigris (when AWS_S3_BUCKET_NAME + AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY are set)
//           → Manus Forge proxy (fallback for local dev / Manus-hosted deployment)
//
// S3 path uses AWS Signature V4 via Node.js crypto — no SDK required.
// Railway Object Storage (Tigris) is private-only; presigned URLs are used for GET access.

import { ENV } from './_core/env';
import { createHmac, createHash } from 'crypto';

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Log S3 config status at startup so Railway logs show what's available
console.log(
  '[Storage] Config check — BUCKET:',
  ENV.s3Bucket ? `"${ENV.s3Bucket}"` : 'EMPTY',
  '| REGION:', ENV.s3Region || 'EMPTY',
  '| ENDPOINT:', ENV.s3Endpoint || 'EMPTY',
  '| ACCESS_KEY_ID:', ENV.s3AccessKeyId ? `set (${ENV.s3AccessKeyId.slice(0, 8)}...)` : 'EMPTY',
  '| SECRET:', ENV.s3SecretAccessKey ? 'set' : 'EMPTY'
);

function hasS3Config(): boolean {
  return !!(ENV.s3Bucket && ENV.s3AccessKeyId && ENV.s3SecretAccessKey);
}

function signingRegion(): string {
  return ENV.s3Region || 'auto';
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

// Path-style URL: https://endpoint/bucket/key
function s3ObjectUrl(key: string): string {
  if (ENV.s3Endpoint) {
    return `${ENV.s3Endpoint.replace(/\/+$/, '')}/${ENV.s3Bucket}/${key}`;
  }
  return `https://${ENV.s3Bucket}.s3.${signingRegion()}.amazonaws.com/${key}`;
}

// ─── Presigned GET URL ────────────────────────────────────────────────────────

// Generate an AWS Signature V4 presigned GET URL valid for `expiresIn` seconds.
// This is the correct way to serve files from Railway's private-only S3 buckets.
function s3PresignedGetUrl(key: string, expiresIn = 86400): string {
  const cleanKey = key.replace(/^\/+/, '');
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '').slice(0, 15) + 'Z';
  const dateStamp = amzDate.slice(0, 8);
  const region = signingRegion();

  const url = s3ObjectUrl(cleanKey);
  const parsedUrl = new URL(url);
  const host = parsedUrl.host;
  const path = parsedUrl.pathname;

  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const credential = `${ENV.s3AccessKeyId}/${credentialScope}`;

  // Build canonical query string (params must be sorted)
  const queryParams = new URLSearchParams({
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': credential,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expiresIn),
    'X-Amz-SignedHeaders': 'host',
  });
  // Sort params alphabetically as required by SigV4
  queryParams.sort();
  const canonicalQueryString = queryParams.toString();

  const canonicalHeaders = `host:${host}\n`;
  const signedHeaders = 'host';
  const payloadHash = 'UNSIGNED-PAYLOAD';

  const canonicalRequest = `GET\n${path}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${sha256hex(canonicalRequest)}`;

  const signingKey = getSigningKey(ENV.s3SecretAccessKey, dateStamp, region, 's3');
  const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex');

  return `${url}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
}

// ─── S3 PUT ───────────────────────────────────────────────────────────────────

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

  // Store the raw object URL as the key — presigned URLs are generated at read time
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

export async function storageGet(relKey: string, expiresIn = 86400): Promise<{ key: string; url: string }> {
  if (hasS3Config()) {
    const key = relKey.replace(/^\/+/, '');
    const url = s3PresignedGetUrl(key, expiresIn);
    return { key, url };
  }
  return forgeGet(relKey);
}

/**
 * Given a stored audioUrl (which may be a raw S3 path-style URL or a Forge CDN URL),
 * return a playable URL. For S3 URLs, generate a presigned URL. For Forge/other URLs,
 * return as-is since they are already publicly accessible.
 *
 * Detection strategy (in order):
 * 1. URL contains configured endpoint → extract key from path-style URL
 * 2. URL contains bucket name (handles cases where endpoint env var is missing)
 * 3. URL contains known Tigris/Railway S3 domain (t3.storageapi.dev)
 * 4. Anything else (Forge CDN, fal.ai, etc.) → return as-is
 */
export function resolveAudioUrl(storedUrl: string, expiresIn = 86400): string {
  if (!storedUrl || !hasS3Config()) return storedUrl;

  // Helper: extract key from a path-style URL given a known prefix
  function extractKey(url: string, prefix: string): string | null {
    if (url.startsWith(prefix)) {
      return url.slice(prefix.length).split('?')[0];
    }
    return null;
  }

  // Strategy 1: endpoint env var is set and URL contains it
  if (ENV.s3Endpoint && storedUrl.includes(ENV.s3Endpoint.replace(/\/+$/, ''))) {
    const prefix = `${ENV.s3Endpoint.replace(/\/+$/, '')}/${ENV.s3Bucket}/`;
    const key = extractKey(storedUrl, prefix);
    if (key) return s3PresignedGetUrl(key, expiresIn);
  }

  // Strategy 2: URL contains our bucket name (works even if endpoint env var is missing)
  if (ENV.s3Bucket && storedUrl.includes(`/${ENV.s3Bucket}/`)) {
    const bucketIdx = storedUrl.indexOf(`/${ENV.s3Bucket}/`);
    const key = storedUrl.slice(bucketIdx + ENV.s3Bucket.length + 2).split('?')[0];
    if (key) return s3PresignedGetUrl(key, expiresIn);
  }

  // Strategy 3: known Tigris/Railway S3 domain
  if (storedUrl.includes('storageapi.dev') || storedUrl.includes('tigrisdata.com')) {
    // Path-style: https://host/bucket/key
    try {
      const parsed = new URL(storedUrl);
      const parts = parsed.pathname.replace(/^\//, '').split('/');
      // parts[0] = bucket, parts[1..] = key
      if (parts.length >= 2) {
        const key = parts.slice(1).join('/');
        if (key) return s3PresignedGetUrl(key, expiresIn);
      }
    } catch { /* fall through */ }
  }

  // Forge CDN, fal.ai, cloudfront, and other public URLs — return as-is
  return storedUrl;
}
