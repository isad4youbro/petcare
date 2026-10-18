import test from 'node:test'
import assert from 'node:assert/strict'
import { getSpecies, listSpecies, PALETTE } from '../vendor/pixel-pets/src/index.js'
import { findAnimals, naturalColors, groupOf } from './animal-options.js'

test('animal search handles combined species, breed synonyms and spelling mistakes', () => {
  assert.equal(findAnimals('британская кошка', 'dogs')[0].id, 'cat_british')
  assert.equal(findAnimals('корги', 'cats')[0].id, 'dog_corgi')
  assert.deepEqual(findAnimals('корги', 'cats').map(entry => entry.id), ['dog_corgi'])
  assert.equal(findAnimals('крокадил', 'cats')[0].id, 'croc')
  assert.ok(findAnimals('мейн кун', 'cats').some(entry => entry.id === 'cat_maine'))
  assert.deepEqual(findAnimals('британская змея', 'cats'), [])
})
test('natural coat palettes respect species while keeping exotic colors for appropriate animals', () => {
  assert.ok(!naturalColors(getSpecies('cat_british')).includes('63c74d'))
  assert.deepEqual(naturalColors(getSpecies('cat_russianblue')), ['8b9bb4', '5a6988', 'c0cbdc'])
  assert.ok(naturalColors(getSpecies('budgie')).includes('63c74d'))
  assert.ok(naturalColors(getSpecies('macaw')).includes('e43b44'))
  for (const entry of listSpecies()) {
    assert.ok(groupOf(entry).types.includes(entry.type))
    for (const slot of ['base', 'sec', 'pat', 'eye', 'acc', 'ext']) {
      const colors = naturalColors(entry, slot)
      assert.ok(colors.length > 0, entry.id + ':' + slot)
      assert.ok(colors.every(color => PALETTE.includes(color)))
    }
  }
})
