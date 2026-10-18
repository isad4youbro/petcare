/**
 * @petcare/pixel-pets — public API.
 * A pet avatar is a small JSON config (~300 bytes). Everything visual is computed from it:
 * the same config renders identically in the browser, on the server and in tests.
 */
import * as E from './engine.generated.js';

/** Bump when a rig changes geometry so saved hand-painting may shift. Stored in every config. */
export const ENGINE_VERSION = 1;
export const SIZE = 32;
export const PALETTE = E.PAL.slice();
export const POSES = ['stand', 'walk', 'sit', 'sleep', 'jump'];
export const TYPES = E.TYPES;
export const PATTERN_LABELS = E.PATTERN_LABELS;
export const NECK = [['none', 'Ничего'], ['collar', 'Ошейник'], ['bell', 'Бубенчик'], ['bandana', 'Бандана']];
export const HEAD = [['none', 'Ничего'], ['bow', 'Бантик'], ['flower', 'Цветок'], ['hat', 'Колпачок'], ['glasses', 'Очки']];

/** Constructor options per body type (rig): [key, label, [[value, label], …]] */
export const OPTIONS = {
  cat: [
    ['ears', 'Уши', [['cat', 'Стоячие'], ['catSmall', 'Маленькие'], ['catBig', 'Большие'], ['tuft', 'С кисточками'], ['fold', 'Вислоухие']]],
    ['tail', 'Хвост', [['cat', 'Длинный'], ['fluffy', 'Пушистый'], ['thin', 'Тонкий'], ['bob', 'Короткий'], ['none', 'Без хвоста']]],
    ['coat', 'Шерсть', [['short', 'Короткая'], ['long', 'Длинная'], ['none', 'Без шерсти']]],
    ['face', 'Мордочка', [['normal', 'Обычная'], ['flat', 'Плоская'], ['long', 'Вытянутая']]],
    ['build', 'Телосложение', [['normal', 'Обычное'], ['chunky', 'Крепкое'], ['slim', 'Стройное'], ['big', 'Крупное']]]
  ],
  quad: [
    ['ears', 'Уши', [['cat', 'Кошачьи'], ['catSmall', 'Маленькие'], ['catBig', 'Большие'], ['tuft', 'С кисточками'], ['fold', 'Вислоухие'], ['dogUp', 'Стоячие'], ['fox', 'Лисьи'], ['semi', 'Полустоячие'], ['flop', 'Висячие'], ['flopLong', 'Длинные висячие'], ['round', 'Круглые'], ['mouse', 'Мышиные'], ['tiny', 'Крошечные'], ['bunny', 'Заячьи'], ['lop', 'Висячие заячьи'], ['horse', 'Конские'], ['pig', 'Свиные'], ['none', 'Нет']]],
    ['tail', 'Хвост', [['cat', 'Длинный'], ['fluffy', 'Пушистый'], ['thin', 'Тонкий'], ['bob', 'Короткий'], ['dog', 'Собачий'], ['curl', 'Бубликом'], ['bushy', 'Пышный'], ['squirrel', 'Беличий'], ['rat', 'Голый'], ['otter', 'Хорьковый'], ['pom', 'Помпон'], ['stub', 'Обрубок'], ['horse', 'Конский'], ['pig', 'Крючком'], ['none', 'Нет']]],
    ['coat', 'Шерсть', [['short', 'Короткая'], ['long', 'Длинная'], ['curly', 'Кудрявая'], ['wool', 'Шерсть-руно'], ['spiky', 'Иголки'], ['none', 'Без шерсти']]],
    ['face', 'Мордочка', [['normal', 'Обычная'], ['flat', 'Плоская'], ['long', 'Вытянутая']]],
    ['build', 'Телосложение', [['normal', 'Обычное'], ['chunky', 'Крепкое'], ['slim', 'Стройное'], ['big', 'Крупное']]]
  ],
  bird: [
    ['crest', 'Хохолок', [['none', 'Нет'], ['tiel', 'Корелла'], ['too', 'Какаду'], ['comb', 'Гребешок'], ['tuft', 'Ушки']]],
    ['beak', 'Клюв', [['cone', 'Конусом'], ['hook', 'Крючком'], ['duck', 'Утиный']]],
    ['tail', 'Хвост', [['short', 'Короткий'], ['long', 'Длинный'], ['fan', 'Веером'], ['duck', 'Утиный'], ['peacock', 'Павлиний']]]
  ],
  fish: [['shape', 'Форма', [['oval', 'Овальная'], ['veil', 'Вуалевая'], ['tall', 'Высокая'], ['long', 'Вытянутая'], ['bottom', 'Донная'], ['clown', 'Клоун']]]],
  crust: [['kind', 'Вид', [['shrimp', 'Креветка'], ['cray', 'Рак'], ['hermit', 'Отшельник']]]],
  insect: [['kind', 'Вид', [['mantis', 'Богомол'], ['stick', 'Палочник'], ['roach', 'Таракан'], ['ant', 'Муравей']]]]
};
/** Patterns allowed per rig */
export const PATTERNS_BY_RIG = {
  cat: ['solid', 'tabby', 'spots', 'rosette', 'bicolor', 'tuxedo', 'socks', 'colorpoint', 'calico', 'tortie', 'mask', 'ticked', 'piebald', 'merle'],
  croc: ['solid'], horse: ['solid', 'blaze', 'socks', 'dapple', 'piebald', 'spots'],
  quad: ['solid', 'tabby', 'spots', 'rosette', 'bicolor', 'tuxedo', 'socks', 'colorpoint', 'calico', 'tortie', 'mask', 'ticked', 'saddle', 'tanpoints', 'merle', 'brindle', 'piebald', 'dutch', 'hooded', 'blaze', 'dapple', 'harlequin', 'bernard'],
  bird: ['solid', 'barred', 'cheek', 'wingbar', 'spots', 'piebald', 'tabby'],
  lizard: ['solid', 'leopard', 'blotch', 'bands', 'stripe', 'spots'], chameleon: ['solid', 'stripe', 'spots', 'bands'],
  snake: ['solid', 'blotch', 'bands', 'stripe', 'spots'], turtle: ['solid', 'spots', 'redear'], frog: ['solid', 'spots', 'leopard', 'stripe'],
  axolotl: ['solid', 'spots', 'piebald', 'blotch'], fish: ['solid', 'bands', 'stripe', 'spots', 'tabby', 'piebald', 'merle'],
  crust: ['solid', 'spots', 'stripe', 'bands'], snail: ['solid', 'spots', 'stripe'], spider: ['solid', 'stripe', 'bands', 'spots'],
  insect: ['solid', 'stripe', 'bands', 'spots'], scorpion: ['solid', 'stripe', 'bands', 'spots']
};
/** Label of the extra color slot per rig (null = rig has no extra color) */
export const EXT_LABEL = { cat: null, croc: null, horse: 'Копыта', quad: 'Копыта и рожки', bird: 'Клюв', lizard: 'Гребень', chameleon: 'Ветка', turtle: 'Панцирь', snake: null, frog: null, axolotl: 'Жабры', fish: 'Плавники', crust: 'Хвост и усы', snail: 'Раковина', spider: null, insect: null, scorpion: 'Жало' };
/** Rigs that hover instead of standing on the ground (UI may lift them) */
export const FLOATING_RIGS = ['fish'];

