import { Command } from "../deps.ts";
import { createEnvironment } from "../utils/api.ts";
import { green, red } from "../deps.ts";

export function createEnvCommand() {
  return new Command()
    .description("Создать новое окружение.")
    .arguments("<environment:string>")
    .action(async (options, env: string) => {
      try {
        const result = await createEnvironment(env);
        console.log(green(result));
      } catch (error) {
        console.error(red(`Ошибка: ${error.message}`));
      }
    });
}
