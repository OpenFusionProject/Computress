import { connect } from "net";
import { Client, ActivityType, GatewayIntentBits } from "discord.js";
import { promises as fs } from "fs";

const DEBUG = false;

var online = false;
var population = 0;
var buffer = [];

async function getConfig() {
  try {
    const config_raw = await fs.readFile("config.json");
    return JSON.parse(config_raw);
  } catch (err) {
    console.error("[ERROR] Could not read config file");
    exit(1);
  }
}

function getAddress(config) {
  const ip = config.address;
  if (ip.includes(":")) return ip;
  return ip + ":8003";
}

function getStatusMessage() {
  if (online) {
    return `The server is currently **online** :white_check_mark: with **${population}** player${
      population != 1 ? "s" : ""
    }`;
  } else {
    return "The server is currently **offline** :no_entry:";
  }
}

async function handleInteraction(interaction) {
  const { commandName } = interaction;

  if (commandName === "check") {
    await interaction.reply(getStatusMessage());
  }
}

function getListeningTo() {
  if (!online) return "nothing";
  return population + (population == 1 ? " player" : " players");
}

async function refreshStatus(client) {
  const listeningTo = getListeningTo();
  try {
    await client.user.setActivity(listeningTo, {
      type: ActivityType.Listening,
    });
  } catch (err) {
    console.error(`[ERROR] Could not set activity: ${err}`);
  }
}

async function login(config) {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  });
  client.on("ready", async () => {
    await refreshStatus(client);
  });
  client.on("interactionCreate", handleInteraction);
  await client.login(config.token);
  return client;
}

async function main() {
  const config = await getConfig();
  const client = await login(config);
  console.log("[INFO] Logged in as " + client.user.tag);
  const addr = getAddress(config);
  connectToMonitor(client, config, addr);
}

async function onDat(client, config, data) {
  const tokens = data.toString().split("\n");
  tokens.forEach((e) => {
    if (e.length > 0) buffer.push(e);
  });

  if (buffer.includes("end")) await processBuffer(client, config);
}

async function onEnd(client, config, addr) {
  online = false;
  await refreshStatus(client);
  setTimeout(() => connectToMonitor(client, config, addr), 5000);
}

function connectToMonitor(client, config, addr) {
  const options = {
    port: addr.split(":")[1],
    host: addr.split(":")[0],
  };
  console.log("[INFO] Connecting to monitor at " + addr + "...");
  const socket = connect(options, () => {
    console.log("[INFO] Connected to monitor");
    online = true;
  });
  socket.on("end", async () => {
    console.log("[WARN] Lost connection to monitor");
    onEnd(client, config, addr);
  });
  socket.on("data", async (data) => onDat(client, config, data));
  socket.on("error", async () => onEnd(client, config, addr));
}

function printBuffer(buf) {
  console.log("{");
  for (let i = 0; i < buf.length; i++) console.log(buf[i]);
  console.log("}");
}

async function sendMessage(client, config, message) {
  const channel = await client.channels.fetch(config.channel_id);
  await channel.send(message);
}

async function processBuffer(client, config) {
  if (DEBUG) printBuffer(buffer);
  if (buffer.includes("begin")) {
    const queue = buffer.slice(
      buffer.indexOf("begin") + 1,
      buffer.indexOf("end")
    );
    population = 0;
    for (let i = 0; i < queue.length; i++) {
      const tokens = queue[i].split(" ");
      switch (tokens[0]) {
        case "player":
          population++;
          break;
        case "chat":
          const message = queue[i].substring(queue[i].indexOf(" ") + 1);
          await sendMessage(client, config, message);
          break;
        case "email":
          const head = queue[i].substring(queue[i].indexOf(" ") + 1);
          let body = "\n```\n";
          let j = 1;
          for (; queue[i + j][0] == "\t"; j++)
            body += queue[i + j].substring(1) + "\n";
          body += "```";
          await sendMessage(client, config, head + body);
          if (!queue[i + j].includes("endemail"))
            console.log("[WARN] Bad email (no endemail)");
          i += j;
          break;
        default:
          console.log(`[WARN] Unknown token: ${tokens[0]}`);
          break;
      }
    }
    await refreshStatus(client);
  } else {
    console.log("[WARN] Bad data (no begin token); ignoring");
  }
  buffer = buffer.slice(buffer.indexOf("end") + 1, buffer.length);
}

main();
