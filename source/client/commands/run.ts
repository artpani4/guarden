import { Command } from "../deps.ts";
import { fetchSecrets } from "../utils/api.ts";
import { getEnv, getToken } from "../utils/config.ts";
import { green, red, yellow } from "../deps.ts";

export function runCommand() {
  return new Command()
    .description(
      "Выполнить команду с доступными секретами как переменными окружения.",
    )
    .arguments("<command...:string>")
    .action(async (options, ...command: string[]) => {
      try {
        const env = await getEnv();
        const token = await getToken();

        if (!env) {
          console.error(
            yellow(
              "Окружение не выбрано. Пожалуйста, выберите окружение с помощью команды 'select'.",
            ),
          );
          Deno.exit(1);
        }

        if (!token) {
          console.error(
            yellow(
              "Токен не найден. Пожалуйста, сгенерируйте токен с помощью команды 'generate'.",
            ),
          );
          Deno.exit(1);
        }

        const { secrets, currentEnv } = await fetchSecrets(env);

        const cmd = command.join(" ");

        const process = Deno.run({
          cmd: ["sh", "-c", cmd],
          env: { ...Deno.env.toObject(), ...secrets },
          stdout: "inherit",
          stderr: "inherit",
        });

        const status = await process.status();
        process.close();

        if (status.success) {
          console.log(green("Команда успешно выполнена."));
        } else {
          console.error(red("Команда завершилась с ошибкой."));
          Deno.exit(status.code);
        }
      } catch (error) {
        console.error(red(`Ошибка: ${error.message}`));
      }
    });
}
