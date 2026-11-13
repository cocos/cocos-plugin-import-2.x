const fs = require('node:fs');
const { execFileSync } = require('node:child_process');

function versionChanged(previous, current) {
    const pattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
    if (!pattern.test(previous) || !pattern.test(current)) throw new Error('Release versions must use major.minor.patch');
    const before = previous.split('.').map(Number);
    const after = current.split('.').map(Number);
    const index = after.findIndex((part, i) => part !== before[i]);
    if (index < 0) return false;
    if (after[index] < before[index]) throw new Error('The release version must increase');
    return true;
}

if (require.main === module) {
    const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
    const base = event.pull_request ? event.pull_request.base.sha : event.before;
    if (!base || !/^[a-f0-9]{40}$/.test(base) || /^0+$/.test(base)) throw new Error('Cannot determine previous version');
    const previous = JSON.parse(execFileSync('git', ['show', `${base}:package.json`], { encoding: 'utf8' })).version;
    const current = require('../package.json').version;
    const changed = versionChanged(previous, current);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `tag=v${current}\npublish=${changed}\n`);
    console.log(`${previous} -> ${current}; version changed: ${changed}`);
}
module.exports = { versionChanged };
