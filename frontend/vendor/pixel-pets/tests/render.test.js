import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listSpecies, createConfig, renderFrame, getPoses, POSES, SIZE, applyPreset, diffPixels, getRig, FLOATING_RIGS } from '../src/index.js';

const opaque = rgba => { let n = 0; for (let i = 3; i < rgba.length; i += 4) if (rgba[i]) n++; return n; };

test('every species × preset × pose × frame renders a non-empty 32×32 sprite', () => {
  let frames = 0;
  for (const s of listSpecies()) for (let pi = 0; pi < s.presets.length; pi++) {
    const cfg = createConfig(s.id, pi, { neck: 'collar', head: 'bow' });
    const poses = getPoses(cfg);
    for (const pose of POSES) for (let f = 0; f < poses[pose].frames; f++) {
      const { rgba, width, height } = renderFrame(cfg, pose, f);
      assert.equal(width, SIZE); assert.equal(height, SIZE); assert.equal(rgba.length, SIZE * SIZE * 4);
      assert.ok(opaque(rgba) > 40, `${s.id}/${pose}/${f} is almost empty`);
      frames++;
    }
  }
  assert.ok(frames > 20000);
});

test('rendering is deterministic', () => {
  const cfg = createConfig('dog_corgi', 1);
  assert.deepEqual(renderFrame(cfg, 'walk', 3).rgba, renderFrame(cfg, 'walk', 3).rgba);
});

test('frame index wraps around', () => {
  const cfg = createConfig('cat_domestic'); const n = getPoses(cfg).walk.frames;
  assert.deepEqual(renderFrame(cfg, 'walk', n + 1).rgba, renderFrame(cfg, 'walk', 1).rgba);
});

test('ground pets stand on the floor line, floating pets do not need to', () => {
  for (const s of listSpecies()) {
    const cfg = createConfig(s.id); const { rgba } = renderFrame(cfg, 'stand', 0);
    let bottom = -1; for (let y = SIZE - 1; y >= 0 && bottom < 0; y--) for (let x = 0; x < SIZE; x++) if (rgba[(y * SIZE + x) * 4 + 3]) { bottom = y; break; }
    if (!FLOATING_RIGS.includes(getRig(cfg))) assert.ok(bottom >= 27 && bottom <= 29, `${s.id} bottom row ${bottom}`);
  }
});

test('presets actually change colors', () => {
  const a = createConfig('cat_british', 0), b = applyPreset(a, 2);
  assert.ok(diffPixels(a, b).length > 50);
});

test('changing one part changes only some pixels (ears)', () => {
  const a = createConfig('cat_domestic'); const b = { ...a, parts: { ears: 'fold' } };
  const d = diffPixels(a, b); assert.ok(d.length > 0 && d.length < 120, `diff ${d.length}`);
});

test('accessories are drawn', () => {
  const a = createConfig('dog_lab'); assert.ok(diffPixels(a, { ...a, neck: 'bandana' }).length > 3);
  assert.ok(diffPixels(a, { ...a, head: 'hat' }).length > 3);
});