const COLOR_KEYS = ['base', 'sec', 'pat', 'eye', 'ext', 'feet', 'acc'];
const HEX = /^[0-9a-f]{6}$/;
const PAINT_KEY = /^[a-z0-9]{1,8}(:-?[a-z0-9]{1,3}){0,3}$/i;
const MAX_PAINT = 1100;

/* ---------------- catalog ---------------- */
const publicSpecies = s => ({ id: s.id, name: s.name, synonyms: s.syn, type: s.type, typeName: E.TYPES[s.type][0], rig: s.rig,
  presets: s.presets.map(p => ({ name: p.n, pattern: p.pattern, colors: presetColors(p) })) });
function presetColors(p) { return { base: p.base, sec: p.sec, pat: p.pat, eye: p.eye, ext: p.ext || '3e2731', feet: p.feet || 'e4a672' }; }

/** All species (optionally of one type), in catalog order */
export function listSpecies(type) { return E.CATALOG.filter(s => !type || s.type === type).map(publicSpecies); }
export function getSpecies(id) { const s = E.byId[id]; return s ? publicSpecies(s) : null; }

/* ---------------- configs ---------------- */
/** New config for a species from one of its presets */
export function createConfig(speciesId, presetIndex = 0, extra = {}) {
  const s = E.byId[speciesId];
  if (!s) throw new Error(`Unknown species: ${speciesId}`);
  const p = s.presets[Math.max(0, Math.min(presetIndex, s.presets.length - 1))];
  return Object.assign({ engineVersion: ENGINE_VERSION, species: s.id, name: '', parts: {}, pattern: p.pattern,
    colors: Object.assign(presetColors(p), { acc: 'e43b44' }), neck: 'none', head: 'none', paint: {}, paintBase: 'constructor' }, extra);
}
/** Returns a copy with a species preset applied (keeps shape, accessories, painting) */
export function applyPreset(config, presetIndex) {
  const s = E.byId[config.species]; const p = s.presets[presetIndex];
  if (!p) throw new Error(`Preset ${presetIndex} not found for ${config.species}`);
  return Object.assign({}, config, { pattern: p.pattern, colors: Object.assign({}, config.colors, presetColors(p)) });
}
/** Returns a copy switched to another species; resets parts that the new body type does not have */
export function changeSpecies(config, speciesId, presetIndex = 0) {
  const next = createConfig(speciesId, presetIndex);
  return Object.assign(next, { name: config.name, neck: config.neck, head: config.head, colors: Object.assign(next.colors, { acc: config.colors?.acc || 'e43b44' }) });
}
/** Body type + effective parameters for rendering */
export function resolveSpec(config) {
  const s = E.byId[config.species] || E.byId.cat_domestic;
  return { rig: s.rig, p: Object.assign({}, s.p, config.parts || {}) };
}
export function getRig(config) { return resolveSpec(config).rig; }
/** {pose: {frames, fps}} for this config's body type */
export function getPoses(config) { return E.posesOf(resolveSpec(config)); }

