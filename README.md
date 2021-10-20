# Computress
Computress is a Node-based discord bot for OpenFusion.
Computress operates by listening to the monitor port on your OF server.

## Usage
Ensure you have node and npm installed.
```
npm install
node main.js [ip[:port]]
```

## Features
Computress currently offers the following functionality:
- Show server population in activity message
- Check server monitor status (`$status` / `$up`)
- Dump in-game chat to a specific text channel

Planned features that are currently WIP:
- Dump name requests to a specific text channel
- Approve or reject name requests through reactions
