// given a date, tries to find the first comment id on that date
// Useful to backfill the data
const redditClient = require('./lib/redditClient');

let hopCount = 0;
let startDate = parseDate(process.argv[2])
if (!startDate || !startDate) {
  console.log('Please pass a valid date. For example, finds id of the first post of May:')
  console.log('   node find_id_by_date 2020-05-01')
  process.exit(1);
  return;
}

const firstPost = {
  date: new Date('2020-02-27T14:50:07.000Z'),
  id: Number.parseInt('fix8al9', 36)
}

const lastPost = {
  date: new Date('2021-01-14T07:13:54.000Z'),
  id: Number.parseInt('gj7fs0a', 36)
}

if (startDate < firstPost.date) {
  console.log('First post is available at ' + firstPost.date.toISOString())
  console.log('Cannot get comments before that...')
  process.exit(2);
  return;
}

findMinIdForDate(startDate)

function findMinIdForDate(date) {
  binarySearchDate(date, firstPost, lastPost);
}

function binarySearchDate(datePoint, left, right) {
  hopCount += 1;

  let guess = Math.round((left.id + right.id) / 2);
  let ids = getIdsStartingFrom(guess);

  return redditClient.getCommentsInfo(ids).then(response => {
    let foundId = findIdInComments(response.comments, datePoint);
    if (foundId !== undefined) {
      console.log('Found id: ' + foundId + ': https://www.reddit.com/api/info.json?id=t1_' + foundId.toString(36));
      return foundId;
    }

    let point  = getIdStatistics(response.comments);
    // console.log('Min point: ', point);
    if (point.date > datePoint) {
      logIterval(left, datePoint, point);
      return binarySearchDate(datePoint, left, point);
    } else {
      logIterval(point, datePoint, right);
      return binarySearchDate(datePoint, point, right);
    }
  })
}

function logIterval(left, date, right) {
  console.log(`Attempt ${hopCount}: ${left.id} ${left.date.toISOString()} < ${date.toISOString()} < ${right.date.toISOString()} ${right.id}`)
}

function getIdsStartingFrom(id) {
  let ids = [];
  for (let i = id; i < id + 100; ++i) ids.push(i);
  return ids;
}

function findIdInComments(comments, datePoint) {
  // pick a better start/end range?
  if (comments.length === 0) throw new Error('Cannot find any comments');
  let prevDate = comments[0].date;
  for (let i = 0; i < comments.length; ++i) {
    let comment = comments[i];
    if (prevDate <= datePoint && comment.date >= datePoint) {
      return Number.parseInt(comment.id, 36);
    }

    prevDate = comment.date;
  }
}

function getIdStatistics(comments) {
  let minId = Infinity, maxId = -Infinity;
  let minDate = Infinity, maxDate = -Infinity;
  comments.forEach(comment => {
    let id = Number.parseInt(comment.id, 36);
    if (comment.date < minDate) minDate = comment.date;
    if (comment.date > maxDate) maxDate = comment.date;
    if (id > maxId) maxId = id;
    if (id < minId) minId = id;
  })
  return {
    id: minId,
    date: minDate,
  }
}

function parseDate(str) {
  if (str.indexOf('T') < 0) str += 'T00:00:00.000Z';
  let d = Date.parse(str);
  if (Number.isNaN(d)) return;

  return new Date(d);
}
