import { Command } from "../deps.ts";
import { Select } from "https://deno.land/x/cliffy@v1.0.0-rc.4/prompt/select.ts";
import { createClient } from "../utils/api.ts";
import { setCurrentProject } from "../utils/config.ts";
import { green, red } from "../deps.ts";

export function selectProjectCommand() {
  return new Command()
    .description("Выбрать текущий проект.")
    .action(async () => {
      try {
        const client = await createClient();
        const [response, error] = await client.get();

        if (error) {
          console.error(
            red(`Не удалось получить список проектов(${error.message})`),
          );
          return;
        }

        const selectedProject = await Select.prompt({
          message: "Выберите проект:",
          options: response!.state.projects!.map((p) => p!.name!),
        });

        // Сохраняем текущий проект
        await setCurrentProject(selectedProject);

        console.log(green(`Проект '${selectedProject}' успешно выбран.`));
      } catch (error) {
        console.error(red(`Ошибка: ${error.message}`));
      }
    });
}
