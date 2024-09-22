import { Command } from "../deps.ts";
import { fetchSecrets } from "../utils/api.ts";
import { getEnv } from "../utils/config.ts";
import { green, red, yellow } from "../deps.ts";

export function fetchSecretsCommand() {
  return new Command()
    .description(
      "Получить секреты для выбранного окружения и экспортировать их как переменные окружения.",
    )
    .option("-e, --env <environment:string>", "Название окружения.")
    .action(async (options) => {
      try {
        const env = options.env || await getEnv();

        if (!env) {
          console.error(
            yellow(
              "Окружение не выбрано. Выберите окружение с помощью команды 'select'.",
            ),
          );
          Deno.exit(1);
        }

        const { secrets, currentEnv } = await fetchSecrets(env);
        console.log(`Текущее окружение: ${currentEnv}`);
        for (const [key, value] of Object.entries(secrets)) {
          Deno.env.set(key, value);

          console.log(`Экспортировано ${key}: ${value}`);
        }

        console.log(green("Секреты успешно загружены в переменные окружения."));
      } catch (error) {
        console.error(red(`Ошибка: ${error.message}`));
      }
    });
}
