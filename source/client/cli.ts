import { Command } from "./deps.ts";
import { generateTokenCommand } from "./commands/generate_token.ts";
import { selectEnvCommand } from "./commands/select_env.ts";
import { fetchSecretsCommand } from "./commands/fetch_secrets.ts";
import { addSecretCommand } from "./commands/add_secret.ts";
import { createEnvCommand } from "./commands/create_env.ts";
import { updateSecretCommand } from "./commands/update_secret.ts";
import { logoutCommand } from "./commands/logout.ts";
import { runCommand } from "./commands/run.ts";
import { loginCommand } from "./commands/login.ts";
import { red } from "./deps.ts";

const cli = new Command()
  .name("guarden")
  .version("1.0.0")
  .description(
    "CLI утилита для безопасного управления секретами с использованием Deno, Apifly и DenoKV.",
  )
  .command("generate", generateTokenCommand())
  .command("select", selectEnvCommand())
  .command("create", createEnvCommand())
  .command("fetch", fetchSecretsCommand())
  .command("add", addSecretCommand())
  .command("update", updateSecretCommand())
  .command("logout", logoutCommand())
  .command("run", runCommand())
  .command("login", loginCommand())
  .error((error, cmd) => {
    if (error.message.startsWith("Unknown command")) {
      console.error(red(`Неизвестная команда: ${cmd}`));
    } else {
      cmd.showHelp();
      console.error(red(`Ошибка: ${error.message}`));
    }
    Deno.exit(1);
  });

cli.parse(Deno.args);
