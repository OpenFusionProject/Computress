var net = require("net");

var ip = process.argv.length > 2 ? process.argv[2] : "127.0.0.1";
if(!ip.includes(":")) ip += ":8003";

var buffer = [];
var online = false;
var population = 0;

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
	console.log(data.toString());
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
	console.log(buffer);
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
	} else {
		console.log("Bad data (no begin)");
	}
	buffer = [];
}