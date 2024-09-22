import { createClient } from "./api.ts";
import { decryptText, encryptText } from "./crypto.ts";

const CONFIG_DIR = Deno.env.get("GUARDEN_CONFIG_DIR") ||
  `${Deno.env.get("HOME")}/.guarden`;
const TOKEN_FILE = `${CONFIG_DIR}/token.enc`;

async function ensureConfigDir() {
  try {
    await Deno.stat(CONFIG_DIR);
  } catch {
    await Deno.mkdir(CONFIG_DIR, { recursive: true });
  }
}

export async function saveToken(token: string) {
  await ensureConfigDir();
  const encryptedToken = await encryptText(token);
  await Deno.writeTextFile(TOKEN_FILE, encryptedToken);
}

export async function getToken(): Promise<string | null> {
  const envToken = Deno.env.get("GUARDEN_TOKEN");
  if (envToken) {
    return envToken;
  }

  try {
    const encryptedToken = await Deno.readTextFile(TOKEN_FILE);
    const token = await decryptText(encryptedToken);
    return token;
  } catch {
    return null;
  }
}

export async function getEnv(): Promise<string | null> {
  const client = await createClient();

  const response = await client.call("getCurrentEnvironment", []);

  if (!response.success || !response.currentEnv) {
    return null;
  }

  return response.currentEnv;
}

export async function setCurrentEnv(env: string) {
  Deno.env.set("GUARDEN_ENV", env);
}

export async function getCurrentEnv(): Promise<string | null> {
  let env = Deno.env.get("GUARDEN_ENV");
  if (!env) {
    return await getEnv();
  }
  return env;
}

export async function removeToken() {
  try {
    await Deno.remove(TOKEN_FILE);
  } catch {}
}
