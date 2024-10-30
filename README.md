# Computress
Computress is a Node-based Discord bot for OpenFusion servers.
Computress operates by listening to the monitor port on your OF server.

## Usage
Ensure you have node and npm installed. Fill in `config.json` with your Discord bot token, client ID, channel ID, and server address.

Install the dependencies first with
```
npm install
```

Then, if you want to be able to use the `/check` command, run this (one-time only):
```
node register.js
```

Finally, start the bot with
```
node main.js
```

## Features
Computress currently offers the following functionality:
- Show server population in activity message
- Check server monitor status (`/check`)
- Dump in-game chat and email to a specific text channel

Planned features that are currently WIP (yes, still):
- Dump name requests to a specific text channel
- Approve or reject name requests through reactions
