import { Command } from "../deps.ts";
import { createClient } from "../utils/api.ts";
import { getCurrentEnv, getCurrentProject } from "../utils/config.ts";
import { green, red } from "../deps.ts";

export function deleteSecretCommand() {
  return new Command()
    .description("Удалить секрет из текущего окружения.")
    .arguments("<key:string>")
    .action(async (options, key: string) => {
      try {
        const project = await getCurrentProject();
        const env = await getCurrentEnv();

        if (!project || !env) {
          console.error(red("Проект или окружение не выбрано."));
          return;
        }

        const client = await createClient();
        const response = await client.call("deleteSecret", [project, env, key]);

        if (!response.success) {
          console.error(red(`Ошибка удаления секрета: ${response.message}`));
          return;
        }

        console.log(
          green(
            `Секрет '${key}' успешно удален из окружения '${env}' проекта '${project}'.`,
          ),
        );
      } catch (error) {
        console.error(red(`Ошибка: ${error.message}`));
      }
    });
}
