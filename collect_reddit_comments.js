const fs = require('fs');
const ResourceManager = require('./ResourceManager');
const resourceManger = new ResourceManager();
// const outFolder = process.argv[2] || './';
const path = require('path');

const IDS_PER_CALL = 100;
let inputFileName = process.argv[2];

if (!fs.existsSync(inputFileName)) {
  console.error('Pass a file name where start end rage are defined')
  console.error('This will collect all comments for the day of Dec 4, 2020 and store into "backfill" folder')
  console.error('  echo 35707973867 35714381239 > december.txt')
  console.error('  node collect_reddit_comments.js backfill december.txt')
  process.exit(0);
}

let input = fs.readFileSync(inputFileName, 'utf8').split(' ');
// .map(x => Number.parseFloat(x)).filter(x => Number.isFinite(x));
if (input.length !== 3) {
  console.error('Could not parse the input file - values should be: `out_folder startFrom endAt`. E.g.:')
  console.error('  echo december 35707973867 35714381239 > december.txt')
  process.exit(0);
}
let [outFolder, startFrom, endAt] = input
startFrom = Number.parseFloat(startFrom);
if (!Number.isFinite(startFrom)) {
  console.error('`startFrom` is supposed to be a finite number: ')
  console.error('  echo december 35707973867 35714381239 > december.txt')
  process.exit(0);
}
endAt = Number.parseFloat(endAt);
if (!Number.isFinite(endAt)) {
  console.error('`endAt` is supposed to be a finite number: ')
  console.error('  echo december 35707973867 35714381239 > december.txt')
  process.exit(0);
}

if (startFrom >= endAt) {
  console.error('Looks like we are done already. Start is larger than end');
  process.exit(0);
}

if (!fs.existsSync(outFolder)) {
  console.log(outFolder + ' does not exist yet. Creating...');
  fs.mkdirSync(outFolder);
}

console.log(`Crawlig ${startFrom} to ${endAt} into ${outFolder}`);

const redditClient = require('./lib/redditClient');
startTheCrawl();

function startTheCrawl() {
  let idsToFetch = [];
  let forceReset;
  if (startFrom > endAt) {
    console.log('All done');
    return;
  }

  for (let i = 0; i < IDS_PER_CALL; ++i) {
    let idx = startFrom + i;
    if (idx < endAt) idsToFetch.push(idx);
  }

  redditClient.getCommentsInfo(idsToFetch).then(response => {
    startFrom += IDS_PER_CALL;
    response.comments.forEach(processComment);

    let lastComment = response.comments[response.comments.length - 1];

    const message = (new Date()).toISOString() + ' Start from: ' + startFrom + '. Last processeed date: ' + getCommentDate(lastComment) + 
    ' wait: ' + response.waitTillNextCall;
    console.log(message);
    // console.warn(message);
    fs.writeFileSync(inputFileName, `${outFolder} ${startFrom} ${endAt}`, 'utf8')
    setTimeout(startTheCrawl, response.waitTillNextCall);
  });
}

function processComment(comment) {
  if (comment.author === undefined) throw new Error('Missing author in ' + line);
  if (comment.subreddit === undefined) throw new Error('Missing subreddit in ' + line);
  let fileName = path.join(outFolder, getCommentDate(comment).substring(0, 10));

  let writeStream = resourceManger.getWriteStream(fileName);
  writeStream.write(comment.author + ',' + comment.subreddit + '\n');
}

function getCommentDate(comment) {
  return comment.date.toISOString();
}
