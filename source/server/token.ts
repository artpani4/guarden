import { kv } from "./server.ts";

export async function generateToken(userId: string): Promise<string> {
  const token = crypto.randomUUID();
  await kv.set(["tokens", token], userId);
  return token;
}
