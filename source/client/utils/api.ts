import apifly, { ApiflyClient } from "jsr:@vseplet/apifly";
import type { GuardenDefinition } from "../../server/GuardenDefinition.ts";
import { getToken, removeToken, saveToken } from "./config.ts";
import { yellow } from "../deps.ts";

export async function createClient(): Promise<ApiflyClient<GuardenDefinition>> {
  const token = await getToken();

  return new apifly.client<GuardenDefinition>({
    baseURL: "http://localhost:8000/api/apifly",
    headers: token
      ? {
        Authorization: token,
      }
      : undefined,
    limiter: { unlimited: true },
  });
}

export async function generateToken(userId: string): Promise<string> {
  try {
    const client = await createClient(); // Создаём клиента Apifly
    const response = await client.call("generateToken", [userId]);

    if (!response.success) {
      throw new Error(response.message);
    }

    const token = response.token;
    await saveToken(token);
    return token;
  } catch (error) {
    if (error.message.includes("Неверный или просроченный токен")) {
      console.log(
        yellow("Локальный токен не найден в базе данных. Сбрасываем токен..."),
      );
      await removeToken();
    }
    throw new Error(`Ошибка при генерации токена: ${error.message}`);
  }
}

export async function createEnvironment(envName: string): Promise<string> {
  try {
    const client = await createClient();
    const response = await client.call("createEnvironment", [envName]);

    if (!response.success) {
      throw new Error(response.message);
    }

    return response.message;
  } catch (error) {
    throw new Error(`Ошибка при создании окружения: ${error.message}`);
  }
}

export async function selectEnvironment(
  envName: string,
): Promise<{ success: boolean; message: string }> {
  const client = await createClient();
  const response = await client.call("selectEnvironment", [envName]);
  return response;
}

export async function fetchSecrets(
  envName: string,
): Promise<{ secrets: Record<string, string>; currentEnv: string }> {
  try {
    const client = await createClient();
    const response = await client.call("fetchSecrets", [envName]);

    if (!response.success) {
      throw new Error(response.message);
    }

    return { secrets: response.secrets!, currentEnv: response.currentEnv };
  } catch (error) {
    throw new Error(`Ошибка при получении секретов: ${error.message}`);
  }
}

export async function addSecret(
  envName: string,
  key: string,
  value: string,
): Promise<string> {
  try {
    const client = await createClient();
    const response = await client.call("addSecret", [envName, key, value]);

    if (!response.success) {
      throw new Error(response.message);
    }

    return response.message;
  } catch (error) {
    throw new Error(`Ошибка при добавлении секрета: ${error.message}`);
  }
}

export async function updateSecret(
  envName: string,
  key: string,
  value: string,
): Promise<string> {
  try {
    const client = await createClient();
    const response = await client.call("updateSecret", [envName, key, value]);

    if (!response.success) {
      throw new Error(response.message);
    }

    return response.message;
  } catch (error) {
    throw new Error(`Ошибка при обновлении секрета: ${error.message}`);
  }
}

export async function deleteSecret(
  envName: string,
  key: string,
): Promise<string> {
  try {
    const client = await createClient();
    const response = await client.call("deleteSecret", [envName, key]);

    if (!response.success) {
      throw new Error(response.message);
    }

    return response.message;
  } catch (error) {
    throw new Error(`Ошибка при удалении секрета: ${error.message}`);
  }
}
