/**
 * Storage Service — Product Images
 * ---------------------------------------------------------------
 * Uses the direct-to-storage upload pattern: the browser uploads the
 * file straight to object storage using a short-lived signed URL,
 * rather than routing the file through this Express server. This
 * matters especially on free-tier hosting (Render, etc.) where
 * proxying large binary uploads through the app server eats into
 * limited memory/bandwidth for no benefit.
 *
 * Works with any S3-compatible provider — AWS S3, Cloudflare R2,
 * Backblaze B2, MinIO — by pointing S3_ENDPOINT at that provider.
 * Configured entirely via environment variables (infra credentials,
 * not a business setting, so this intentionally isn't dashboard-
 * configurable the way OTP providers are).
 * ---------------------------------------------------------------
 */

const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');

const BUCKET = process.env.S3_BUCKET;
const PUBLIC_URL_BASE = process.env.S3_PUBLIC_URL_BASE; // e.g. https://pub-xxxx.r2.dev or a CDN domain in front of the bucket

function isConfigured() {
  return !!(process.env.S3_ENDPOINT && process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY);
}

function getClient() {
  return new S3Client({
    region: process.env.S3_REGION || 'auto',
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
  });
}

const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8MB per image

/**
 * Generate a presigned PUT URL the browser can upload directly to.
 * Returns both the upload URL (short-lived, used once) and the
 * eventual public URL to store once the upload succeeds.
 */
async function createUploadUrl({ productId, filename, contentType }) {
  if (!isConfigured()) {
    throw new Error('Image storage is not configured. Set S3_* environment variables.');
  }

  if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
    throw new Error(`Unsupported file type: ${contentType}. Allowed: ${ALLOWED_CONTENT_TYPES.join(', ')}`);
  }

  const extension = filename.split('.').pop().toLowerCase();
  const key = `products/${productId}/${crypto.randomUUID()}.${extension}`;

  const client = getClient();
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 }); // 5 minutes to complete the upload
  const publicUrl = `${PUBLIC_URL_BASE}/${key}`;

  return { uploadUrl, publicUrl, key };
}

/**
 * Delete an object from storage given its public URL (reverses the
 * PUBLIC_URL_BASE prefix to recover the storage key).
 */
async function deleteObject(publicUrl) {
  if (!isConfigured()) return; // nothing to clean up if storage was never configured

  const key = publicUrl.replace(`${PUBLIC_URL_BASE}/`, '');
  const client = getClient();
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

/**
 * Uploads a buffer directly from the server (not via presigned URL).
 * Used specifically by the "import from URL" feature, where the server
 * itself has already downloaded the external image and needs to copy
 * it into our own storage — there's no browser file input involved in
 * that flow, so the presigned-URL pattern used by createUploadUrl()
 * doesn't apply here.
 */
async function uploadBuffer({ buffer, contentType, keyPrefix }) {
  if (!isConfigured()) {
    throw new Error('Image storage is not configured. Set S3_* environment variables.');
  }

  const extension = contentType.split('/')[1] || 'jpg';
  const key = `${keyPrefix}/${crypto.randomUUID()}.${extension}`;

  const client = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return `${PUBLIC_URL_BASE}/${key}`;
}

module.exports = {
  isConfigured,
  createUploadUrl,
  uploadBuffer,
  deleteObject,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_CONTENT_TYPES,
};
