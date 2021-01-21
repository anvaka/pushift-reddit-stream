/*
 * The script reads from stdin and filters out all subreddits
 * that are present in `small_subreddits.json` file. The file is generated by
 *
 * node --max-old-space-size=8192 ./get_small_subreddits.js filtered.txt > small_subreddits.json
 *
 * Usage:
 *   cat filtered.txt | node filter_subreddits > super_filtered.txt
 */
const readline = require('readline');
const filteredSubs = new Set(require('./small_subreddits.json'))
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', function(line) {
  let [author, subreddit] = line.split(',');
  if (!subreddit || filteredSubs.has(subreddit)) return;
  console.log(line);
});