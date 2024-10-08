import { Command } from "../deps.ts";
import { createClient, createProject } from "../utils/api.ts";

export function createProjectCommand() {
  return new Command()
    .description("Создать новый проект.")
    .arguments("<projectName:string>")
    .action(async (options, projectName: string) => {
      try {
        const client = await createClient();
        const response = await client.call("createProject", [projectName]);

        if (!response.success) {
          throw new Error(`Не удалось создать проект.(${response.error})`);
        }

        console.log(`Проект ${projectName} успешно создан!`);
      } catch (error) {
        console.error(`Ошибка: ${error.message}`);
      }
    });
}
