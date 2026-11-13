const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const JSZip = require('../unpack/lib/jszip.min');
const { PolygonCollider2D } = require('../dist/components/PolygonCollider2D');

async function checkMigration(Collider) {
    const points = [{ __type__: 'cc.Vec2', x: -12, y: 3 }, { __type__: 'cc.Vec2', x: 4, y: 15 }, { __type__: 'cc.Vec2', x: 8, y: -9 }];
    for (const type of ['cc.PolygonCollider', 'cc.PhysicsPolygonCollider']) {
        for (const value of [points, [], undefined, null]) {
            const input = [{ __type__: 'cc.Node' }, { __type__: type, points: value, _enabled: false, tag: 7 }];
            const before = JSON.stringify(input);
            const output = [input[0], null];
            await Collider.apply(1, input, output);
            const saved = JSON.parse(JSON.stringify(output))[1];
            assert.deepEqual(saved._points, value ?? []);
            assert.equal(saved.__type__, 'cc.PolygonCollider2D');
            assert.equal(Object.hasOwn(saved, '_point'), false);
            assert.equal(Object.hasOwn(saved, 'points'), false);
            assert.equal(saved._enabled, false);
            assert.equal(saved.tag, 7);
            assert.equal(output[0], input[0]);
            assert.equal(JSON.stringify(input), before);
        }
    }
}

test('migration preserves serialized polygon vertices', () => checkMigration(PolygonCollider2D));

test('release archive includes working entrypoints, resources and runtime dependencies', async () => {
    const zip = await JSZip.loadAsync(fs.readFileSync('artifacts/plugin-import-2x.zip'), { checkCRC32: true });
    const manifest = JSON.parse(await zip.file('package.json').async('string'));
    assert.equal(manifest.version, require('../package.json').version);
    const lock = JSON.parse(await zip.file('package-lock.json').async('string'));
    assert.equal(lock.version, manifest.version);
    for (const name of [manifest.main, manifest.panels.creator.main, manifest.contributions.scene.script,
        'creator/index.css', 'creator/tree.css', 'creator/engine/engine2D.html', 'creator/icon/new.png',
        'static/migrate-resources/default-assets-2d/scripts', 'i18n/en.js']) {
        const path = name.replace(/^\.\//, '');
        assert.ok(zip.file(path) || Object.keys(zip.files).some(file => file.startsWith(`${path}/`)), name);
    }
    for (const name of Object.keys(manifest.dependencies)) {
        assert.ok(zip.file(`node_modules/${name}/package.json`), name);
    }
    for (const prefix of ['.git/', '.github/', '.idea/', 'tests/', 'scripts/', 'unpack/', 'node_modules/typescript/']) {
        assert.ok(!Object.keys(zip.files).some(name => name.startsWith(prefix)), prefix);
    }
    const context = { exports: {} };
    vm.runInNewContext(await zip.file('dist/components/PolygonCollider2D.js').async('string'), context);
    await checkMigration(context.exports.PolygonCollider2D);
});
