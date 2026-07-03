import { Storage } from "@google-cloud/storage"

// Autenticado via Application Default Credentials (identidade da service account
// anexada ao Cloud Run) — nenhuma chave/token em código ou variável de ambiente.
const storage = new Storage()

function getBucket() {
  const bucketName = process.env.GCS_BUCKET_NAME
  if (!bucketName) {
    throw new Error("GCS_BUCKET_NAME não configurado")
  }
  return storage.bucket(bucketName)
}

export async function uploadFile(buffer: Buffer, path: string, contentType: string): Promise<string> {
  const bucket = getBucket()
  const file = bucket.file(path)
  await file.save(buffer, { contentType, resumable: false })
  return path
}

export async function getSignedDownloadUrl(path: string, expiresInMinutes = 15): Promise<string> {
  const bucket = getBucket()
  const file = bucket.file(path)
  const [url] = await file.getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + expiresInMinutes * 60 * 1000,
  })
  return url
}
