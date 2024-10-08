import { Command } from "../deps.ts";
import { createClient } from "../utils/api.ts";
import {
  getCurrentEnv,
  getCurrentProject,
  setCurrentEnv,
} from "../utils/config.ts";
import { green, red, yellow } from "../deps.ts";

export function deleteEnvCommand() {
  return new Command()
    .description("Удалить окружение.")
    .arguments("<envName:string>")
    .action(async (options, envName: string) => {
      try {
        const project = await getCurrentProject();
        const currentEnv = await getCurrentEnv();

        if (!project) {
          console.error(
            red("Проект не выбран. Выберите проект перед удалением окружения."),
          );
          return;
        }

        if (currentEnv === envName) {
          console.log(
            yellow(
              `Текущее окружение '${currentEnv}' совпадает с удаляемым окружением.`,
            ),
          );
          await setCurrentEnv(""); // Сбрасываем текущее окружение, если оно совпадает
          console.log(green(`Текущее окружение сброшено.`));
        }

        const client = await createClient();
        const response = await client.call("deleteEnvironment", [
          project,
          envName,
        ]);

        if (!response.success) {
          throw new Error(`Не удалось удалить окружение: ${response.message}`);
        }

        console.log(green(`Окружение '${envName}' успешно удалено.`));
      } catch (error) {
        console.error(red(`Ошибка: ${error.message}`));
      }
    });
}
