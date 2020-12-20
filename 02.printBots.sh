#!/bin/bash
cat sorted.txt | node printBots.js > bots.json
echo "Saved users to ignore into vmbots.json"
