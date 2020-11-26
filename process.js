/**
 * This file gets stream of pushift comments and dumps "Author,Subreddit" into
 * outFolder/YYYY-MM-DD file.
 */
const ResourceManager = require('./ResourceManager');
const outFolder = process.argv[2] || './';
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

const resourceManger = new ResourceManager();

rl.on('line', function(line){
  if (line.startsWith('data: ')) {
    let comment;
    try {
      comment = JSON.parse(line.substring(6));
    } catch(e) {
      console.error('Failed to parse:');
      console.error('');
      console.error(line);
      console.error('Likely the stream is broken. You need to restart');

      process.exit(0);
      return;
    }
    if (comment.created_utc === undefined) return;
    if (comment.author === undefined) throw new Error('Missing author in ' + line);
    if (comment.subreddit === undefined) throw new Error('Missing subreddit in ' + line);
    let fileName = path.join(outFolder, 
      (new Date(comment.created_utc * 1000)).toISOString().substring(0, 10)
    );

    let writeStream = resourceManger.getWriteStream(fileName);
    writeStream.write(comment.author + ',' + comment.subreddit + '\n');
  }
});

