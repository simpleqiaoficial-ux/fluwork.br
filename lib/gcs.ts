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

// Baixa o arquivo inteiro no servidor pra ser servido pelo próprio domínio da plataforma —
// o usuário nunca deve ver a URL do bucket (nem via redirect pra signed URL). Usa a mesma
// identidade autenticada (ADC) já usada pra upload, sem precisar assinar nada.
export async function downloadFile(path: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  const bucket = getBucket()
  const file = bucket.file(path)
  try {
    const [metadata] = await file.getMetadata()
    const [buffer] = await file.download()
    return { buffer, contentType: (metadata.contentType as string) || "application/octet-stream" }
  } catch {
    return null
  }
}
