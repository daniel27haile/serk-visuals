// utils/s3-helpers.js
const path = require("path");
const { randomUUID } = require("crypto");
const { Upload } = require("@aws-sdk/lib-storage");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { s3, BUCKET } = require("../config/s3");

function buildKey(originalname, prefix = "uploads/gallery") {
  const now = new Date();
  const ext = (path.extname(originalname) || ".bin").toLowerCase();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const key = `${prefix}/${yyyy}/${mm}/${randomUUID()}${ext}`;
  return key;
}

function publicUrlFor(key) {
  if (process.env.CDN_URL) return `${process.env.CDN_URL}/${key}`;
  return `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

async function putBuffer({ buffer, mimetype, originalname, key }) {
  const finalKey = key || buildKey(originalname);
  const uploader = new Upload({
    client: s3,
    params: {
      Bucket: BUCKET,
      Key: finalKey,
      Body: buffer,
      ContentType: mimetype,
    },
  });
  await uploader.done();
  return { key: finalKey, url: publicUrlFor(finalKey) };
}

async function deleteObject(key) {
  if (!key) return;
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

module.exports = { putBuffer, deleteObject, publicUrlFor, buildKey };