/** Upgrades older configs. Pure: returns a new object. */
export function migrateConfig(config) {
  const c = JSON.parse(JSON.stringify(config || {}));
  if (!c.engineVersion) c.engineVersion = 1;
  if (!c.colors) c.colors = {};
  for (const k of COLOR_KEYS) if (!c.colors[k]) c.colors[k] = { ext: '3e2731', feet: 'e4a672', acc: 'e43b44' }[k] || '8b9bb4';
  c.parts = c.parts || {}; c.paint = c.paint || {}; c.neck = c.neck || 'none'; c.head = c.head || 'none';
  c.paintBase = c.paintBase === 'white' ? 'white' : 'constructor';
  // future: if (c.engineVersion < 2) { remap paint keys of rigs whose geometry changed; c.engineVersion = 2; }
  return c;
}

/** Validates a config coming from a client. Use it on the backend before saving. */
export function validateConfig(config) {
  const errors = [];
  const fail = m => errors.push(m);
  if (!config || typeof config !== 'object') return { ok: false, errors: ['config must be an object'] };
  const s = E.byId[config.species];
  if (!s) fail(`unknown species "${config.species}"`);
  const rig = s ? s.rig : null;
  if (config.engineVersion !== undefined && !(Number.isInteger(config.engineVersion) && config.engineVersion >= 1 && config.engineVersion <= ENGINE_VERSION)) fail('bad engineVersion');
  if (config.name !== undefined && (typeof config.name !== 'string' || config.name.length > 32)) fail('name must be a string up to 32 chars');
  if (!config.colors || typeof config.colors !== 'object') fail('colors missing');
  else for (const k of Object.keys(config.colors)) {
    if (!COLOR_KEYS.includes(k)) fail(`unknown color slot "${k}"`);
    else if (!HEX.test(config.colors[k]) || !PALETTE.includes(config.colors[k])) fail(`color ${k} must be a palette hex`);
  }
  if (rig) {
    const opts = OPTIONS[rig] || [];
    for (const [k, v] of Object.entries(config.parts || {})) {
      const o = opts.find(x => x[0] === k);
      if (!o) fail(`part "${k}" not available for ${rig}`);
      else if (!o[2].some(x => x[0] === v)) fail(`part ${k}="${v}" not allowed`);
    }
    if (!(PATTERNS_BY_RIG[rig] || ['solid']).includes(config.pattern)) fail(`pattern "${config.pattern}" not allowed for ${rig}`);
  }
  if (config.neck !== undefined && !NECK.some(x => x[0] === config.neck)) fail('bad neck accessory');
  if (config.head !== undefined && !HEAD.some(x => x[0] === config.head)) fail('bad head accessory');
  if (config.paintBase !== undefined && !['constructor', 'white'].includes(config.paintBase)) fail('bad paintBase');
  const paint = config.paint || {};
  if (typeof paint !== 'object' || Array.isArray(paint)) fail('paint must be an object');
  else {
    const keys = Object.keys(paint);
    if (keys.length > MAX_PAINT) fail('too many painted pixels');
    for (const k of keys) { if (!PAINT_KEY.test(k)) { fail(`bad paint key "${k}"`); break; } if (!PALETTE.includes(paint[k])) { fail(`bad paint color at "${k}"`); break; } }
  }
  return { ok: errors.length === 0, errors };
}

