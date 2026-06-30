import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

/**
 * Get the upload root directory.
 * Uses UPLOAD_DIR env; falls back to cwd/uploads for local dev.
 */
export function getUploadRootDir(): string {
  return process.env.UPLOAD_DIR || join(process.cwd(), 'uploads')
}

/**
 * Ensure a sub-directory exists under the upload root.
 * Returns the absolute directory path.
 */
export function ensureUploadSubDir(subDir: string): string {
  const dir = join(getUploadRootDir(), subDir)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

/**
 * Build a public URL for an uploaded file.
 * Uses PUBLIC_UPLOAD_BASE_URL or falls back to relative /uploads/...
 */
export function toPublicUploadUrl(subDir: string, filename: string): string {
  const base = process.env.PUBLIC_UPLOAD_BASE_URL || '/uploads'
  return `${base}/${subDir}/${filename}`
}
