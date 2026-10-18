import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createConfig, renderFrame, PALETTE, SIZE } from '../src/index.js';

test('a painted pixel follows the pet into other frames', () => {
  const cfg = createConfig('cat_domestic');
  const f0 = renderFrame(cfg, 'stand', 0);
  const i = f0.keys.findIndex(k => k && k.startsWith('h:')); // a head pixel
  assert.ok(i >= 0);
  const painted = { ...cfg, paint: { [f0.keys[i]]: 'b55088' } };
  const walk = renderFrame(painted, 'walk', 2);
  assert.ok(walk.raw.includes('b55088'), 'painted color shows up while walking');
});

test('white coloring-book mode turns fur white but keeps outlines', () => {
  const cfg = { ...createConfig('dog_beagle'), paintBase: 'white' };
  const { raw, shown } = renderFrame(cfg, 'stand', 0);
  const fur = raw.filter(Boolean);
  assert.ok(fur.filter(c => c === 'ffffff').length > fur.length * 0.6);
  assert.ok(shown.some(c => c && c !== 'ffffff'), 'outline / eyes are still visible');
});

test('shading keeps each color in its own hue family', () => {
  const hue = h => { const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    if (!d || d / mx < 0.25) return null; let H = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; H *= 60; return H < 0 ? H + 360 : H; };
  for (const id of ['cat_domestic', 'budgie', 'treefrog', 'goldfish', 'dog_golden']) {
    const { raw, shown, slots } = renderFrame(createConfig(id), 'stand', 0);
    for (let i = 0; i < SIZE * SIZE; i++) if (raw[i] && shown[i] && raw[i] !== shown[i]) {
      const a = hue(raw[i]), b = hue(shown[i]); if (a === null || b === null) continue;
      const d = Math.min(Math.abs(a - b), 360 - Math.abs(a - b)); assert.ok(d <= 25, `${id}: ${raw[i]} shaded to ${shown[i]} (Δhue ${Math.round(d)})`);
    }
  }
});

test('config colors are always palette colors', () => {
  const c = createConfig('macaw'); for (const v of Object.values(c.colors)) assert.ok(PALETTE.includes(v), v);
});

test('painting the whole standing frame covers every pose, stale keys from another animal are ignored', async () => {
  const { listSpecies, createConfig, renderFrame, getPoses } = await import('../src/index.js');
  for (const { id } of listSpecies()) {
    const cfg = createConfig(id, 0), st = renderFrame(cfg, 'stand', 0);
    cfg.paint = {}; for (const k of st.keys) if (k && Object.keys(cfg.paint).length < 1100) cfg.paint[k] = 'ff0044';
    cfg.paint['zzz:1:1'] = '2ce8f5';
    const P = getPoses(cfg);
    for (const pose of Object.keys(P)) for (let f = 0; f < P[pose].frames; f++) {
      const r = renderFrame(cfg, pose, f);
      r.keys.forEach((k, i) => { if (k) assert.equal(r.raw[i], 'ff0044', `${id} ${pose}${f} ${k}`); });
    }
  }
});
