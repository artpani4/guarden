import { Hono } from "./deps.ts";
import apifly from "@vseplet/apifly";
import type { GuardenDefinition } from "./GuardenDefinition.ts";
import { crypto } from "./deps.ts";

const kv = await Deno.openKv("./database");

async function generateToken(userId: string): Promise<string> {
  const token = crypto.randomUUID();
  await kv.set(["tokens", token], userId);
  return token;
}

async function createEnvironment(
  userId: string,
  envName: string,
): Promise<string> {
  const envEntry = await kv.get([userId, "envs", envName]);
  if (envEntry.value) {
    return `Окружение '${envName}' уже существует.`;
  }

  await kv.set([userId, "envs", envName], {});
  return `Окружение '${envName}' успешно создано.`;
}

async function loadState(args: { token: string | null }) {
  const { token } = args;

  if (!token) {
    console.log("No auth token provided. Proceeding without auth.");
    return [{ token: null, currentEnv: null, secrets: {} }, null];
  }

  const tokenEntry = await kv.get(["tokens", token]);
  if (!tokenEntry.value) {
    console.error("Invalid or expired token. Removing local token.");

    return [
      {},
      new Error(
        "Неверный или просроченный токен. Пожалуйста, сгенерируйте новый токен.",
      ),
    ];
  }

  const currentEnvEntry = await kv.get([token, "currentEnv"]);
  const currentEnv = currentEnvEntry?.value || null;

  const secrets: Record<string, Record<string, string>> = {};
  const secretsList = await kv.list({ prefix: [token, "envs"] });

  for await (const entry of secretsList) {
    const envName = entry.key[2] as string;
    //@ts-ignore
    secrets[envName] = entry.value;
  }

  return [{ token, currentEnv, secrets }, null];
}

async function unloadState(args: { token: string | null; state: any }) {
  const { token, state } = args;

  if (!token) {
    console.error("No auth token provided for unload.");
    return;
  }

  if (state.currentEnv) {
    await kv.set([token, "currentEnv"], state.currentEnv);
  }

  for (const envName of Object.keys(state.secrets)) {
    await kv.set([token, "envs", envName], state.secrets[envName]);
  }
}

const apiflyManager = new apifly.manager<GuardenDefinition>(
  false, // TODO: у апифлая пока проблемы с кэшированием
  5000,
  "token",
)
  //@ts-ignore
  .load(loadState)
  //@ts-ignore
  .unload(unloadState)
  .procedure("generateToken", async (args, state) => {
    const [userId] = args;

    const existingTokenEntry = await kv.list({ prefix: ["tokens"] });
    for await (const token of existingTokenEntry) {
      if (token.value === userId) {
        return {
          success: false,
          message: `Токен для пользователя '${userId}' уже существует.`,
          token: "",
        };
      }
    }

    const token = await generateToken(userId);
    state.token = token;
    return {
      success: true,
      message: `Токен успешно создан для пользователя '${userId}'.`,
      token,
    };
  })
  .procedure("getEnvironments", async (args, state) => {
    const environments: string[] = [];
    const envsList = await kv.list({ prefix: [state.token!, "envs"] });

    for await (const entry of envsList) {
      const envName = entry.key[2] as string;
      environments.push(envName);
    }

    return {
      success: true,
      environments,
    };
  })
  .procedure("getCurrentEnvironment", async (args, state) => {
    const currentEnvEntry = await kv.get([state.token!, "currentEnv"]);
    const currentEnv = currentEnvEntry?.value as string || null;

    return {
      success: true,
      currentEnv,
    };
  })
  .procedure("selectEnvironment", async (args, state) => {
    const [envName] = args;

    const environmentsEntry = await kv.get([state.token!, "envs", envName]);
    const environment = environmentsEntry.value as string | null;

    if (environment === null) {
      return { success: false, message: `Окружение '${envName}' не найдено.` };
    }

    state.currentEnv = envName;
    return {
      success: true,
      message: `Окружение '${envName}' успешно выбрано.`,
    };
  })
  .procedure("createEnvironment", async (args, state) => {
    const [envName] = args;
    const userId = state.token!;

    const envEntry = await kv.get([userId, "envs", envName]);
    if (envEntry.value) {
      return {
        success: false,
        message: `Окружение '${envName}' уже существует.`,
      };
    }

    await createEnvironment(userId, envName);
    return {
      success: true,
      message: `Окружение '${envName}' успешно создано.`,
    };
  })
  .procedure("fetchSecrets", async (args, state) => {
    const [envName] = args;

    if (!state.secrets[envName]) {
      return {
        currentEnv: "",
        success: false,
        message: `Окружение '${envName}' не найдено.`,
      };
    }

    try {
      return {
        currentEnv: state.currentEnv!,
        success: true,
        secrets: state.secrets[envName],
      };
    } catch (error) {
      return {
        currentEnv: "",
        success: false,
        message: `Ошибка при получении секретов: ${error.message}`,
      };
    }
  })
  .procedure("addSecret", async (args, state) => {
    const [envName, key, value] = args;

    if (!state.secrets[envName]) {
      return { success: false, message: `Окружение '${envName}' не найдено.` };
    }

    if (state.secrets[envName][key]) {
      return {
        success: false,
        message:
          `Секрет с ключом '${key}' уже существует в окружении '${envName}'.`,
      };
    }

    state.secrets[envName][key] = value;
    return {
      success: true,
      message: `Секрет '${key}' добавлен в окружение '${envName}'.`,
    };
  })
  .procedure("updateSecret", async (args, state) => {
    const [envName, key, value] = args;

    if (!state.secrets[envName]) {
      return { success: false, message: `Окружение '${envName}' не найдено.` };
    }

    if (!(key in state.secrets[envName])) {
      return {
        success: false,
        message: `Ключ '${key}' не найден в окружении '${envName}'.`,
      };
    }

    state.secrets[envName][key] = value;
    return {
      success: true,
      message:
        `Значение для ключа '${key}' в окружении '${envName}' обновлено.`,
    };
  })
  .procedure("deleteSecret", async (args, state) => {
    const [envName, key] = args;

    if (!state.secrets[envName]) {
      return { success: false, message: `Окружение '${envName}' не найдено.` };
    }

    if (!(key in state.secrets[envName])) {
      return {
        success: false,
        message: `Ключ '${key}' не найден в окружении '${envName}'.`,
      };
    }

    delete state.secrets[envName][key];
    return {
      success: true,
      message: `Ключ '${key}' успешно удалён из окружения '${envName}'.`,
    };
  })
  .filter("token", () => false)
  .guard("token", async (state) => {
    const { token } = state;
    if (!token) return false;

    const tokenEntry = await kv.get(["tokens", token]);
    return !!tokenEntry.value;
  });

const apiflyServer = new apifly.server<GuardenDefinition>(
  apiflyManager,
  "/api/apifly",
  {
    token: "Authorization",
  },
);

const app = new Hono();

//@ts-ignore
apiflyServer.registerRoutes(app);

console.log("Сервер Guarden запущен на порту 8000");
await Deno.serve(app.fetch);
