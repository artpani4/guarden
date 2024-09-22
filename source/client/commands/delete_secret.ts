import { Command, yellow } from "../deps.ts";
import { deleteSecret } from "../utils/api.ts";
import { green, red } from "../deps.ts";
import { getEnv } from "../utils/config.ts";

export function deleteSecretCommand() {
  return new Command()
    .description("Удалить секрет из текущего окружения.")
    .arguments("<key:string>")
    .action(async (options, key: string) => {
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

        const result = await deleteSecret(env, key);
        console.log(green(result));
      } catch (error) {
        console.error(red(`Ошибка: ${error.message}`));
      }
    });
}
