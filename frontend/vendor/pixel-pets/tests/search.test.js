import { test } from 'node:test';
import assert from 'node:assert/strict';
import { searchSpecies, listSpecies } from '../src/index.js';

const first = q => searchSpecies(q)[0]?.id;
test('exact names and synonyms', () => {
  assert.equal(first('Корги'), 'dog_corgi');
  assert.equal(first('хаски'), 'dog_husky');
  assert.equal(first('волнистик'), 'budgie');
});
test('typos', () => { assert.equal(first('крокадил'), 'croc'); assert.equal(first('аксалотль'), 'axolotl'); });
test('hyphens and ё', () => { assert.equal(first('мейн кун'), 'cat_maine'); assert.equal(first('ежик'), 'hedgehog'); });
test('group words find a whole category', () => { assert.ok(searchSpecies('рептилия').length >= 6); });
test('empty and unknown queries', () => { assert.deepEqual(searchSpecies(''), []); assert.deepEqual(searchSpecies('qwertyuiop'), []); });
test('catalog has 167 pets with unique ids', () => {
  const ids = listSpecies().map(s => s.id); assert.equal(ids.length, 167); assert.equal(new Set(ids).size, ids.length);
});
