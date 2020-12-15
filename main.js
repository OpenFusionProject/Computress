var net = require("net");
var discord = require("discord.js");

var online = false;
var population = 0;

// bot
const token = "";
const client = new discord.Client();

client.on("ready", () => {
	console.log("Logged in as " + client.user.tag);
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
	client.user.setActivity(population + (population == 1 ? " player" : " players"), { type: 'LISTENING' })
	.catch(console.error);
}

client.login(token);

// socket
var ip = process.argv.length > 2 ? process.argv[2] : "127.0.0.1";
if(!ip.includes(":")) ip += ":8003";

var buffer = [];

var options = {
	port: ip.split(':')[1],
	host: ip.split(':')[0]
};

console.log("Connecting to monitor at " + ip + "...");

var socket = net.connect(options, () => {
	console.log("Connected");
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
	console.log("Lost connection to monitor");
	online = false;
	setTimeout(attemptReconnect, 10000);
}

socket.on("data", onDat);
socket.on("error", onErr);
socket.on("end", onEnd);

function attemptReconnect() {
	console.log("Attempting to reconnect...");
	socket = net.connect(options, () => {
		console.log("Reconnected");
		online = true;
	});
	socket.on("error", onErr);
	socket.on("data", onDat);
	socket.on("end", onEnd);
}

function processBuffer() {
	if(buffer.includes("begin")) {
		buffer = buffer.slice(buffer.indexOf("begin") + 1, buffer.indexOf("end"));
		population = 0;
		for(var i = 0; i < buffer.length; i++) {
			var tokens = buffer[i].split(' ');
			switch(tokens[0])
			{
				case 'player':
					population++;
					break;
				case 'chat':
					//console.log('msg:' + buffer[i].substring(buffer[i].indexOf(' ') + 1));
					break;
				default:
					break;
			}
		}
		refreshStatus();
	} else {
		console.log("Bad data (no begin)");
	}
	buffer = [];
}