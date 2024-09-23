import { decryptText, encryptText } from "./crypto.ts";

const CONFIG_DIR = Deno.env.get("GUARDEN_CONFIG_DIR") ||
  `${Deno.env.get("HOME")}/.guarden`;
const TOKEN_FILE = `${CONFIG_DIR}/token.enc`;
const CONFIG_FILE = `${CONFIG_DIR}/config.json`;

interface Config {
  currentProject?: string;
  currentEnv?: string;
}

async function readConfig(): Promise<Config> {
  try {
    const data = await Deno.readTextFile(CONFIG_FILE);
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
}

async function saveConfig(config: Config) {
  const data = JSON.stringify(config, null, 2);
  await Deno.writeTextFile(CONFIG_FILE, data);
}

export async function setCurrentProject(project: string) {
  const config = await readConfig();
  config.currentProject = project;
  await saveConfig(config);
}

export async function setCurrentEnv(env: string) {
  const config = await readConfig();
  config.currentEnv = env;
  await saveConfig(config);
}

export async function getCurrentProject(): Promise<string | null> {
  const config = await readConfig();
  return config.currentProject || null;
}

export async function getCurrentEnv(): Promise<string | null> {
  const config = await readConfig();
  return config.currentEnv || null;
}

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
    Deno.env.set("GUARDEN_TOKEN", token);
    return token;
  } catch {
    return null;
  }
}

export async function removeToken() {
  try {
    Deno.env.delete("GUARDEN_TOKEN");
    await Deno.remove(TOKEN_FILE);
  } catch {}
}
