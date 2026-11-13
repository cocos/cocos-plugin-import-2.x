const assert = require('node:assert/strict');
const { test } = require('node:test');
const { versionChanged } = require('../scripts/release-version');

test('only increasing release versions trigger publication', () => {
    assert.equal(versionChanged('1.1.10', '1.1.10'), false);
    assert.equal(versionChanged('1.1.10', '1.1.11'), true);
    assert.equal(versionChanged('1.9.9', '1.10.0'), true);
    assert.equal(versionChanged('1.9.9', '2.0.0'), true);
    assert.throws(() => versionChanged('1.1.11', '1.1.10'));
    for (const version of ['1.1.11-beta', '01.1.11', 'v1.1.11', '1.1']) {
        assert.throws(() => versionChanged('1.1.10', version));
    }
});
