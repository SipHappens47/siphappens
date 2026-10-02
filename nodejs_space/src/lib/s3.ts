// Storage backend: Supabase Storage (replaces AWS S3 / Abacus).
// Uses the Storage REST API with the service/secret key. Function names are kept
// identical to the previous S3 module so the upload service is unchanged.

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const BUCKET = process.env.SUPABASE_BUCKET || 'uploads';
// Optional private bucket (SH-C04). When set, new private uploads are stored
// there under secure/<userId>/... and are only ever served through
// short-lived signed URLs. Unset: private uploads stay in BUCKET as before.
const PRIVATE_BUCKET = process.env.SUPABASE_PRIVATE_BUCKET || '';
const SIGNED_URL_TTL_SECONDS = 3600;

export function privateBucketConfigured(): boolean {
  return !!PRIVATE_BUCKET;
}

function bucketFor(cloud_storage_path: string): string {
  if (!cloud_storage_path.startsWith('secure/')) return BUCKET;
  if (!PRIVATE_BUCKET) {
    throw new Error('Private storage is not configured (SUPABASE_PRIVATE_BUCKET)');
  }
  return PRIVATE_BUCKET;
}

function assertConfig() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Supabase storage is not configured (SUPABASE_URL / SUPABASE_SERVICE_KEY)');
  }
}
const authHeaders = () => ({
  Authorization: `Bearer ${SUPABASE_KEY}`,
  apikey: SUPABASE_KEY,
});
// The caller (UploadService) generates the owner-namespaced path; see
// upload/storage-ownership.ts.
export async function generatePresignedUploadUrl(
  cloud_storage_path: string,
  _contentType: string,
): Promise<{ uploadUrl: string; cloud_storage_path: string }> {
  assertConfig();
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/upload/sign/${bucketFor(cloud_storage_path)}/${cloud_storage_path}`,
    { method: 'POST', headers: { ...authHeaders(), 'Content-Type': 'application/json' }, body: '{}' },
  );
  if (!res.ok) throw new Error(`Supabase sign-upload failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { url: string };
  // data.url is relative, e.g. "/object/upload/sign/uploads/<path>?token=..."
  return { uploadUrl: `${SUPABASE_URL}/storage/v1${data.url}`, cloud_storage_path };
}

export async function getFileUrl(
  cloud_storage_path: string,
  isPublic: boolean,
  _mode: 'view' | 'download' = 'view',
): Promise<string> {
  assertConfig();
  const bucket = bucketFor(cloud_storage_path);
  if (isPublic && bucket === BUCKET) {
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${cloud_storage_path}`;
  }
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/sign/${bucket}/${cloud_storage_path}`,
    {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ expiresIn: SIGNED_URL_TTL_SECONDS }),
    },
  );
  if (!res.ok) throw new Error(`Supabase sign-url failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { signedURL: string };
  return `${SUPABASE_URL}/storage/v1${data.signedURL}`;
}

export async function deleteFile(cloud_storage_path: string): Promise<void> {
  assertConfig();
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucketFor(cloud_storage_path)}/${cloud_storage_path}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`Supabase delete failed: ${res.status}`);
  }
}

// --- Multipart upload: not used by the app's image flow. Kept as stubs so imports resolve. ---
export async function initiateMultipartUpload(
  _fileName: string,
  _isPublic = false,
): Promise<{ uploadId: string; cloud_storage_path: string }> {
  throw new Error('Multipart upload is not supported with Supabase storage');
}
export async function getPresignedUrlForPart(
  _cloud_storage_path: string,
  _uploadId: string,
  _partNumber: number,
): Promise<string> {
  throw new Error('Multipart upload is not supported with Supabase storage');
}
export async function completeMultipartUpload(
  _cloud_storage_path: string,
  _uploadId: string,
  _parts: { ETag: string; PartNumber: number }[],
): Promise<void> {
  throw new Error('Multipart upload is not supported with Supabase storage');
}
