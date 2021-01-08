const ResourceManager = require('./ResourceManager');
const resourceManger = new ResourceManager();
const outFolder = process.argv[2] || './';
const path = require('path');

//let startFrom = 34213292376; // Number.parseInt('fptplco', 36);
let startFrom = 34302560776;//34233588776;
const IDS_PER_CALL = 100;
startFrom = Number.parseInt(process.argv[3]);
if (!Number.isFinite(startFrom)) {
  console.error('Pass a decimal id of the comment to indicate the first required post')
  console.error('This will collect all comments for the day of Dec 4, 2020 and store into "backfill" folder')
  console.error('  node collect_reddit_comments.js backfill 35707973867 35714381239 ')
  process.exit(-1);
}
let endAt = Number.parseInt(process.argv[4]);
if (!Number.isFinite(endAt)) {
  endAt = Infinity;
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
    console.warn(message);
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
