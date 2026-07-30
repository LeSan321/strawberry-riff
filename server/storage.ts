// Storage helpers for Strawberry Riff
// Priority: Cloudflare R2 (when AWS_S3_BUCKET_NAME + AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY are set)
//           → Manus Forge proxy (fallback for local dev / Manus-hosted deployment)
//
// R2 bucket is configured as PUBLIC — files are served directly via the R2 public URL
// (https://pub-*.r2.dev/<key>). No presigning required for reads.
// Writes use the AWS SDK PutObjectCommand via the S3-compatible R2 endpoint.

import { ENV } from './_core/env';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// ─── Startup diagnostics ──────────────────────────────────────────────────────

console.log(
  '[Storage] Config check — BUCKET:',
  ENV.s3Bucket ? `"${ENV.s3Bucket}"` : 'EMPTY',
  '| ENDPOINT:', ENV.s3Endpoint || 'EMPTY',
  '| ACCESS_KEY_ID:', ENV.s3AccessKeyId ? `set (${ENV.s3AccessKeyId.slice(0, 8)}...)` : 'EMPTY',
  '| SECRET:', ENV.s3SecretAccessKey ? 'set' : 'EMPTY',
  '| R2_PUBLIC_URL:', ENV.r2PublicUrl || 'EMPTY'
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hasS3Config(): boolean {
  return !!(ENV.s3Bucket && ENV.s3AccessKeyId && ENV.s3SecretAccessKey);
}

function signingRegion(): string {
  return ENV.s3Region || 'auto';
}

// Lazy-initialised S3 client
let _s3Client: S3Client | null = null;
function getS3Client(): S3Client {
  if (!_s3Client) {
    _s3Client = new S3Client({
      region: signingRegion(),
      endpoint: ENV.s3Endpoint || undefined,
      credentials: {
        accessKeyId: ENV.s3AccessKeyId,
        secretAccessKey: ENV.s3SecretAccessKey,
      },
      forcePathStyle: false,
    });
  }
  return _s3Client;
}

/**
 * Public URL for a stored key via the R2 public bucket domain.
 * Format: https://pub-<hash>.r2.dev/<key>
 * Always publicly accessible — no signing required.
 */
function r2PublicUrl(key: string): string {
  const cleanKey = key.replace(/^\/+/, '');
  const base = (ENV.r2PublicUrl || '').replace(/\/+$/, '');
  return `${base}/${cleanKey}`;
}

// ─── S3 PUT (AWS SDK) ─────────────────────────────────────────────────────────

async function s3Put(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType: string
): Promise<{ key: string; url: string }> {
  const key = relKey.replace(/^\/+/, '');
  const body = typeof data === 'string' ? Buffer.from(data) : Buffer.from(data as Uint8Array);

  const command = new PutObjectCommand({
    Bucket: ENV.s3Bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  console.log(`[Storage R2] Uploading ${key} (${body.length} bytes, ${contentType})`);
  await getS3Client().send(command);

  const url = r2PublicUrl(key);
  console.log(`[Storage R2] Uploaded ${key} → ${url}`);
  return { key, url };
}

// ─── Presigned PUT URL (for direct browser → R2 uploads) ─────────────────────

async function s3PresignedPutUrl(key: string, contentType: string, expiresIn = 3600): Promise<string> {
  const cleanKey = key.replace(/^\/+/, '');
  const command = new PutObjectCommand({
    Bucket: ENV.s3Bucket,
    Key: cleanKey,
    ContentType: contentType,
  });
  return getSignedUrl(getS3Client(), command, { expiresIn });
}

// ─── Forge proxy path ─────────────────────────────────────────────────────────

type StorageConfig = { baseUrl: string; apiKey: string };

function getForgeConfig(): StorageConfig {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;
  if (!baseUrl || !apiKey) {
    throw new Error(
      'Storage credentials missing: set BUCKET/ACCESS_KEY_ID/SECRET_ACCESS_KEY for R2, or BUILT_IN_FORGE_API_URL/BUILT_IN_FORGE_API_KEY for Forge proxy'
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
      : new Blob([data instanceof Buffer ? data : Buffer.from(data as Uint8Array)], { type: contentType });
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
  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`Forge storage downloadUrl failed (${response.status}) for key "${key}": ${text}`);
  }
  const json = await response.json() as { url?: string };
  if (!json.url) {
    throw new Error(`Forge storage downloadUrl returned no URL for key "${key}". Response: ${JSON.stringify(json)}`);
  }
  return { key, url: json.url };
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

export async function storageGet(relKey: string, _expiresIn = 86400): Promise<{ key: string; url: string }> {
  if (hasS3Config()) {
    const key = relKey.replace(/^\/+/, '');
    // R2 is public — return the public URL directly, no presigning needed
    return { key, url: r2PublicUrl(key) };
  }
  return forgeGet(relKey);
}

/**
 * Generate a presigned PUT URL so the browser can upload directly to R2,
 * bypassing the tRPC server. Returns null when R2 is not configured.
 */
export async function storageGetPresignedPutUrl(
  relKey: string,
  contentType: string,
  expiresIn = 3600
): Promise<{ uploadUrl: string; publicUrl: string } | null> {
  if (!hasS3Config()) return null;
  const key = relKey.replace(/^\/+/, '');
  const uploadUrl = await s3PresignedPutUrl(key, contentType, expiresIn);
  const publicUrl = r2PublicUrl(key);
  return { uploadUrl, publicUrl };
}

/**
 * Given a stored audioUrl, return a playable URL.
 *
 * R2 public URLs and Forge/CDN URLs are returned as-is (already public).
 * Old Tigris/S3 path-style URLs are rewritten to R2 public URLs using the
 * same key (assumes files have been migrated to R2 with the same key structure).
 */
export async function resolveAudioUrl(storedUrl: string, _expiresIn = 86400): Promise<string> {
  if (!storedUrl) return storedUrl;

  // Already an R2 public URL — return as-is
  if (ENV.r2PublicUrl && storedUrl.startsWith(ENV.r2PublicUrl.replace(/\/+$/, '') + '/')) {
    return storedUrl;
  }

  // Old Tigris/Railway S3 URL — rewrite to R2 public URL (post-migration)
  if (storedUrl.includes('storageapi.dev') || storedUrl.includes('tigrisdata.com')) {
    try {
      const parsed = new URL(storedUrl);
      const parts = parsed.pathname.replace(/^\//, '').split('/');
      // path-style: /bucket/key1/key2 → key = parts[1..]
      if (parts.length >= 2) {
        const key = parts.slice(1).join('/');
        if (key && ENV.r2PublicUrl) {
          const r2Url = r2PublicUrl(key);
          console.log(`[Storage] Rewrote Tigris URL → R2: ${key}`);
          return r2Url;
        }
      }
    } catch { /* fall through */ }
  }

  // Also handle old endpoint-style URLs (https://endpoint/bucket/key)
  if (ENV.s3Endpoint && storedUrl.includes(ENV.s3Endpoint.replace(/\/+$/, ''))) {
    const prefix = `${ENV.s3Endpoint.replace(/\/+$/, '')}/${ENV.s3Bucket}/`;
    if (storedUrl.startsWith(prefix)) {
      const key = storedUrl.slice(prefix.length).split('?')[0];
      if (key && ENV.r2PublicUrl) {
        return r2PublicUrl(key);
      }
    }
  }

  // Forge CDN, fal.ai, and other public URLs — return as-is
  return storedUrl;
}
