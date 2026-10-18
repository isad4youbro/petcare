import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listSpecies, createConfig, validateConfig, migrateConfig, changeSpecies, ENGINE_VERSION, getSpecies } from '../src/index.js';

test('every preset produces a valid config', () => {
  for (const s of listSpecies()) for (let i = 0; i < s.presets.length; i++) {
    const r = validateConfig(createConfig(s.id, i));
    assert.ok(r.ok, `${s.id}#${i}: ${r.errors.join(', ')}`);
  }
});

test('validation rejects bad input', () => {
  const ok = createConfig('cat_domestic');
  const bad = [
    { ...ok, species: 'dragon' },
    { ...ok, colors: { ...ok.colors, base: 'zzzzzz' } },
    { ...ok, colors: { ...ok.colors, base: '123456' } },          // not in palette
    { ...ok, parts: { ears: 'wings' } },
    { ...ok, parts: { crest: 'tiel' } },                           // bird part on a cat
    { ...ok, pattern: 'redear' },
    { ...ok, neck: 'scarf' },
    { ...ok, paint: { '<script>': 'ffffff' } },
    { ...ok, name: 'x'.repeat(40) },
    null
  ];
  for (const b of bad) assert.equal(validateConfig(b).ok, false, JSON.stringify(b)?.slice(0, 80));
});

test('config stays tiny for storage', () => {
  const c = createConfig('dog_shiba', 1, { name: 'Мочи', neck: 'bandana', head: 'flower' });
  assert.ok(new TextEncoder().encode(JSON.stringify(c)).length < 400);
});

test('migrateConfig fills defaults and version', () => {
  const m = migrateConfig({ species: 'rabbit', colors: { base: 'ffffff' }, pattern: 'solid' });
  assert.equal(m.engineVersion, 1); assert.ok(m.colors.acc && m.colors.eye); assert.deepEqual(m.paint, {});
  assert.ok(ENGINE_VERSION >= 1);
});

test('changeSpecies keeps name and accessories, drops foreign parts', () => {
  const c = { ...createConfig('dog_lab'), name: 'Рекс', neck: 'bell', parts: { ears: 'flopLong' } };
  const n = changeSpecies(c, 'budgie');
  assert.equal(n.name, 'Рекс'); assert.equal(n.neck, 'bell'); assert.deepEqual(n.parts, {});
  assert.ok(validateConfig(n).ok);
});

test('createConfig throws on unknown species; getSpecies returns null', () => {
  assert.throws(() => createConfig('unicorn'));
  assert.equal(getSpecies('unicorn'), null);
});
