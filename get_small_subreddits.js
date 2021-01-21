let forEachLine = require('for-each-line');
let path = require('path');

let inputFile = process.argv[2];
let shouldInverse = process.argv[3] === 'inverse';

if (!inputFile) {
  throw new Error('Pass a file to calculate subreddit counts')
}

console.warn('Reading comments file ' + inputFile);

let filterPredicate = shouldInverse ? inverseFilter : directFilter;

let counts = new Map();
forEachLine(inputFile, line => {
  let parts = line.split(',');
  if (parts.length < 2) throw new Error('Line has less than 2 parts ' + line);
  let key = parts[1];
  counts.set(key, (counts.get(key) || 0) + 1);
}).then(_ => {
  console.log(
    JSON.stringify(
      Array.from(counts).filter(filterPredicate).map(x => x[0])
    )
  );
});

function directFilter(x) { 
  return x[1] < 11;
}

function inverseFilter(x) {
  return !directFilter(x);
}
