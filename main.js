var net = require("net");
var discord = require("discord.js");

var online = false;
var population = 0;

const debug = false;

// bot
const token = "";
const client = new discord.Client();
const chan = "computress";

client.on("ready", () => {
	console.log("[INFO] Logged in as " + client.user.tag);
	refreshStatus();
});

client.on("message", msg => {
	if(msg.content == "$status" || msg.content == "$up") {
		if(online)
			msg.channel.send("The server is currently **online** :white_check_mark: with **" + population + "** player" + (population != 1 ? "s" : ""));
		else
			msg.channel.send("The server is currently **offline** :no_entry:");
	}
});

function refreshStatus() {
	if(!online)
		client.user.setActivity("nothing", { type: 'LISTENING' }).catch(console.error);
	else
		client.user.setActivity(population + (population == 1 ? " player" : " players"), { type: 'LISTENING' }).catch(console.error);
}

if(!debug) client.login(token);

// socket
var ip = process.argv.length > 2 ? process.argv[2] : "127.0.0.1";
if(!ip.includes(":")) ip += ":8003";

var buffer = [];

var options = {
	port: ip.split(':')[1],
	host: ip.split(':')[0]
};

console.log("[INFO] Connecting to monitor at " + ip + "...");

var socket = net.connect(options, () => {
	console.log("[INFO] Connected");
	online = true;
});

function onErr() {
	online = false;
	setTimeout(attemptReconnect, 10000);
}

function onDat(data) {
	var tokens = data.toString().split('\n');
	tokens.forEach(e => {
		if(e.length > 0) buffer.push(e);
	});
	
	if(buffer.includes("end"))
		processBuffer();
}

function onEnd() {
	console.log("[WARN] Lost connection to monitor");
	online = false;
	setTimeout(attemptReconnect, 10000);
}

socket.on("data", onDat);
socket.on("error", onErr);
socket.on("end", onEnd);

function attemptReconnect() {
	console.log("Attempting to reconnect...");
	if(!debug) refreshStatus();
	socket = net.connect(options, () => {
		console.log("Reconnected");
		online = true;
	});
	socket.on("error", onErr);
	socket.on("data", onDat);
	socket.on("end", onEnd);
}

function processBuffer() {
	if(debug) console.log(buffer);
	if(buffer.includes("begin")) {
		var queue = buffer.slice(buffer.indexOf("begin") + 1, buffer.indexOf("end"));
		population = 0;
		for(var i = 0; i < queue.length; i++) {
			var tokens = queue[i].split(' ');
			switch(tokens[0])
			{
				case 'player':
					population++;
					break;
				case 'chat':
					if(!debug) client.channels.cache.find(ch => ch.name == chan).send(queue[i].substring(queue[i].indexOf(' ') + 1));
					break;
				default:
					break;
			}
		}
		if(!debug) refreshStatus();
	} else {
		console.log("[WARN] Bad data (no begin); ignoring");
	}
	buffer = buffer.slice(buffer.indexOf("end") + 1, buffer.length);
}