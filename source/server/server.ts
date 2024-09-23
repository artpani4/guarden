import { Hono } from "./deps.ts";
import apifly from "@vseplet/apifly";
import type { GuardenDefinition } from "./GuardenDefinition.ts";
import { generateToken } from "./token.ts";

export const kv = await Deno.openKv();

export type TProjects = Record<string, ProjectData>;
export interface ProjectData {
  uuid: string;
  environments: Record<string, Record<string, string>>;
  name: string;
}

const apiflyManager = new apifly.manager<GuardenDefinition>(
  false, // TODO: у апифлая пока проблемы с кэшированием
  5000,
  "token",
)
  .load(async (args) => {
    const { token } = args;
    if (!token) return [{ token: null, projects: [] as ProjectData[] }, null];
    // Инициализируем состояние
    const state = {
      token: token,
      projects: [] as ProjectData[],
    };

    try {
      // Получаем все joint записи, связанные с токеном
      const jointEntries = kv.list({ prefix: ["joint", token] });

      for await (const jointEntry of jointEntries) {
        const projectUUID = jointEntry.key[2] as string;

        // Загружаем данные проекта
        const projectEntry = await kv.get<ProjectData>([
          "projects",
          projectUUID,
        ]);
        console.log(projectEntry);
        if (projectEntry.value) {
          state.projects.push({
            uuid: projectUUID,
            name: projectEntry.value.name,
            environments: projectEntry.value.environments,
          });
        }
      }
    } catch (error) {
      console.error(`Error loading state for token ${token}: ${error.message}`);
      return [{} as typeof state, null];
    }
    console.log(state);
    return [state, null];
  })
  .unload(async (args) => {
    const { token, state } = args;

    for (const project of state.projects) {
      const projectKey = ["projects", project.uuid];

      // Получаем текущие данные проекта
      const projectEntry = await kv.get(projectKey);
      const jointKey = ["joint", token!, projectKey[1]];

      // Стартуем транзакцию
      let res = { ok: false };
      while (!res.ok) {
        try {
          // Если проект существует, проверяем его текущую версию и обновляем
          if (projectEntry.value) {
            res = await kv.atomic()
              .check(projectEntry) // Проверяем, что проект не был изменен
              .set(projectKey, {
                name: project.name,
                environments: project.environments,
              }) // Обновляем проект
              .set(jointKey, {}) // Обновляем связь joint
              .commit();
          } else {
            // Если проекта нет, создаем новый
            res = await kv.atomic()
              .set(projectKey, {
                name: project.name,
                environments: project.environments,
              }) // Создаем новый проект
              .set(jointKey, {}) // Создаем связь joint
              .commit();
          }
        } catch (error) {
          throw new Error(`Transaction error: ${error.message}`);
        }
      }
    }
    return null;
  })
  .procedure("createProject", async (args, state) => {
    const [projectName] = args;
    const token = state.token;
    console.log(state);
    try {
      const projectUUID = crypto.randomUUID();
      const environments = { dev: {}, prod: {} };

      // Добавляем новый проект в состояние
      state.projects.push({
        uuid: projectUUID,
        name: projectName,
        environments,
      });

      // joint связь теперь будет обработана во время unload
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  })
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
  .procedure("addSecret", async (args, state) => {
    const [projectName, envName, key, value] = args;
    const token = state.token;

    // Ищем проект
    const project = state.projects.find((p) => p.name === projectName);
    if (!project) {
      return { success: false, message: `Проект '${projectName}' не найден.` };
    }

    // Проверяем, есть ли указанное окружение
    if (!project.environments[envName]) {
      return { success: false, message: `Окружение '${envName}' не найдено.` };
    }

    // Проверяем, существует ли ключ
    if (project.environments[envName][key]) {
      return {
        success: false,
        message:
          `Секрет с ключом '${key}' уже существует в окружении '${envName}(используй update)'.`,
      };
    }

    // Если ключа нет, добавляем новый секрет
    project.environments[envName][key] = value;

    return { success: true, message: "Секрет успешно добавлен." };
  })
  .procedure("updateSecret", async (args, state) => {
    const [projectName, envName, key, value] = args;
    const token = state.token;

    const project = state.projects.find((p) => p.name === projectName);
    if (!project) {
      return { success: false, message: `Проект '${projectName}' не найден.` };
    }

    if (!project.environments[envName]) {
      return { success: false, message: `Окружение '${envName}' не найдено.` };
    }

    // Обновляем секрет
    if (!project.environments[envName][key]) {
      return { success: false, message: `Секрет с ключом '${key}' не найден.` };
    }

    project.environments[envName][key] = value;
    return { success: true, message: "Секрет успешно обновлён." };
  })
  .procedure("deleteSecret", async (args, state) => {
    const [projectName, envName, key] = args;
    const token = state.token;

    const project = state.projects.find((p) => p.name === projectName);
    if (!project) {
      return { success: false, message: `Проект '${projectName}' не найден.` };
    }

    if (!project.environments[envName]) {
      return { success: false, message: `Окружение '${envName}' не найдено.` };
    }

    // Удаляем секрет
    if (!project.environments[envName][key]) {
      return { success: false, message: `Секрет с ключом '${key}' не найден.` };
    }

    delete project.environments[envName][key];
    return { success: true, message: "Секрет успешно удалён." };
  })
  .procedure("fetchSecrets", async (args, state) => {
    const [projectName, envName] = args;

    const project = state.projects.find((p) => p.name === projectName);
    if (!project) {
      return { success: false, secrets: {} };
    }

    const environmentSecrets = project.environments[envName];
    if (!environmentSecrets) {
      return { success: false, secrets: {} };
    }

    return {
      success: true,
      secrets: environmentSecrets,
      project: projectName,
      environment: envName,
    };
  })
  .procedure("createEnvironment", async (args, state) => {
    const [projectName, envName] = args;
    const token = state.token;

    const project = state.projects.find((p) => p.name === projectName);

    if (!project) {
      return { success: false, message: `Проект '${projectName}' не найден.` };
    }

    if (project.environments[envName]) {
      return {
        success: false,
        message: `Окружение '${envName}' уже существует.`,
      };
    }

    project.environments[envName] = {}; // Создаем новое пустое окружение

    return { success: true, message: "Успешно создано!" };
  })
  .procedure("deleteProject", async (args, state) => {
    const [projectName] = args;
    const token = state.token;

    const projectIndex = state.projects.findIndex((p) =>
      p.name === projectName
    );
    if (projectIndex === -1) {
      return { success: false, message: `Проект '${projectName}' не найден.` };
    }

    const projectUUID = state.projects[projectIndex].uuid;

    try {
      // Удаление проекта из состояния
      state.projects.splice(projectIndex, 1);

      // Удаление записи о проекте в базе данных
      await kv.delete(["projects", projectUUID]);

      // Удаление связей joint
      await kv.delete(["joint", token!, projectUUID]);

      return {
        success: true,
        message: `Проект '${projectName}' успешно удален.`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Ошибка при удалении проекта: ${error.message}`,
      };
    }
  })
  .procedure("renameProject", async (args, state) => {
    const [oldProjectName, newProjectName] = args;

    const project = state.projects.find((p) => p.name === oldProjectName);
    if (!project) {
      return {
        success: false,
        message: `Проект '${oldProjectName}' не найден.`,
      };
    }

    try {
      // Проверка, что проект с новым именем не существует
      const existingProject = state.projects.find((p) =>
        p.name === newProjectName
      );
      if (existingProject) {
        return {
          success: false,
          message: `Проект с именем '${newProjectName}' уже существует.`,
        };
      }

      // Обновление имени проекта в состоянии
      project.name = newProjectName;

      return {
        success: true,
        message: `Проект успешно переименован в '${newProjectName}'.`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Ошибка при переименовании проекта: ${error.message}`,
      };
    }
  })
  .procedure("renameEnvironment", async (args, state) => {
    const [projectName, oldEnvName, newEnvName] = args;
    const token = state.token;

    try {
      // Находим проект
      const project = state.projects.find((p) => p.name === projectName);

      if (!project) {
        return {
          success: false,
          message: `Проект '${projectName}' не найден.`,
        };
      }

      // Проверяем, существует ли старое окружение
      if (!project.environments[oldEnvName]) {
        return {
          success: false,
          message:
            `Окружение '${oldEnvName}' не найдено в проекте '${projectName}'.`,
        };
      }

      // Проверяем, нет ли уже окружения с новым названием
      if (project.environments[newEnvName]) {
        return {
          success: false,
          message:
            `Окружение с именем '${newEnvName}' уже существует в проекте '${projectName}'.`,
        };
      }

      // Переименовываем окружение
      project.environments[newEnvName] = project.environments[oldEnvName];
      delete project.environments[oldEnvName];

      // joint связь будет обновлена при вызове unload
      return {
        success: true,
        message:
          `Окружение '${oldEnvName}' успешно переименовано в '${newEnvName}' в проекте '${projectName}'.`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Ошибка при переименовании окружения: ${error.message}`,
      };
    }
  })
  .procedure("inviteUserToProject", async (args, state) => {
    const [inviteeUsername, projectName] = args;
    const token = state.token;

    // Находим проект по имени
    const project = state.projects.find((p) => p.name === projectName);
    if (!project) {
      return { success: false, message: `Проект '${projectName}' не найден.` };
    }

    // Проверяем, существует ли пользователь (например, через таблицу токенов)
    const userEntry = await kv.list({ prefix: ["tokens"] });
    let inviteeToken: string | null = null;

    for await (const user of userEntry) {
      if (user.value === inviteeUsername) {
        inviteeToken = user.key[1] as string;
        break;
      }
    }

    if (!inviteeToken) {
      return {
        success: false,
        message: `Пользователь '${inviteeUsername}' не найден.`,
      };
    }

    // Проверяем, не связан ли пользователь уже с проектом
    const jointEntry = await kv.get(["joint", inviteeToken, project.uuid]);
    if (jointEntry.value) {
      return {
        success: false,
        message: `Пользователь уже приглашен в проект '${projectName}'.`,
      };
    }

    // Создаем запись в joint для связи пользователя с проектом
    await kv.set(["joint", inviteeToken, project.uuid], {});

    return {
      success: true,
      message:
        `Пользователь '${inviteeUsername}' успешно приглашен в проект '${projectName}'.`,
    };
  })
  .procedure("checkUserExists", async (args, state) => {
    const [username] = args;

    // Поиск по префиксу "tokens", где значения представляют собой имена пользователей
    const userEntry = await kv.list({ prefix: ["tokens"] });

    let userExists = false;

    for await (const user of userEntry) {
      if (user.value === username) {
        userExists = true;
        break;
      }
    }

    if (!userExists) {
      return {
        success: false,
        message: `Пользователь '${username}' не найден.`,
      };
    }

    return { success: true, message: `Пользователь '${username}' найден.` };
  })
  .filter("token", () => false)
  .guard("token", async ({ currentValue, newValue, state }) => {
    if (currentValue === null) return true;
    const { token } = state;
    const tokenEntry = await kv.get(["tokens", token!]);

    return tokenEntry.value !== null;
  });

const apiflyServer = new apifly.server<GuardenDefinition>(
  apiflyManager,
  "/api/apifly",
  //@ts-ignore
  {
    token: "Authorization",
  },
);

const app = new Hono();

//@ts-ignore
apiflyServer.registerRoutes(app);

console.log("Сервер Guarden запущен на порту 8000");
await Deno.serve(app.fetch);
