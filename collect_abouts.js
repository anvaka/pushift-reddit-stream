/**
 * This script collects every single /about.json record from a given
 * list of subreddits.
 * 
 */
const fs = require('fs');
const path = require('path');
const subreddits = require('./large_subreddits.json');
const outputFileName = 'subreddits_info.json';
const results = [];
const IDS_PER_CALL = 100;

const redditClient = require('./lib/redditClient');
let addComma = false;
startTheCrawl();

function startTheCrawl() {
  if (subreddits.length === 0) {
    console.log('\n]');
    console.warn('Saved to ' + outputFileName);
    return;
  }
  let idsToFetch = subreddits.splice(0, 100)

  redditClient.getSubredditsInfo(idsToFetch).then(response => {
    if (response) {
      response.comments.forEach(sub => {
        console.log((addComma ? ',' : '[') + JSON.stringify(sub))
        addComma = true;
      })
      console.warn('Remaining subreddits: ' + subreddits.length);
    } else {
      console.warn('Warning: Empty response from ' + idsToFetch.join(','));
    }
    const waitTillNextCall = (response && response.waitTillNextCall) || 0;
    console.warn('Waiting ', waitTillNextCall);
    setTimeout(startTheCrawl, waitTillNextCall);
  });
}
