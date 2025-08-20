import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const bucket = process.env.S3_BUCKET;
const region = process.env.AWS_REGION || 'us-east-1';

let s3Client: S3Client | null = null;
function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({ region });
  }
  return s3Client;
}

/**
 * Upload a file buffer to S3 and return a publicly accessible URL.  If no
 * S3 bucket is configured, throws.
 */
export async function uploadToS3(key: string, body: Buffer, contentType: string): Promise<string> {
  if (!bucket) throw new Error('S3_BUCKET is not configured');
  const client = getS3Client();
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
  // Return just the key; the URL will be generated on demand.
  return key;
}

/**
 * Generate a pre‑signed URL for a given key.  If S3 credentials are not configured,
 * return null.  The expiration time can be customized via the S3_URL_EXPIRES env.
 */
export async function getSignedUrlForKey(key: string): Promise<string | null> {
  if (!bucket) return null;
  const client = getS3Client();
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const expiresIn = process.env.S3_URL_EXPIRES ? parseInt(process.env.S3_URL_EXPIRES, 10) : 3600;
  return await getSignedUrl(client, command, { expiresIn });
}