#!/bin/bash
echo "Searchign large subreddits..."
node --max-old-space-size=8192 ./get_small_subreddits.js filtered.txt inverse > large_subreddits.json  