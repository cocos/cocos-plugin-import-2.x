const JSZip = require('./lib/jszip.min');
const { join, basename } = require('path');
const { writeFileSync, readdirSync, statSync, readFileSync } = require('fs-extra');

const skips = ['.idea', 'unpack', '.DS_Store', '.git', '.idea', '.gitignore'];

function step(path, zip, name, skip) {
  name = name || basename(path);
  if (skips.includes(name)) {
    return;
  }
  const stat = statSync(path);
  if (stat.isDirectory()) {
    const files = readdirSync(path);
    for (let file of files) {
      step(join(path, file), skip ? zip : zip.folder(name));
    }
  } else if (stat.isFile()) {
    zip.file(name, readFileSync(path));
  } else {
    console.error(`${path} was not added to zip!`);
  }
}

function unpack() {
  const ROOT_PATH = join(__dirname, '../../plugin-import-2x');
  const OUT_PATH = join(ROOT_PATH, 'unpack/plugin-import-2x.zip');

  const jsZip = new JSZip();

  step(ROOT_PATH, jsZip, 'plugin-import-2x', true);

  jsZip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 9,
    },
  }).then(content => {
    writeFileSync(OUT_PATH, content);
  });
}

(async () => {
  unpack();
})();
