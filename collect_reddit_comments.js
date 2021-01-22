/**
 * This script constantly collect new pairs of 'user,subreddit'.
 * You pass it a single text file that describes the required work.
 * For example, such file could be called `december.txt`, and its content
 * is just one line:
 * 
 * december 35707973867 35714381239
 * 
 * The first item is the data folder where results should be written (december above)
 * The second item is the bottom range of remaining work, comment id: 35707973867
 * The third item is the top range of the work, comment id  (35714381239
 * 
 * As script progresses it will constantly update the second item with the last
 * point where it should be resumed (in case if it is interrupted). The files in
 * the data folder will be called as YYYY-mm-dd format. If such files already exist
 * they new records are appended to the end.
 */
const fs = require('fs');
const ResourceManager = require('./ResourceManager');
const resourceManger = new ResourceManager();
const path = require('path');

const IDS_PER_CALL = 100;
let inputFileName = process.argv[2];

if (!fs.existsSync(inputFileName)) {
  console.error('Pass a file name where start end rage are defined')
  console.error('This will collect all comments for the day of Dec 4, 2020 and store into "backfill" folder')
  console.error('  echo december 35707973867 35714381239 > december.txt')
  console.error('  node collect_reddit_comments.js december.txt')
  process.exit(0);
}

let input = fs.readFileSync(inputFileName, 'utf8').split(' ');
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
    if (response) {
      response.comments.forEach(processComment);

      let lastComment = response.comments[response.comments.length - 1];

      const message = (new Date()).toISOString() + ' Start from: ' + startFrom + '. Last processeed date: ' + getCommentDate(lastComment) + 
      ' wait: ' + response.waitTillNextCall;
      console.log(message);
    } else {
      console.log('Warning: Empty response from ' + idsToFetch.join(','));
    }
    fs.writeFileSync(inputFileName, `${outFolder} ${startFrom} ${endAt}`, 'utf8')
    setTimeout(startTheCrawl, (response && response.waitTillNextCall) || 0);
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
