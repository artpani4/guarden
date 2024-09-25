import { Command } from "../deps.ts";
import { createClient } from "../utils/api.ts";
import { getCurrentEnv, getCurrentProject } from "../utils/config.ts";
import { green, red, yellow } from "../deps.ts";

export function fetchAndSetSecretsCommand() {
  return new Command()
    .description(
      "Получить секреты для текущего окружения и установить их в переменные окружения.",
    )
    .action(async () => {
      try {
        const project = await getCurrentProject();
        const env = await getCurrentEnv();

        if (!project || !env) {
          console.error(red("Проект или окружение не выбрано."));
          return;
        }

        const client = await createClient();
        const response = await client.call("fetchSecrets", [project, env]);

        if (!response.success) {
          console.error(red(`Ошибка получения секретов: ${response.error}`));
          return;
        }

        const { secrets } = response;

        if (Object.keys(secrets).length === 0) {
          console.log(
            green(
              `Нет секретов в окружении '${env}' проекта '${project}'.`,
            ),
          );
          return;
        }

        // Устанавливаем секреты в переменные окружения
        for (const [key, value] of Object.entries(secrets)) {
          Deno.env.set(key, value);
          console.log(yellow(`Установлена переменная окружения: ${key}`));
        }

        console.log(
          green(
            `Все секреты для проекта '${project}' и окружения '${env}' успешно установлены как переменные окружения.`,
          ),
        );
      } catch (error) {
        console.error(red(`Ошибка: ${error.message}`));
      }
    });
}
