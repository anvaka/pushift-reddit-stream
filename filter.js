// These users posted a lot. Some of them are suspended, and some are bots.
let filteredUsers = new Set(require('./bots.json'))
console.log(filteredUsers)