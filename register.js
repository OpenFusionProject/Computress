import { promises as fs } from "fs";
import { REST, Routes } from "discord.js";

const commands = [
  {
    name: "check",
    description: "Check the status of the server",
  },
];

async function getConfig() {
  try {
    const config_raw = await fs.readFile("config.json");
    return JSON.parse(config_raw);
  } catch (err) {
    console.error("[ERROR] Could not read config file");
    exit(1);
  }
}

async function registerCommands(config) {
  const rest = new REST({ version: "10" }).setToken(config.token);
  try {
    console.log("[INFO] Started refreshing application commands.");
    await rest.put(Routes.applicationCommands(config.client_id), {
      body: commands,
    });
    console.log("[INFO] Successfully reloaded application commands.");
  } catch (error) {
    console.error(
      `[ERROR] Failed to reload application commands: ${error.message}`
    );
  }
}

async function main() {
  const config = await getConfig();
  await registerCommands(config);
}

main();
