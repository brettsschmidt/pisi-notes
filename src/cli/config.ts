import { homedir } from "node:os";
import { join } from "node:path";
import { mkdir, readFile, writeFile, unlink, chmod } from "node:fs/promises";

const CONFIG_DIR =
  process.env.XDG_CONFIG_HOME ?
    join(process.env.XDG_CONFIG_HOME, "pisi-notes") :
    join(homedir(), ".config", "pisi-notes");

const SESSION_PATH = join(CONFIG_DIR, "session.json");

export interface StoredSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user_email: string;
  supabase_url: string;
}

export async function ensureConfigDir(): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 });
}

export async function readSession(): Promise<StoredSession | null> {
  try {
    const raw = await readFile(SESSION_PATH, "utf8");
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

export async function writeSession(session: StoredSession): Promise<void> {
  await ensureConfigDir();
  await writeFile(SESSION_PATH, JSON.stringify(session, null, 2), { mode: 0o600 });
  await chmod(SESSION_PATH, 0o600);
}

export async function clearSession(): Promise<void> {
  try {
    await unlink(SESSION_PATH);
  } catch {
    // not present
  }
}

export function getConfigPaths() {
  return { configDir: CONFIG_DIR, sessionPath: SESSION_PATH };
}
