import { Command } from "../deps.ts";
import { addSecret } from "../utils/api.ts";
import { getEnv } from "../utils/config.ts";
import { green, red, yellow } from "../deps.ts";
export function addSecretCommand() {
  return new Command()
    .description("Добавить новый секрет (ключ-значение) в текущее окружение.")
    .arguments("<key:string> <value:string>")
    .action(async (options, key: string, value: string) => {
      try {
        const env = await getEnv();

        if (!env) {
          console.error(
            yellow(
              "Окружение не выбрано. Выберите окружение с помощью команды 'select'.",
            ),
          );
          Deno.exit(1);
        }

        const result = await addSecret(env, key, value);
        console.log(green(result));
      } catch (error) {
        console.error(red(`Ошибка: ${error.message}`));
      }
    });
}
