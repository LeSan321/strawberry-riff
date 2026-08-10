import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const STEMSPLIT_API_KEY = process.env.STEMSPLIT_API_KEY;
const R2_ENDPOINT = process.env.R2_ENDPOINT || process.env.AWS_S3_ENDPOINT;
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const R2_SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET || process.env.AWS_S3_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
const DATABASE_URL = process.env.DATABASE_URL;

// Jobs to repair: { jobId, generationId, splitId }
const JOBS = [
  { jobId: "cmsnlypr10350nxyvpny1tbau", generationId: 18630001, splitId: 2220001 },
  { jobId: "cmsnkm5c60331nxyvfc256je4", generationId: 18570001, splitId: 2160001 },
  { jobId: "cmsnicg7202zmnxyva40wifgt", generationId: 18480001, splitId: 2100001 },
];

const s3 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: { accessKeyId: R2_ACCESS_KEY, secretAccessKey: R2_SECRET_KEY },
  forcePathStyle: false,
});

async function downloadBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download: ${res.status} ${url.slice(0, 80)}`);
  return Buffer.from(await res.arrayBuffer());
}

async function uploadToR2(key, buffer) {
  await s3.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: "audio/mpeg",
  }));
  return `${R2_PUBLIC_URL}/${key}`;
}

async function fetchJobOutputs(jobId) {
  const res = await fetch(`https://stemsplit.io/api/v1/jobs/${jobId}`, {
    headers: { Authorization: `Bearer ${STEMSPLIT_API_KEY}` },
  });
  if (!res.ok) throw new Error(`StemSplit API error: ${res.status}`);
  const data = await res.json();
  return data.outputs;
}

async function dbQuery(sql, params = []) {
  // Use mysql2 directly
  const { createConnection } = await import("mysql2/promise");
  const conn = await createConnection(DATABASE_URL);
  const [rows] = await conn.execute(sql, params);
  await conn.end();
  return rows;
}

async function repairJob({ jobId, generationId, splitId }) {
  console.log(`\n=== Repairing job ${jobId} (gen ${generationId}) ===`);
  
  const outputs = await fetchJobOutputs(jobId);
  if (!outputs) { console.log("No outputs found — skipping"); return; }

  const stemMap = {
    vocals: outputs.vocals?.url,
    instrumental: outputs.instrumental?.url,
    drums: outputs.drums?.url,
    bass: outputs.bass?.url,
    other: outputs.other?.url,
    piano: outputs.piano?.url,
    guitar: outputs.guitar?.url,
  };

  const r2Urls = {};
  for (const [name, url] of Object.entries(stemMap)) {
    if (!url) { console.log(`  ${name}: no URL, skipping`); continue; }
    try {
      console.log(`  Downloading ${name}...`);
      const buf = await downloadBuffer(url);
      const key = `stems/${generationId}/${name}-repaired.mp3`;
      const r2Url = await uploadToR2(key, buf);
      r2Urls[name] = r2Url;
      console.log(`  ${name}: uploaded to R2 ✓`);
    } catch (err) {
      console.error(`  ${name}: FAILED — ${err.message}`);
    }
  }

  // Update stem_splits record
  await dbQuery(
    `UPDATE stem_splits SET 
      status = 'completed',
      vocalUrl = ?, instrumentalUrl = ?, drumsUrl = ?, bassUrl = ?, otherUrl = ?, pianoUrl = ?, guitarUrl = ?
     WHERE id = ?`,
    [
      r2Urls.vocals || null,
      r2Urls.instrumental || null,
      r2Urls.drums || null,
      r2Urls.bass || null,
      r2Urls.other || null,
      r2Urls.piano || null,
      r2Urls.guitar || null,
      splitId,
    ]
  );
  console.log(`  stem_splits record updated ✓`);

  // Mark generation as split
  await dbQuery(`UPDATE music_generations SET isSplit = 1 WHERE id = ?`, [generationId]);
  console.log(`  music_generations.isSplit = 1 ✓`);

  console.log(`=== Job ${jobId} repaired ===`);
}

async function main() {
  console.log("Starting stem repair for 3 stuck jobs...");
  console.log(`R2 bucket: ${R2_BUCKET} | endpoint: ${R2_ENDPOINT?.slice(0, 40)}`);
  
  for (const job of JOBS) {
    await repairJob(job);
  }
  console.log("\nAll done!");
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
