// config/s3.js
const crypto = require("crypto");
const {
  S3Client,
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const REGION = process.env.AWS_REGION || "us-east-1";
const BUCKET = process.env.S3_BUCKET;
if (!BUCKET) throw new Error("S3_BUCKET env var is required");

const s3 = new S3Client({ region: REGION });

/** Allow only the types your UI accepts */
const ALLOWED_CT = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/bmp",
  "image/svg+xml",
  "application/pdf",
  "video/mp4",
]);

function randomKey(folder, ext) {
  const id = crypto.randomUUID();
  const safeExt = (ext || "").toLowerCase().replace(/[^a-z0-9.]/g, "");
  const prefix = folder ? folder.replace(/^\/+|\/+$/g, "") + "/" : "";
  return `${prefix}${id}${
    safeExt && !safeExt.startsWith(".") ? "." : ""
  }${safeExt}`;
}

function publicUrlFromKey(key) {
  const cdn = process.env.CDN_URL;
  if (cdn) return `${cdn.replace(/\/+$/, "")}/${key}`;
  // us-east-1 supports regional and global vhost endpoints; both are valid
  const host =
    REGION === "us-east-1"
      ? `${BUCKET}.s3.amazonaws.com`
      : `${BUCKET}.s3.${REGION}.amazonaws.com`;
  return `https://${host}/${key}`;
}

function keyFromUrl(url) {
  if (!url) return null;
  const cdn = process.env.CDN_URL
    ? process.env.CDN_URL.replace(/\/+$/, "")
    : null;

  try {
    const u = new URL(url);
    const host = u.host;
    if (cdn && url.startsWith(cdn + "/")) return url.slice(cdn.length + 1);

    const regional = `${BUCKET}.s3.${REGION}.amazonaws.com`;
    const globalUE1 = `${BUCKET}.s3.amazonaws.com`; // common in us-east-1
    if (host === regional || host === globalUE1) {
      return u.pathname.replace(/^\/+/, "");
    }
  } catch {
    // not an absolute URL; ignore
  }
  return null;
}

/**
 * Create a presigned PUT URL for direct-to-S3 uploads.
 * NOTE:
 *  - Do NOT set ACL when bucket has "Bucket owner enforced" (default on new buckets).
 *  - Do NOT sign SSE headers unless you are enforcing KMS at the bucket policy.
 */
async function signPutObject({
  folder = "uploads",
  contentType,
  ext,
  expiresIn = 60,
} = {}) {
  if (!contentType || !ALLOWED_CT.has(contentType)) {
    throw new Error("Unsupported content type");
  }
  const key = randomKey(folder, ext);

  const cmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
    // No ACL here (modern S3 disables ACLs).
    // No ServerSideEncryption header — default SSE-S3 is applied by bucket settings.
  });

  const url = await getSignedUrl(s3, cmd, { expiresIn });
  return { url, key, publicUrl: publicUrlFromKey(key), expiresIn, contentType };
}

async function deleteByKey(key) {
  if (!key) return;
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

async function deleteByUrl(url) {
  const key = keyFromUrl(url);
  if (key) return deleteByKey(key);
}

async function headObject(key) {
  return s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
}

module.exports = {
  s3,
  signPutObject,
  publicUrlFromKey,
  keyFromUrl,
  deleteByKey,
  deleteByUrl,
  headObject,
  ALLOWED_CT,
};
