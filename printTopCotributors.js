/**
 * Prints top contributors of the firt column in csv file.
 * 
 * Usage:
 * 
 *   cat sorted.txt | node printTopCotributors.js
 */
const path = require('path');
const readline = require('readline');

let counts = new Map();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', function(line) {
  let [author] = line.split(',');
  counts.set(author, (counts.get(author) || 0) + 1);
});

rl.on('close', function() {
  console.log('Top writers: ');
  console.log(
    Array.from(counts).sort((a, b) => b[1] - a[1]).slice(0, 100).map(x => x[0] + ' - ' + x[1]).join('\n')
  );
});