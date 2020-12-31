const ResourceManager = require('./ResourceManager');
const resourceManger = new ResourceManager();
const outFolder = process.argv[2] || './';
const path = require('path');

//let startFrom = 34213292376; // Number.parseInt('fptplco', 36);
let startFrom = 34233588776;
const IDS_PER_CALL = 100;

startTheCrawl();

function startTheCrawl() {
  let idsToFetch = [];
  let forceReset;
  for (let i = 0; i < IDS_PER_CALL; ++i) {
    idsToFetch.push(startFrom + i);
  }

  redditClient.getInfo(queue).then(response => {
    startFrom += IDS_PER_CALL;
    response.comments.forEach(processComment);
    setTimeout(startTheCrawl, response.waitTillNextCall);

    const message = 'Now is: ' + (new Date()).toISOString() + '; Start from: ' + startFrom + '. Last processeed date: ' + getCommentDate(lastComment.data);
    console.log(message);
    console.warn(message);
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
