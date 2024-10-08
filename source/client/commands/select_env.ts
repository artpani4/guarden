import { Command } from "../deps.ts";
import { Select } from "https://deno.land/x/cliffy@v1.0.0-rc.4/prompt/select.ts";
import { createClient } from "../utils/api.ts";
import { getCurrentProject, setCurrentEnv } from "../utils/config.ts";
import { green, red } from "../deps.ts";

export function selectEnvCommand() {
  return new Command()
    .description("Выбрать окружение для текущего проекта.")
    .action(async () => {
      try {
        const project = await getCurrentProject();

        if (!project) {
          console.error(
            red("Проект не выбран. Выберите проект перед выбором окружения."),
          );
          return;
        }

        const client = await createClient();
        const [response, error] = await client.get();
        if (error) {
          console.error(red(`Ошибка получения данных: ${error.message}`));
          return;
        }
        const selectedProject = response!.state!.projects!.find(
          (p) => p!.name === project,
        );

        if (!selectedProject) {
          console.error(red(`Проект '${project}' не найден.`));
          return;
        }

        const environments = Object.keys(selectedProject!.environments!);
        if (environments.length === 0) {
          console.error(red("Окружения для выбранного проекта не найдены."));
          return;
        }

        // Показываем пользователю список окружений
        const selectedEnv = await Select.prompt({
          message: `Выберите окружение для проекта ${selectedProject.name}:`,
          options: environments,
        });

        // Сохраняем текущее окружение
        await setCurrentEnv(selectedEnv);

        console.log(green(`Окружение '${selectedEnv}' успешно выбрано.`));
      } catch (error) {
        console.error(red(`Ошибка: ${error.message}`));
      }
    });
}
