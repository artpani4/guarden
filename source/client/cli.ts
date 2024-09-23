import { createProjectCommand } from "./commands/create_project.ts";
import { selectProjectCommand } from "./commands/select_project.ts";
import { selectEnvCommand } from "./commands/select_env.ts";
import { generateTokenCommand } from "./commands/generate_token.ts";
import { addSecretCommand } from "./commands/add_secret.ts";

import { deleteEnvCommand } from "./commands/delete_env.ts";
import { renameEnvCommand } from "./commands/rename_env.ts";
import { showCurrentConfigCommand } from "./commands/show_current_config.ts";
import { fetchSecretsCommand } from "./commands/fetch_secrets.ts";
import { Command } from "./deps.ts";
import { createEnvCommand } from "./commands/create_env.ts";
import { updateSecretCommand } from "./commands/update_secret.ts";
import { deleteSecretCommand } from "./commands/delete_secret.ts";
import { deleteProjectCommand } from "./commands/delete_project.ts";
import { renameProjectCommand } from "./commands/rename_project.ts";
import { runCommand } from "./commands/run.ts";
import { inviteUserCommand } from "./commands/invite_user.ts";
import { logoutCommand } from "./commands/logout.ts";
import { loginCommand } from "./commands/login.ts";

const cli = new Command()
  .name("guarden")
  .version("1.0.0")
  .description(
    "CLI утилита для безопасного управления секретами с использованием Deno, Apifly и DenoKV.",
  )
  .command("create-project", createProjectCommand())
  .command("delete-project", deleteProjectCommand())
  .command("rename-project", renameProjectCommand())
  .command("select-project", selectProjectCommand())
  .command("select-env", selectEnvCommand())
  .command("create-env", createEnvCommand())
  .command("rename-env", renameEnvCommand())
  .command("delete-env", deleteEnvCommand())
  .command("generate-token", generateTokenCommand())
  .command("add-secret", addSecretCommand())
  .command("update-secret", updateSecretCommand())
  .command("delete-secret", deleteSecretCommand())
  .command("fetch-secrets", fetchSecretsCommand())
  .command("show-current", showCurrentConfigCommand())
  .command("run", runCommand())
  .command("logout", logoutCommand())
  .command("login", loginCommand())
  .command("invite", inviteUserCommand());

cli.parse(Deno.args);

// .command("generate", generateTokenCommand())
// .command("selectEnv", selectEnvCommand())
// // .command("create", createEnvCommand())
// .command("fetch", fetchSecretCommand())
// .command("add", addSecretCommand())
// .command("update", updateSecretCommand())
// .command("delete", deleteSecretCommand())
// .command("logout", logoutCommand())
// // .command("run", runCommand())
// .command("login", loginCommand())
// .command("createProject", createProjectCommand())
// // .command("deleteProject", deleteProjectCommand())
// .command("selectProject", selectProjectCommand());
// // .command("inviteUser", inviteUserCommand());