/* ---------------- rendering ---------------- */
const internalCfg = config => Object.assign({}, config, { spec: resolveSpec(config), colors: Object.assign({ ext: '3e2731', feet: 'e4a672', acc: 'e43b44' }, config.colors) });

/**
 * Renders one frame. Returns RGBA pixels (32×32×4) plus `raw`/`shown` hex per pixel and
 * `keys` (part-local key per pixel, used by painting tools). Frame index wraps around.
 */
export function renderFrame(config, pose = 'stand', frame = 0) {
  const cfg = internalCfg(config), P = E.posesOf(cfg.spec)[pose] || E.posesOf(cfg.spec).stand;
  const f = ((frame % P.frames) + P.frames) % P.frames;
  const sprite = E.buildSprite(cfg, POSES.includes(pose) ? pose : 'stand', f);
  const col = E.colorize(sprite, cfg);
  return { width: SIZE, height: SIZE, rgba: col.rgba, raw: col.raw, shown: col.shown, keys: sprite.keys, slots: sprite.slots };
}
/** Indices of pixels that differ between two configs (e.g. to highlight what an edit changed) */
export function diffPixels(configA, configB, pose = 'stand', frame = 0) {
  const a = renderFrame(configA, pose, frame).rgba, b = renderFrame(configB, pose, frame).rgba, out = [];
  for (let i = 0; i < SIZE * SIZE; i++) { const j = i * 4; if (a[j] !== b[j] || a[j + 1] !== b[j + 1] || a[j + 2] !== b[j + 2] || a[j + 3] !== b[j + 3]) out.push(i); }
  return out;
}
/** Nearest palette color for any rgb triple (photo color picking, imports) */
export function nearestPaletteColor(r, g, b) { return E.nearestPal([r, g, b]); }

