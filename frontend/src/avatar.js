import { createConfig, getSpecies, getKind, kindOfSpecies, nearestPaletteColor, validateConfig, PATTERNS_BY_RIG, searchSpecies } from '../vendor/pixel-pets/src/index.js'

const legacy = { cat: 'cat_domestic', dog: 'dog_mongrel', bird: 'budgie', snake: 'cornsnake', lizard: 'gecko', turtle: 'tortoise', fish: 'goldfish', hamster: 'hamster_syr', hedgehog: 'hedgehog', spider: 'tarantula', snail: 'achatina', frog: 'treefrog', other: 'cat_domestic' }
export function paletteColor(hex = '#d9d6cf') {
  const parts = hex.replace('#', '').match(/.{2}/g) || ['d9', 'd6', 'cf']
  return nearestPaletteColor(...parts.slice(0, 3).map(x => parseInt(x, 16)))
}
export function avatarConfig(pet) {
  const stored = pet.avatar?.sprite
  if (stored && validateConfig(stored).ok) return { ...stored, name: (pet.name || '').slice(0, 32) }
  const old = pet.avatar || {}, id = getSpecies(pet.species)?.id || searchSpecies(pet.breed || pet.species, 1)[0]?.id || legacy[old.shape || pet.species] || 'cat_domestic'
  const config = createConfig(id, 0, { name: (pet.name || '').slice(0, 32), neck: 'collar', pattern: 'solid' })
  config.colors = { ...config.colors, base: paletteColor(old.color), sec: paletteColor(old.secondary || '#f1e8d6'), pat: paletteColor(old.secondary || '#77624f'), eye: paletteColor(old.eyes || '#315c4b'), acc: paletteColor(old.collar || '#bc6852') }
  const patterns = { plain: 'solid', stripes: 'tabby', spots: 'spots', patches: 'bicolor' }
  const pattern = patterns[old.pattern]
  if (PATTERNS_BY_RIG[getSpecies(id).rig]?.includes(pattern)) config.pattern = pattern
  return config
}
export function speciesName(pet) { return getKind(kindOfSpecies(pet.species))?.name || getSpecies(pet.species)?.name || ({ cat: 'Кошка', dog: 'Собака', bird: 'Птица', snake: 'Змея', lizard: 'Ящерица', turtle: 'Черепаха', fish: 'Рыбка', hamster: 'Хомяк', rabbit: 'Кролик' })[pet.species] || pet.species }
