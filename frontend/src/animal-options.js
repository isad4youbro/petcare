import { listSpecies, searchSpecies, TYPES, PATTERNS_BY_RIG } from '../vendor/pixel-pets/src/index.js'

export const animalGroups = [
  { id: 'cats', name: 'Кошки', types: ['cat'], pet: 'cat_domestic' },
  { id: 'dogs', name: 'Собаки', types: ['dog'], pet: 'dog_mongrel' },
  { id: 'birds', name: 'Птицы', types: ['bird', 'parrot'], pet: 'cockatiel' },
  { id: 'small', name: 'Мелкие звери', types: ['rodent', 'rabbit', 'hedgehog', 'glider', 'mustelid'], pet: 'hamster_syr' },
  { id: 'reptiles', name: 'Рептилии', types: ['snake', 'lizard', 'turtle', 'croc'], pet: 'cornsnake' },
  { id: 'water', name: 'Водные', types: ['fish', 'amphib', 'crust'], pet: 'goldfish' },
  { id: 'bugs', name: 'Беспозвоночные', types: ['bug', 'snail'], pet: 'achatina' },
  { id: 'other', name: 'Другие', types: ['farm', 'fox'], pet: 'horse' },
]
const catalog = listSpecies()
const normalize = value => value.toLowerCase().replace(/ё/g, 'е').replace(/[-–—]/g, ' ').trim()
const groupWords = new Set(Object.values(TYPES).flatMap(value => normalize(value.join(' ')).split(' ')))
export function groupOf(entry) { return animalGroups.find(group => group.types.includes(entry.type)) || animalGroups[0] }

// Search synonyms and spelling variants for each word, then intersect multiword queries.
export function findAnimals(query, groupId) {
  const text = normalize(query)
  if (!text) return catalog.filter(entry => groupOf(entry).id === groupId)
  const words = text.split(/\s+/).filter(Boolean), ranked = searchSpecies(text, catalog.length)
  const wordMatches = words.map(word => new Set(searchSpecies(word, catalog.length).map(entry => entry.id)))
  const results = catalog.map(entry => {
    const name = normalize(entry.name), matched = wordMatches.filter(matches => matches.has(entry.id)).length
    const rank = ranked.findIndex(result => result.id === entry.id)
    return { entry, score: (name === text ? 1000 : 0) + matched * 100 + (rank >= 0 ? 80 - rank / 10 : 0) }
  }).filter(result => result.score > 0 && (words.length === 1 || wordMatches.every(matches => matches.has(result.entry.id))))
    .sort((a, b) => b.score - a.score).map(result => result.entry)
  const specificWords = words.filter(word => !groupWords.has(word))
  const exact = results.filter(entry => specificWords.every(word => normalize(entry.name + ' ' + entry.synonyms).split(' ').some(part => part.startsWith(word))))
  return specificWords.length && exact.length ? exact : results
}

const mammals = ['ffffff', 'c0cbdc', '8b9bb4', '5a6988', '262b44', '181425', 'ead4aa', 'e4a672', 'c28569', 'd77643', 'b86f50', '733e39', '3e2731', 'f77622', 'feae34']
const narrowCats = new Set(['cat_russianblue', 'cat_chartreux', 'cat_korat'])
const whiteDogs = new Set(['dog_maltese', 'dog_samoyed'])
export function naturalColors(entry, slot = 'base') {
  if (slot === 'acc') return ['265c42', '733e39', '124e89', 'e43b44', '3e2731', 'ead4aa']
  if (slot === 'eye') return [...new Set([...entry.presets.map(preset => preset.colors.eye).filter(Boolean), '181425'])]
  const presetColors = entry.presets.map(preset => preset.colors[slot]).filter(Boolean)
  let colors
  if (narrowCats.has(entry.id)) colors = ['8b9bb4', '5a6988', 'c0cbdc']
  else if (whiteDogs.has(entry.id)) colors = ['ffffff', 'ead4aa']
  else if (['cat', 'dog', 'rodent', 'rabbit', 'mustelid', 'hedgehog', 'glider', 'farm', 'fox'].includes(entry.type)) colors = slot === 'base' && !['cat_domestic', 'dog_mongrel'].includes(entry.id) ? presetColors : mammals
  else colors = presetColors
  return [...new Set(colors.length ? colors : presetColors)]
}
export function naturalPatterns(entry) {
  const known = entry.presets.map(preset => preset.pattern)
  const basic = entry.type === 'cat' ? ['solid', 'tabby', 'spots', 'bicolor', 'tuxedo', 'socks', 'colorpoint', 'calico', 'tortie'] : entry.type === 'dog' ? ['solid', 'bicolor', 'socks', 'saddle', 'tanpoints', 'brindle', 'piebald'] : ['solid']
  const options = narrowCats.has(entry.id) || whiteDogs.has(entry.id) ? ['solid'] : [...new Set([...known, ...basic])]
  return options.filter(pattern => PATTERNS_BY_RIG[entry.rig]?.includes(pattern))
}
export const colorNames = { ffffff: 'Белый', c0cbdc: 'Светло-серый', '8b9bb4': 'Серый', '5a6988': 'Тёмно-серый', '262b44': 'Угольный', '181425': 'Чёрный', ead4aa: 'Кремовый', e4a672: 'Песочный', e8b796: 'Светло-розовый', c28569: 'Тауп', d77643: 'Рыжий', b86f50: 'Коричневый', '733e39': 'Шоколадный', '3e2731': 'Тёмно-коричневый', f77622: 'Оранжевый', feae34: 'Золотистый', fee761: 'Жёлтый', '63c74d': 'Светло-зелёный', '3e8948': 'Зелёный', '265c42': 'Тёмно-зелёный', '124e89': 'Синий', '0099db': 'Голубой', e43b44: 'Красный' }
