import { Command, Input } from "../deps.ts";
import { createClient } from "../utils/api.ts";
import { getCurrentProject } from "../utils/config.ts";
import { green, red, yellow } from "../deps.ts";
import { Select } from "https://deno.land/x/cliffy@v1.0.0-rc.4/prompt/select.ts";

export function inviteUserCommand() {
  return new Command()
    .description("Пригласить пользователя в проект.")
    .action(async () => {
      try {
        // Получаем клиента Apifly
        const client = await createClient();

        // Получаем список проектов текущего пользователя
        const [response, error] = await client.get();
        if (error) {
          console.error(red(`Ошибка получения проектов: ${error.message}`));
          return;
        }

        const projects = response!.state.projects!.map((p) => p!.name!);

        if (projects.length === 0) {
          console.error(red("У вас нет доступных проектов."));
          return;
        }

        // Показываем пользователю список проектов для выбора
        const selectedProject = await Select.prompt({
          message: "Выберите проект:",
          options: projects,
        });

        // Вводим имя пользователя для инвайта
        const inviteeUsername = await Input.prompt({
          message: "Введите имя пользователя, которого хотите пригласить:",
          validate: (value) =>
            value.length > 0 ? true : "Имя пользователя не может быть пустым.",
        });

        // Проверяем существование пользователя
        const checkUserResponse = await client.call("checkUserExists", [
          inviteeUsername,
        ]);

        if (!checkUserResponse.success) {
          console.error(
            red(`Пользователь с именем '${inviteeUsername}' не найден.`),
          );
          return;
        }

        // Приглашаем пользователя в выбранный проект
        const inviteResponse = await client.call("inviteUserToProject", [
          inviteeUsername,
          selectedProject,
        ]);

        if (!inviteResponse.success) {
          console.error(
            red(
              `Не удалось пригласить пользователя в проект: ${inviteResponse.message}`,
            ),
          );
          return;
        }

        console.log(
          green(
            `Пользователь '${inviteeUsername}' успешно приглашен в проект '${selectedProject}'.`,
          ),
        );
      } catch (error) {
        console.error(red(`Ошибка: ${error.message}`));
      }
    });
}
