/**
 * migrate-tigris-to-r2.mjs
 *
 * Migrates all audio files stored in Railway Tigris S3 to Cloudflare R2.
 * Also updates the database audioUrl values to point to the new R2 public URLs.
 *
 * Usage (run from project root with env vars set):
 *   node scripts/migrate-tigris-to-r2.mjs [--dry-run]
 *
 * Required env vars:
 *   TIGRIS_BUCKET_NAME, TIGRIS_ACCESS_KEY_ID, TIGRIS_SECRET_ACCESS_KEY, TIGRIS_ENDPOINT
 *   AWS_S3_BUCKET_NAME, AWS_S3_ENDPOINT, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
 *   R2_PUBLIC_URL, DATABASE_URL
 */

import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import mysql from 'mysql2/promise';

const DRY_RUN = process.argv.includes('--dry-run');

// ─── Config ───────────────────────────────────────────────────────────────────

const TIGRIS_BUCKET = process.env.TIGRIS_BUCKET_NAME || '';
const TIGRIS_REGION = 'auto';
const TIGRIS_ENDPOINT = process.env.TIGRIS_ENDPOINT || 'https://t3.storageapi.dev';
const TIGRIS_ACCESS_KEY = process.env.TIGRIS_ACCESS_KEY_ID || '';
const TIGRIS_SECRET = process.env.TIGRIS_SECRET_ACCESS_KEY || '';

const R2_BUCKET = process.env.AWS_S3_BUCKET_NAME || 'strawberry-riff';
const R2_REGION = 'auto';
const R2_ENDPOINT = process.env.AWS_S3_ENDPOINT || 'https://6231dd181ffc73b293798b219e3a9ede.r2.cloudflarestorage.com';
const R2_ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID || '';
const R2_SECRET = process.env.AWS_SECRET_ACCESS_KEY || '';
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || 'https://pub-d2b13b86f44e4adc8b367394bda88739.r2.dev').replace(/\/+$/, '');

const DATABASE_URL = process.env.DATABASE_URL || '';

if (!DATABASE_URL) { console.error('ERROR: DATABASE_URL is not set'); process.exit(1); }
if (!R2_ACCESS_KEY || !R2_SECRET) { console.error('ERROR: R2 credentials not set'); process.exit(1); }
if (!TIGRIS_ACCESS_KEY || !TIGRIS_BUCKET) { console.error('ERROR: Tigris credentials not set'); process.exit(1); }

console.log('=== Tigris → R2 Migration ===');
console.log('DRY RUN:', DRY_RUN ? 'YES' : 'NO (live migration)');
console.log('Tigris Bucket:', TIGRIS_BUCKET, '@ ', TIGRIS_ENDPOINT);
console.log('R2 Bucket:', R2_BUCKET, '@ ', R2_ENDPOINT);
console.log('R2 Public URL:', R2_PUBLIC_URL);
console.log('');

// ─── S3 Clients ───────────────────────────────────────────────────────────────

const r2 = new S3Client({
  region: R2_REGION,
  endpoint: R2_ENDPOINT,
  credentials: { accessKeyId: R2_ACCESS_KEY, secretAccessKey: R2_SECRET },
  forcePathStyle: false,
});

const tigris = new S3Client({
  region: TIGRIS_REGION,
  endpoint: TIGRIS_ENDPOINT,
  credentials: { accessKeyId: TIGRIS_ACCESS_KEY, secretAccessKey: TIGRIS_SECRET },
  forcePathStyle: false,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isTigrisUrl(url) {
  if (!url) return false;
  return url.includes('storageapi.dev') || url.includes('tigrisdata.com');
}

function extractKeyFromTigrisUrl(url) {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.replace(/^\//, '').split('/');
    if (parts.length >= 2) return parts.slice(1).join('/');
  } catch {}
  return null;
}

function toR2Url(key) {
  return `${R2_PUBLIC_URL}/${key}`;
}

async function existsInR2(key) {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function copyToR2(key) {
  // Generate presigned GET URL from Tigris
  const presigned = await getSignedUrl(tigris, new GetObjectCommand({ Bucket: TIGRIS_BUCKET, Key: key }), { expiresIn: 3600 });
  const res = await fetch(presigned);
  if (!res.ok) throw new Error(`Tigris fetch failed (${res.status}) for key: ${key}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get('content-type') || 'audio/mpeg';
  await r2.send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, Body: buffer, ContentType: contentType }));
  return { bytes: buffer.length, contentType };
}

async function migrateUrl(url, label) {
  if (!url || !isTigrisUrl(url)) return { newUrl: url, status: 'skip' };
  const key = extractKeyFromTigrisUrl(url);
  if (!key) return { newUrl: url, status: 'key-extract-failed' };
  const r2Url = toR2Url(key);
  if (DRY_RUN) {
    console.log(`  [DRY] ${label}: ${key} → R2`);
    return { newUrl: r2Url, status: 'dry-run' };
  }
  if (await existsInR2(key)) {
    console.log(`  [SKIP] Already in R2: ${key}`);
    return { newUrl: r2Url, status: 'exists' };
  }
  try {
    const { bytes, contentType } = await copyToR2(key);
    console.log(`  [OK]   ${key} (${bytes} bytes, ${contentType})`);
    return { newUrl: r2Url, status: 'migrated' };
  } catch (err) {
    console.error(`  [ERR]  ${key}: ${err.message}`);
    return { newUrl: url, status: 'error' };
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  const db = await mysql.createConnection(DATABASE_URL);
  let total = 0, migrated = 0, errors = 0;

  async function processTable(table, urlCol) {
    const [rows] = await db.execute(
      `SELECT id, \`${urlCol}\` as url FROM \`${table}\` WHERE \`${urlCol}\` IS NOT NULL AND \`${urlCol}\` != '' AND \`${urlCol}\` LIKE '%storageapi.dev%'`
    );
    console.log(`\n--- ${table}.${urlCol}: ${rows.length} Tigris URLs ---`);
    for (const row of rows) {
      total++;
      const { newUrl, status } = await migrateUrl(row.url, `${table}#${row.id}`);
      if (status === 'error') { errors++; continue; }
      if (!DRY_RUN && newUrl !== row.url && (status === 'migrated' || status === 'exists')) {
        await db.execute(`UPDATE \`${table}\` SET \`${urlCol}\` = ? WHERE id = ?`, [newUrl, row.id]);
        migrated++;
      } else if (status === 'dry-run') {
        migrated++;
      }
    }
  }

  try {
    // camelCase column names as stored in MySQL (Drizzle uses camelCase by default)
    await processTable('music_generations', 'audioUrl');
    await processTable('music_generations', 'referenceAudioUrl');
    await processTable('tracks', 'audioUrl');
    await processTable('profiles', 'avatarUrl');

    console.log(`\n=== Done: ${total} total, ${migrated} migrated/updated, ${errors} errors ===`);
    if (DRY_RUN) console.log('(DRY RUN — no changes made)');
  } finally {
    await db.end();
  }
}

run().catch(err => { console.error('Migration failed:', err); process.exit(1); });
