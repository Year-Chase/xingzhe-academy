import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

/**
 * Load .env file into process.env (does NOT override existing env vars).
 * Runs once at module import time.
 */
export function loadEnv() {
  const envPath = join(process.cwd(), '.env')
  if (!existsSync(envPath)) return

  const lines = readFileSync(envPath, 'utf-8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    // Only set if not already defined (existing env takes priority)
    if (key && process.env[key] === undefined) {
      let val = trimmed.slice(eqIdx + 1).trim()
      // Strip surrounding quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      process.env[key] = val
    }
  }
}
