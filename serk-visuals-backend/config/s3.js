// config/s3.js
const path = require("path");
const { randomUUID } = require("crypto");
const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");

const REGION = process.env.AWS_REGION;
const BUCKET = process.env.S3_BUCKET;
const CDN_BASE = process.env.CDN_URL || ""; // optional

if (!REGION || !BUCKET) {
  console.warn(
    "⚠️ AWS_REGION or S3_BUCKET not set; S3 will not work properly."
  );
}

const s3 = new S3Client({
  region: REGION,
  credentials: process.env.AWS_ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined, // allow instance/role creds too
});

const guessExt = (mimetype, originalname = "") => {
  const fromName = path.extname(originalname || "").toLowerCase();
  if (fromName) return fromName.replace(/^\./, "");
  const map = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/bmp": "bmp",
    "image/svg+xml": "svg",
  };
  return map[mimetype] || "bin";
};

const publicUrlForKey = (key) =>
  CDN_BASE
    ? `${CDN_BASE}/${key}`
    : `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;

/** Upload a buffer to S3 under uploads/gallery/YYYY/MM/<uuid>.<ext> */
async function uploadBufferToS3({
  buffer,
  mimetype,
  originalname,
  folder = "uploads/gallery",
}) {
  const now = new Date();
  const ext = guessExt(mimetype, originalname);
  const key = `${folder}/${now.getFullYear()}/${String(
    now.getMonth() + 1
  ).padStart(2, "0")}/${randomUUID()}.${ext}`;

  const uploader = new Upload({
    client: s3,
    params: {
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    },
  });
  await uploader.done();
  return { key, url: publicUrlForKey(key) };
}

/** Try to turn a public URL (S3 or CDN) back into an S3 key */
function keyFromUrl(url = "") {
  if (!url) return null;

  // CDN form: https://cdn.example.com/<key>
  if (CDN_BASE && url.startsWith(CDN_BASE + "/")) {
    return url.slice(CDN_BASE.length + 1);
  }

  // S3 form: https://bucket.s3.region.amazonaws.com/<key>
  const s3Prefix = `https://${BUCKET}.s3.${REGION}.amazonaws.com/`;
  if (url.startsWith(s3Prefix)) {
    return url.slice(s3Prefix.length);
  }

  // Fallback: if client still has legacy "/uploads/..." paths
  if (url.startsWith("/uploads/")) return url.replace(/^\//, "");

  return null;
}

async function deleteByUrl(url) {
  const Key = keyFromUrl(url);
  if (!Key) return;
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key }));
  } catch (e) {
    console.warn("S3 delete failed for", Key, e.message);
  }
}

module.exports = { uploadBufferToS3, deleteByUrl, keyFromUrl, publicUrlForKey };
