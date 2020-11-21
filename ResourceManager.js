const fs = require('fs');

class ResourceManager {
  constructor() {
    this.opened = new Map(); // file name => writeable stream
  }
  
  getWriteStream(name) {
    let writeStream = this.opened.get(name);
    if (writeStream) return writeStream; 
    writeStream = fs.createWriteStream(name, {flags: 'a'});

    this.opened.set(name, writeStream);
    if (this.opened.size > 10) closeAllButOne(this.opened, name);
    return writeStream;
  }
}

function closeAllButOne(openedStream, one) {
  let closed = [];
  openedStream.forEach((stream, name) => {
    if (name === one) return; // keep this one.
    stream.end();
    closed.push(name);
  });
  console.log('releasig ' + closed.join(', ') + ' files');
  closed.forEach(name => {
    openedStream.delete(name);
  })
}

module.exports = ResourceManager;