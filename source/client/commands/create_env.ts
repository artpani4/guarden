import { Command } from "../deps.ts";
import { createClient } from "../utils/api.ts";
import { getCurrentProject } from "../utils/config.ts";
import { green, red } from "../deps.ts";
import { Input } from "https://deno.land/x/cliffy@v1.0.0-rc.4/prompt/input.ts";

export function createEnvCommand() {
  return new Command()
    .description("Создать новое окружение для выбранного проекта.")
    .action(async () => {
      try {
        const project = await getCurrentProject();

        if (!project) {
          console.error(
            red(
              "Проект не выбран. Пожалуйста, выберите проект перед созданием окружения.",
            ),
          );
          return;
        }

        const envName = await Input.prompt({
          message: "Введите имя нового окружения:",
          validate: (value) =>
            value.length > 0 ? true : "Имя окружения не может быть пустым.",
        });

        const client = await createClient();
        const response = await client.call("createEnvironment", [
          project,
          envName,
        ]);

        if (response.success) {
          console.log(
            green(
              `Окружение '${envName}' успешно создано для проекта '${project}'.`,
            ),
          );
        } else {
          console.error(
            red(`Не удалось создать окружение. Ошибка: ${response.message}`),
          );
        }
      } catch (error) {
        console.error(red(`Ошибка: ${error.message}`));
      }
    });
}
