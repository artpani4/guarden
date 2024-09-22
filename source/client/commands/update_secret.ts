import { Command } from "../deps.ts";
import { updateSecret } from "../utils/api.ts";
import { getEnv } from "../utils/config.ts";
import { green, red, yellow } from "../deps.ts";

export function updateSecretCommand() {
  return new Command()
    .description("Изменить значение существующего секрета в текущем окружении.")
    .arguments("<key:string> <value:string>")
    .action(async (options, key: string, value: string) => {
      try {
        const env = await getEnv();

        if (!env) {
          console.error(
            yellow(
              "Окружение не выбрано. Пожалуйста, выберите окружение с помощью команды 'select'.",
            ),
          );
          Deno.exit(1);
        }

        const result = await updateSecret(env, key, value);
        console.log(green(result));
      } catch (error) {
        console.error(red(`Ошибка: ${error.message}`));
      }
    });
}
