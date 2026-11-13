const assert = require('node:assert/strict');
const { test } = require('node:test');

// Match the plugin's converter initialization order before loading components.
require('../dist/convertor');
const { MigrateManager } = require('../dist/components/MigrateManager');
const { RichText } = require('../dist/components/RichText');

const white = { __type__: 'cc.Color', r: 255, g: 255, b: 255, a: 255 };

test('RichText inherits its referenced node color during prefab migration', async () => {
    for (const nodeIndex of [0, 1]) {
        const color = { __type__: 'cc.Color', r: 12, g: 34, b: 56, a: 128 };
        const input = [{ __type__: 'cc.Node', _color: white }, { __type__: 'cc.Node', _color: white }];
        input[nodeIndex] = { __type__: 'cc.Node', _color: color };
        input.push({ __type__: 'cc.RichText', node: { __id__: nodeIndex }, _N$string: 'Plain text', _enabled: false });
        const before = JSON.stringify(input);
        const output = input.slice();
        await MigrateManager.migrate(2, input, output);
        const result = JSON.parse(JSON.stringify(output))[2];
        assert.deepEqual(result._fontColor, color);
        assert.equal(Object.hasOwn(result, '_color'), false);
        assert.deepEqual(result.node, { __id__: nodeIndex });
        assert.equal(result._string, 'Plain text');
        assert.equal(result._enabled, false);
        assert.equal(JSON.stringify(input), before);
        output[2]._fontColor.r = 200;
        assert.equal(color.r, 12);
    }
});

test('RichText retains independent white defaults when node color is unavailable', async () => {
    for (const node of [null, { __id__: 0 }, { __id__: 99 }]) {
        const input = [{ __type__: 'cc.Node' }, { __type__: 'cc.RichText', node }];
        const output = input.slice();
        await MigrateManager.migrate(1, input, output);
        assert.deepEqual(output[1]._fontColor, white);
    }
    const first = RichText.create();
    first._fontColor.r = 0;
    assert.deepEqual(RichText.create()._fontColor, white);
});
