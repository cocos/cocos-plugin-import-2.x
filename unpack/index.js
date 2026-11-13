const JSZip = require('./lib/jszip.min');
const fs = require('node:fs');
const { join, resolve } = require('node:path');
const { tmpdir } = require('node:os');
const { execFileSync } = require('node:child_process');

const root = resolve(__dirname, '..');
const output = join(root, 'artifacts/plugin-import-2x.zip');
const files = [
    'package.json', 'package-lock.json', 'dist', 'creator', 'i18n', 'static',
    'README.md', 'README.zh-cn.md', 'readme', 'extension_cover.png', 'img.png', 'img_1.png',
];

function add(zip, directory, name) {
    const file = join(directory, name);
    if (fs.statSync(file).isDirectory()) {
        for (const child of fs.readdirSync(file).sort()) add(zip, directory, `${name}/${child}`);
    } else {
        // Fixed timestamps make identical inputs produce identical archives.
        zip.file(name, fs.readFileSync(file), { date: new Date('2000-01-01T00:00:00Z'), createFolders: false });
    }
}

async function pack() {
    const stage = fs.mkdtempSync(join(tmpdir(), 'plugin-import-2x-'));
    try {
        for (const name of ['package.json', 'package-lock.json']) {
            fs.copyFileSync(join(root, name), join(stage, name));
        }
        execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm',
            ['ci', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund'],
            { cwd: stage, stdio: 'inherit' });
        fs.rmSync(join(stage, 'node_modules/.package-lock.json'), { force: true });
        const zip = new JSZip();
        for (const name of files) add(zip, root, name);
        add(zip, stage, 'node_modules');
        const data = await zip.generateAsync({
            type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 },
        });
        fs.mkdirSync(join(root, 'artifacts'), { recursive: true });
        fs.writeFileSync(output, data);
        console.log(`Created ${output}`);
    } finally {
        fs.rmSync(stage, { recursive: true, force: true });
    }
}
pack().catch(error => { console.error(error); process.exitCode = 1; });
