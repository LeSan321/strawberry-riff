/**
 * Re-fetch fresh StemSplit URLs for Violet Sky vocal stem
 * and download both audio files for the ACE-Step repaint test.
 */
import * as fs from "fs";
import * as https from "https";

const STEMSPLIT_API_KEY = process.env.STEMSPLIT_API_KEY;
const VIOLET_SKY_JOB_ID = "cms71zilq032yj3yvmnkxw2dn";

// Known URLs
const FRANK_DEAN_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663331665311/frNnwU2pwLKJifDR8KqR7c/music/1/2970001-OJRQ9HQc.mp3";
const VIOLET_SKY_FULL_URL = "https://pub-d2b13b86f44e4adc8b367394bda88739.r2.dev/music/1/16830001-jmDf5P9a.mp3";

async function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const request = (url: string) => {
      https.get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close();
          request(res.headers.location!);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        res.pipe(file);
        file.on("finish", () => { file.close(); resolve(); });
      }).on("error", reject);
    };
    request(url);
  });
}

async function main() {
  // Step 1: Re-fetch fresh StemSplit URLs for Violet Sky
  console.log("Fetching fresh StemSplit URLs for Violet Sky...");
  const resp = await fetch(`https://stemsplit.io/api/v1/jobs/${VIOLET_SKY_JOB_ID}`, {
    headers: {
      Authorization: `Bearer ${STEMSPLIT_API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`StemSplit API error: ${resp.status} - ${err}`);
  }

  const job = await resp.json() as any;
  console.log(`Job status: ${job.status}`);
  
  if (job.status === "EXPIRED") {
    console.log("⚠️  Job is EXPIRED — stems are no longer available from StemSplit.");
    console.log("Will use Violet Sky full mix instead of vocal stem.");
    console.log("\nDownloading Violet Sky full mix...");
    await downloadFile(VIOLET_SKY_FULL_URL, "/tmp/violet_sky_full.mp3");
    console.log("✓ Violet Sky full mix saved to /tmp/violet_sky_full.mp3");
  } else if (job.outputs?.vocals?.url) {
    const vocalUrl = job.outputs.vocals.url;
    const expiresAt = job.outputs.vocals.expiresAt;
    console.log(`✓ Vocal URL (expires ${expiresAt}): ${vocalUrl.slice(0, 80)}...`);
    console.log("\nDownloading Violet Sky vocal stem...");
    await downloadFile(vocalUrl, "/tmp/violet_sky_vocals.mp3");
    const size = fs.statSync("/tmp/violet_sky_vocals.mp3").size;
    console.log(`✓ Vocal stem saved: ${(size/1024/1024).toFixed(2)} MB`);
  } else {
    console.log("No vocal URL found. Full job data:");
    console.log(JSON.stringify(job, null, 2));
  }

  // Step 2: Download Frank and Dean Ride
  console.log("\nDownloading Frank and Dean Ride...");
  await downloadFile(FRANK_DEAN_URL, "/tmp/frank_and_dean_ride.mp3");
  const fdSize = fs.statSync("/tmp/frank_and_dean_ride.mp3").size;
  console.log(`✓ Frank and Dean Ride saved: ${(fdSize/1024/1024).toFixed(2)} MB`);

  console.log("\n=== Ready for ACE-Step test ===");
  console.log("Vocal/source: /tmp/violet_sky_vocals.mp3 (or /tmp/violet_sky_full.mp3)");
  console.log("Instrumental reference: /tmp/frank_and_dean_ride.mp3");
}

main().catch(console.error);