/* ---------------- search ---------------- */
const norm = s => (s || '').toLowerCase().replace(/ё/g, 'е').replace(/[-–—]/g, ' ').replace(/[^a-zа-я0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
function lev(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 9;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) { const cur = [i]; for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
  return prev[b.length];
}
function score(e, q) {
  const name = norm(e.name), syn = norm(e.syn), words = (name + ' ' + syn).split(' ').filter(Boolean), grp = norm(E.TYPES[e.type][0] + ' ' + E.TYPES[e.type][1]).split(' ');
  if (name === q) return 100; if (syn.split(' ').includes(q)) return 95; if (name.startsWith(q)) return 90;
  if (words.some(w => w.startsWith(q))) return 80;
  if (q.length >= 3 && (name.includes(q) || syn.includes(q))) return 70;
  if (q.length >= 4) { const tol = q.length >= 7 ? 2 : 1; if (words.some(w => lev(q, w) <= tol || (w.length > q.length && lev(q, w.slice(0, q.length)) <= tol))) return 55; }
  if (q.length >= 3 && grp.some(w => w.startsWith(q))) return 40;
  return 0;
}
/** Fuzzy search by name, synonyms, typos and group words ("крокадил", "мейн кун", "рептилия") */
export function searchSpecies(query, limit = 18) {
  const q = norm(query); if (!q) return [];
  return E.CATALOG.map(e => ({ e, s: score(e, q) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, limit).map(x => publicSpecies(x.e));
}

/* ---------------- kinds ("кто на фото": species, not breeds) ---------------- */
const publicKind = k => ({ id: k.id, name: k.name, type: k.type, speciesIds: k.species.slice(), representative: k.rep });
/** Animal kinds for the photo flow: all dog breeds are one kind "Собака", all cats — "Кошка", and so on. Kind ids are their own namespace. */
export function listKinds() { return E.KINDS.map(publicKind); }
export function getKind(id) { const k = E.KINDS.find(k => k.id === id); return k ? publicKind(k) : null; }
export function kindOfSpecies(speciesId) { return E.kindOf[speciesId] || null; }
/** Fuzzy kind search: "сабака" → Собака, "корги" → Собака, "крокадил" → Крокодил */
export function searchKinds(query, limit = 12) {
  const q = norm(query); if (!q) return [];
  const r = E.KINDS.map(k => ({ k, s: score(k, q) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s);
  return r.filter(x => x.s >= r[0].s - 25).slice(0, limit).map(x => publicKind(x.k));
}

/* ---------------- photo → colorway ---------------- */
function rankPreset(s, i, photoColors, base) {
  const m = E.matchPreset(s, i, photoColors); if (!m) return null;
  const p = s.presets[i], colors = Object.assign(presetColors(p), { base: m.res.base, sec: m.res.sec, pat: m.res.pat, eye: m.res.eye });
  const config = Object.assign(createConfig(s.id, i), base, { species: s.id, parts: {}, pattern: p.pattern, colors: Object.assign({ acc: (base.colors && base.colors.acc) || 'e43b44' }, colors) });
  return { speciesId: s.id, speciesName: s.name, presetIndex: i, presetName: p.n, score: m.score, config };
}
/**
 * Photo colors → ranked colorways of one species. The breed keeps its silhouette and markings, the photo
 * only supplies the colors. `photoColors`: [{hex, share}] (palette hexes, shares 0..1), e.g. from client-side
 * k-means. Returns [{speciesId, presetIndex, presetName, score, config}] best first.
 */
export function matchPhotoColors(speciesId, photoColors, base = {}) {
  const s = E.byId[speciesId]; if (!s) throw new Error(`Unknown species: ${speciesId}`);
  return s.presets.map((_, i) => rankPreset(s, i, photoColors, base)).filter(Boolean).sort((a, b) => a.score - b.score);
}
/**
 * Same across every breed of a kind (what the photo tab uses: the user picks "Собака", not a breed).
 * The best colorway of each breed comes first, then the remaining colorways. `preferSpecies` (e.g. the breed
 * the user already picked) is moved to the top: by colors alone a corgi and a red-white Saint Bernard look alike.
 */
export function matchPhotoKind(kindId, photoColors, base = {}, { preferSpecies } = {}) {
  const k = E.KINDS.find(k => k.id === kindId); if (!k) throw new Error(`Unknown kind: ${kindId}`);
  const all = []; for (const id of k.species) { const s = E.byId[id]; s.presets.forEach((_, i) => { const r = rankPreset(s, i, photoColors, base); if (r) all.push(r); }); }
  all.sort((a, b) => a.score - b.score);
  const seen = new Set(), first = [], rest = [];
  for (const r of all) (seen.has(r.speciesId) ? rest : (seen.add(r.speciesId), first)).push(r);
  const out = first.concat(rest), i = out.findIndex(r => r.speciesId === preferSpecies);
  if (i > 0) out.unshift(out.splice(i, 1)[0]);
  return out;
}
