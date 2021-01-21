/*
 * The script reads from stdin and filters out all frequent posters from
 * `bots.json` file, and prints results back to stdout
 *
 *
 * Usage:
 *   cat sorted.txt | node filter_users > filtered.txt
 */
const readline = require('readline');
const filteredUsers = new Set(require('./bots.json'))
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', function(line) {
  let [author] = line.split(',');
  if (!author || filteredUsers.has(author) || 
    author.indexOf('bot') > -1) return;
  console.log(line);
});
