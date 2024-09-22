import { Command } from "../deps.ts";
import { Select } from "https://deno.land/x/cliffy@v1.0.0-rc.4/prompt/select.ts";
import { createClient } from "../utils/api.ts";
import { setCurrentEnv } from "../utils/config.ts";
import { green, red } from "../deps.ts";

export function selectEnvCommand() {
  return new Command()
    .description("Выбрать существующее окружение для работы.")
    .action(async () => {
      try {
        const client = await createClient();
        const response = await client.call("getEnvironments", []);

        if (!response.success || !response.environments) {
          console.error(red("Не удалось получить список окружений."));
          return;
        }

        const selectedEnv = await Select.prompt({
          message: "Выберите окружение:",
          options: response.environments,
        });

        await setCurrentEnv(selectedEnv as string);
        console.log(green(`Окружение '${selectedEnv}' успешно выбрано.`));
      } catch (error) {
        console.error(red(`Ошибка: ${error.message}`));
      }
    });
}
