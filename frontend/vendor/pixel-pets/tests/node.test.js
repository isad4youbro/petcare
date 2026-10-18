import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderPNG, renderSpriteSheet, createConfig } from '../src/node.js';

test('renderPNG returns a PNG of the requested size', () => {
  const png = renderPNG(createConfig('cat_domestic'), { scale: 3 });
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(png.readUInt32BE(16), 96); assert.equal(png.readUInt32BE(20), 96);
});
test('sprite sheet has one cell per frame', () => {
  const s = renderSpriteSheet(createConfig('dog_corgi'), { pose: 'walk', scale: 2 });
  assert.equal(s.png.readUInt32BE(16), s.frames * 64); assert.ok(s.fps > 0);
});
