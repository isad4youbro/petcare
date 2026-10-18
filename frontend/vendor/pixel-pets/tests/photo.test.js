import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchPhotoColors, matchPhotoKind, listKinds, getKind, kindOfSpecies, searchKinds, listSpecies, validateConfig } from '../src/index.js';

const CORGI_PHOTO = [{ hex: 'ffffff', share: 0.54 }, { hex: 'e4a672', share: 0.36 }, { hex: '733e39', share: 0.1 }];

test('a red-and-white photo picks a red-and-white corgi colorway', () => {
  const r = matchPhotoColors('dog_corgi', CORGI_PHOTO);
  assert.equal(r.length, 3);
  assert.ok(['Рыже-белый', 'Соболь'].includes(r[0].presetName), r[0].presetName);
  const c = r[0].config.colors;
  assert.ok(c.base === 'e4a672' && c.sec === 'ffffff', JSON.stringify(c)); // coat orange, chest white
  for (const x of r) assert.ok(validateConfig(x.config).ok);
});
test('a solid black photo prefers a dark solid colorway', () => {
  const r = matchPhotoColors('dog_lab', [{ hex: '262b44', share: 0.9 }, { hex: '3a4466', share: 0.1 }]);
  assert.equal(r[0].presetName, 'Чёрный');
});
test('no usable colors → empty result', () => { assert.deepEqual(matchPhotoColors('cat_domestic', [{ hex: 'ffffff', share: 0.01 }]), []); });

test('kinds: every species belongs to exactly one kind; breeds are grouped', () => {
  const kinds = listKinds(), seen = new Set();
  for (const k of kinds) for (const id of k.speciesIds) { assert.ok(!seen.has(id), id); seen.add(id); assert.equal(kindOfSpecies(id), k.id); }
  assert.equal(seen.size, listSpecies().length);
  assert.equal(getKind('dog').speciesIds.length, listSpecies('dog').length);
  assert.equal(getKind('cat').speciesIds.length, listSpecies('cat').length);
  assert.equal(getKind('nope'), null);
});
test('kind search tolerates typos and finds kinds by breed names', () => {
  assert.equal(searchKinds('сабака')[0].id, 'dog');
  assert.equal(searchKinds('корги')[0].id, 'dog');
  assert.equal(searchKinds('мейн кун')[0].id, 'cat');
  assert.equal(searchKinds('крокадил')[0].id, 'croc');
  assert.equal(searchKinds('богомол')[0].id, 'mantis');
  assert.deepEqual(searchKinds(''), []);
});
test('photo across all dog breeds: red-white breeds first, one colorway per breed, preferred breed on top', () => {
  const r = matchPhotoKind('dog', CORGI_PHOTO);
  assert.ok(r.slice(0, 8).some(x => x.speciesId === 'dog_corgi'));
  for (const x of r.slice(0, 4)) assert.ok(['ffffff', 'e4a672'].includes(x.config.colors.base), x.speciesName);
  assert.equal(matchPhotoKind('dog', CORGI_PHOTO, {}, { preferSpecies: 'dog_corgi' })[0].speciesId, 'dog_corgi');
  const breeds = listSpecies('dog').length, top = r.slice(0, breeds).map(x => x.speciesId);
  assert.equal(new Set(top).size, breeds);
  for (const x of r.slice(0, 10)) assert.ok(validateConfig(x.config).ok);
  assert.throws(() => matchPhotoKind('nope', CORGI_PHOTO));
});
