const fetch = require('node-fetch');
const {REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET} = process.env;

const ResourceManager = require('./ResourceManager');
const resourceManger = new ResourceManager();
const outFolder = process.argv[2] || './';
const path = require('path');

let startFrom = Number.parseInt('fptplco', 32);

let access_token;
if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET) {
  throw new Error('Set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET in your env variables: https://old.reddit.com/prefs/apps')
}

const userAgent = 'suggestor/0.1 by anvaka';

initAuthToken().then(startTheCrawl);

function startTheCrawl() {
  let queue = [];
  let forceReset;
  for (let i = 0; i < 100; ++i) {
    queue.push(startFrom + i);
  }
  startFrom += 100;

  let thingsToFetch = queue.map(x => 't1_' + x.toString('32')).join(',');
  fetch('https://www.reddit.com/api/info.json?id=' + thingsToFetch + '&access_token=' + access_token, {
    'User-Agent': userAgent
  }).then(x => {
    if (x.headers['X-Ratelimit-Reset'] !== undefined) {
      forceReset = Number.parseInt(x.headers['X-Ratelimit-Reset'], 10) * 1000;
    }
    console.warn(x.headers);
    return x.json();
  }).then(x => {
    let comments = x.data.children;
    comments.forEach(child => processComment(child.data));
    console.log('Start from: ' + startFrom + '. Date: ' + getCommentDate(comments[comments.length - 1].data));
    // per reddit's rule they ask to do up to 60 requests per minute: 
    // https://github.com/reddit-archive/reddit/wiki/API#rules
    setTimeout(startTheCrawl, forceReset || 60 * 1000/60); 
  })
}

function processComment(comment) {
  if (comment.author === undefined) throw new Error('Missing author in ' + line);
  if (comment.subreddit === undefined) throw new Error('Missing subreddit in ' + line);
  let fileName = path.join(outFolder, getCommentDate(comment).substring(0, 10));

  let writeStream = resourceManger.getWriteStream(fileName);
  writeStream.write(comment.author + ',' + comment.subreddit + '\n');
}

function getCommentDate(comment) {
  return (new Date(comment.created_utc * 1000)).toISOString();
}

function initAuthToken() {
  return fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': userAgent,
      'Authorization': 'Basic ' + Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString('base64')
    },
    body: 'grant_type=client_credentials'
  }).then(x => {
    // console.warn(x.headers);
    return x.json();
  }).then(x => {
    console.warn('got response from reddit: ', x);
    access_token = x.access_token;
    if (access_token === undefined) {
      throw new Error('Could not get access token')
    }
  });
}