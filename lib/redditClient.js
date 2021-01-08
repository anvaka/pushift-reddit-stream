const {REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET} = process.env;
const fetch = require('node-fetch');

let access_token;
if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET) {
  throw new Error('Set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET in your env variables: https://old.reddit.com/prefs/apps')
}

const userAgent = 'suggestor/0.1 by anvaka';

module.exports = {
  getCommentsInfo: getCommentsInfo
};

function getCommentsInfo(commentIdsToFetch) {
  if (!access_token) {
    return initAuthToken().then(() => getCommentsInfo(commentIdsToFetch));
  }

  if (commentIdsToFetch.length > 100) throw new Error('Only 100 ids per call');
  commentIdsToFetch.forEach(x => {
    if (!Number.isFinite(x)) throw new Error('Only numerical ids are accepted');
  })

  const base36CommentIds = commentIdsToFetch.map(x => 't1_' + x.toString(36)).join(',');
  let waitTillNextCall = 0;

  const url = 'https://www.reddit.com/api/info.json?id=' + base36CommentIds + '&access_token=' + access_token;
  return fetch(url, {
    'User-Agent': userAgent
  }).then(x => {
    if (x.headers.get('X-Ratelimit-Reset')) {
      // Respect reddit's quota rules:
      // https://github.com/reddit-archive/reddit/wiki/API#rules
      waitTillNextCall = Number.parseInt(x.headers.get('X-Ratelimit-Reset'), 10) * 1000;
    }

    return x.text(); // we return text, because in case of an error, it is not a JSON.
  }).then(txt => {
    let x;
    try {
      x = JSON.parse(txt);
    } catch (e) {
      console.error('Failed to parse ' + txt);
      if (txt.match(/we took too long/) || txt.match(/try again in a minute/)) {
        console.error('Retrying in a minute...');
        
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            getCommentsInfo(commentIdsToFetch).then(resolve).catch(reject);
          }, 60 * 1000);
        })
      }

      console.error('Cannot recover from this error.')
      throw e;
    }
    if (x.error === 500) {
      console.error('ERROR!', x.message);
      return new Promise((resolve, reject) => {
          setTimeout(() => {
            getCommentsInfo(commentIdsToFetch).then(resolve).catch(reject);
          }, 60 * 1000);
      });
    }
    if (!x.data) {
      console.error('No data for ', x);
      throw new Error('Missig data');
    }
    let comments = x.data.children;
    if (comments.length === 0) {
      console.warn('Empty response at ', commentIdsToFetch)
    } else {
      const lastComment = comments[comments.length - 1];
      if (!lastComment) {
        console.error('Missing comment?', comments, x);
        throw new Error('no comment');
      }
    }

    return {
      comments: comments.map(child => {
        let comment = child.data;
        comment.date = new Date(comment.created_utc * 1000);
        return comment;
      }),
      waitTillNextCall: waitTillNextCall
    }
  });
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
