var net = require("net");

var ip = process.argv.length > 2 ? process.argv[2] : "127.0.0.1";
if(!ip.includes(":")) ip += ":8003";

var buffer = [];
var online = false;

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
	console.log("Lost connection to monitor");
	online = false;
	setTimeout(attemptReconnect, 5000);
}

function onDat(data) {
	console.log(data.toString());
	var tokens = data.toString().split('\n');
	tokens.forEach(e => {
		if(e.length > 0) buffer.push(e);
	});
	
	if(buffer.includes("end")) {
		console.log(buffer);
		buffer = [];
	}
}

function onEnd() {
	console.log("Lost connection to monitor");
	online = false;
	setTimeout(attemptReconnect, 5000);
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
