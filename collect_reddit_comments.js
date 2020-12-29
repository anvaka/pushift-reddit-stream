const fetch = require('node-fetch');
const {REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET} = process.env;

const ResourceManager = require('./ResourceManager');
const resourceManger = new ResourceManager();
const outFolder = process.argv[2] || './';
const path = require('path');

//let startFrom = 34213292376; // Number.parseInt('fptplco', 36);
let startFrom = 34233588776; // Number.parseInt('fptplco', 36);
const IDS_PER_CALL = 100;

let access_token;
if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET) {
  throw new Error('Set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET in your env variables: https://old.reddit.com/prefs/apps')
}

const userAgent = 'suggestor/0.1 by anvaka';

initAuthToken().then(startTheCrawl);

function startTheCrawl() {
  let queue = [];
  let forceReset;
  for (let i = 0; i < IDS_PER_CALL; ++i) {
    queue.push(startFrom + i);
  }

  let thingsToFetch = queue.map(x => 't1_' + x.toString(36)).join(',');
  fetch('https://www.reddit.com/api/info.json?id=' + thingsToFetch + '&access_token=' + access_token, {
    'User-Agent': userAgent
  }).then(x => {
    if (x.headers.get('X-Ratelimit-Reset') !== undefined) {
      forceReset = Number.parseInt(x.headers.get('X-Ratelimit-Reset'), 10) * 1000;
    }
    return x.text();
  }).then(txt => {
    let x;
    try {
      x = JSON.parse(txt);
    } catch (e) {
      console.error('Failed to parse ' + txt);
      if (txt.match(/we took too long/) || txt.match(/try again in a minute/)) {
        console.error('Retrying in a minute...');
        setTimeout(startTheCrawl, 60 * 1000);
        return;
      }
      console.error('Cannot recover from this.')
      throw e;
    }
    if (!x.data) {
      console.error('No data for ', x);
      throw new Error('Missig data');
    }
    startFrom += IDS_PER_CALL;
    let comments = x.data.children;
    comments.forEach(child => processComment(child.data));
    if (comments.length === 0) {
      console.warn('Empty response at ' + startFrom)
    } else {
      const lastComment = comments[comments.length - 1];
      if (!lastComment) {
        console.error('Missing comment?', comments, x);
        throw new Error('no comment');
      }
      let message = 'Now is: ' + (new Date()).toISOString() + '; Start from: ' + startFrom + '. Last processeed date: ' + getCommentDate(lastComment.data);
      console.log(message);
      console.warn(message);
    }
    // Respect reddit's quota rules:
    // https://github.com/reddit-archive/reddit/wiki/API#rules
    if (forceReset) {
      console.warn('Waiting for quota reset at ' + forceReset);
      setTimeout(startTheCrawl, forceReset);
    } else {
      setTimeout(startTheCrawl, 0); 
    }
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
