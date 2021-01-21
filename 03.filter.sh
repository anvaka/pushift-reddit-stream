#!/bin/bash
echo "Filtering out bots..."
cat sorted.txt | node filter_users > filtered.txt
echo "Saved filtered output into filtered.txt"
echo "Searching for small subreddits..."
node --max-old-space-size=8192 ./get_small_subreddits.js filtered.txt > small_subreddits.json
echo "Saved small subreddits into small_subreddits.json"
echo "Filterig out small subreddits "
cat filtered.txt | node filter_subreddits > super_filtered.txt
rm filtered.txt
mv super_filtered.txt filtered.txt
echo "Filtered file is saved"