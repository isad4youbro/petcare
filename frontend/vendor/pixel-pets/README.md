# @petcare/pixel-pets

Пиксельные анимированные аватары питомцев для PetCare: 167 видов и пород, 5 поз, около 600 готовых окрасов, конструктор, раскраска и цвета по фото.

Без зависимостей. Рисует на `<canvas>`. Вес вместе с каталогом около 37 КБ (minify + gzip).

## Главная идея

Аватар хранится как маленький JSON-конфиг (около 300 байт), а не как картинка. Из конфига движок в любой момент рисует любой кадр любой позы. Один и тот же конфиг даёт одинаковые пиксели в браузере, на сервере и в тестах.

```json
{
  "engineVersion": 1,
  "species": "dog_shiba",
  "name": "Мочи",
  "parts": { "ears": "dogUp" },
  "pattern": "bicolor",
  "colors": { "base": "d77643", "sec": "ffffff", "pat": "be4a2f", "eye": "3e2731", "ext": "3e2731", "feet": "e4a672", "acc": "e43b44" },
  "neck": "bandana",
  "head": "none",
  "paintBase": "constructor",
  "paint": {}
}
```

| Поле | Что это |
|---|---|
| `species` | id вида или породы из каталога (`listSpecies()`) |
| `parts` | переопределения формы для конструктора; набор зависит от типа тела (`OPTIONS[rig]`) |
| `pattern` | узор; допустимые значения для типа тела в `PATTERNS_BY_RIG[rig]` |
| `colors` | цвета зон, только из палитры `PALETTE` (32 цвета) |
| `neck`, `head` | аксессуары |
| `paint` | ручная раскраска: ключ пикселя → цвет; ключи привязаны к частям тела, поэтому раскраска едет вместе с анимацией |
| `engineVersion` | версия геометрии; нужна, чтобы старые раскраски не «съехали» после перерисовки вида |

## Использование в этом репозитории

Это встроенная библиотека, отдельная установка для PetCare не нужна. Из корня проекта: npm --prefix frontend ci, затем npm --prefix frontend test и npm --prefix frontend run build. Примеры ниже показывают API библиотеки; в приложении импорты идут по относительному пути в frontend/vendor/pixel-pets/src. Backend проекта использует SQLite, а не предлагаемые ниже JSONB/Pydantic-примеры интеграции.

При изменении engine/ выполните node frontend/vendor/pixel-pets/scripts/build.mjs и добавьте обновлённый src/engine.generated.js в тот же коммит.

## Автономная установка библиотеки

Пакет пока лежит в репозитории, поэтому подключаем его как локальную зависимость:

```bash
npm i ./pixel-pets        # или "workspaces" в монорепо
npm test                  # тесты
npm run test:coverage     # отчёт о покрытии (консоль + coverage.lcov)
```

Если меняете файлы в `engine/`, перед коммитом выполните `npm run build`.

## Фронтенд

### React

```jsx
import { PetSprite } from '@petcare/pixel-pets/react';

<PetSprite config={pet.avatar} pose="walk" size={96} />

```

### Без фреймворка

```js
import { createConfig } from '@petcare/pixel-pets';
import { PetSprite } from '@petcare/pixel-pets/sprite';

const s = new PetSprite(canvas, createConfig('cat_maine', 2), { pose: 'sit' });
s.setPose('sleep');
s.setConfig(newConfig, { flash: true });
s.destroy();
```

Все спрайты на странице работают в одном цикле `requestAnimationFrame`. Спрайты за пределами экрана не перерисовываются, а при `prefers-reduced-motion` анимация замирает на первом кадре. Готовый пример лежит в `examples/vanilla.html`.

### Конструктор: что дать пользователю

```js
import { listSpecies, searchSpecies, getSpecies, createConfig, applyPreset, changeSpecies,
         getRig, OPTIONS, PATTERNS_BY_RIG, PATTERN_LABELS, EXT_LABEL, NECK, HEAD, PALETTE } from '@petcare/pixel-pets';

searchSpecies('крокадил');            // нечёткий поиск: опечатки, синонимы, «рептилия»
const rig = getRig(config);           // 'cat' | 'quad' | 'bird' | 'fish' | …
OPTIONS[rig];                         // строки конструктора: [ключ, подпись, [[значение, подпись]…]]
PATTERNS_BY_RIG[rig];                 // доступные узоры
applyPreset(config, 3);               // окрас из пресетов вида
changeSpecies(config, 'budgie');      // смена вида с сохранением клички и аксессуаров
```

### Раскраска

`renderFrame(config, 'stand', 0)` возвращает `keys[i]`, то есть ключ части тела для каждого пикселя. Кисть записывает `config.paint[keys[i]] = '<hex>'`. Если поставить `paintBase: 'white'`, получится белая основа для раскраски.

Рисуют на стоящем кадре (`stand`, кадр 0). Точки, которых на нём нет (сложенные ноги, раскрытые крылья, перепонка летяги), берут цвет ближайшей точки той же части тела. Если такой нет, берётся цвет, которым закрашена большая часть этой части или тела. Ключи, которых нет на стоящем кадре этого вида (например, остались от другого животного), игнорируются. При смене вида раскраску лучше очищать: `changeSpecies` это делает.

### Цвета по фото

На вкладке с фото пользователь выбирает не породу, а вид («Собака», «Кошка», «Черепаха»). Порядок такой: выбрать вид, загрузить фото и обрезать его так, чтобы остался только питомец. После этого фронт находит основные цвета (k-means на клиенте, фото на сервер не отправляется):

```js
import { listKinds, searchKinds, kindOfSpecies, matchPhotoKind, matchPhotoColors } from '@petcare/pixel-pets';

searchKinds('сабака');   // [{ id: 'dog', name: 'Собака', speciesIds: [...39 пород] }]
const photoColors = [{ hex: 'ffffff', share: 0.54 }, { hex: 'e4a672', share: 0.36 }, { hex: '733e39', share: 0.1 }];
const ranked = matchPhotoKind('dog', photoColors, {}, { preferSpecies: 'dog_corgi' });
ranked[0].config;        // раскраска породы, перекрашенная в цвета с фото, — готовый конфиг
```

`matchPhotoKind` перебирает все раскраски всех пород вида: сначала идёт лучшая раскраска каждой породы, потом остальные. Каждая раскраска делится на зоны (основной цвет, светлые места, узор) с долями пикселей, и цвета фото раскладываются по зонам так, чтобы совпали доли, оттенки и порядок «светлее/темнее». Если пользователь уже выбрал породу, передайте её в `preferSpecies`, и она встанет первой: только по цветам бело-рыжие корги и сенбернар почти не различаются. `matchPhotoColors(speciesId, …)` делает то же самое для одной породы. Id видов (`listKinds()`) живут в своём пространстве имён и не путаются с id пород. Любой RGB приводится к палитре через `nearestPaletteColor(r, g, b)`.

## Бэкенд

1. **Хранение.** Одно поле у питомца, например `avatar JSONB NULL` в таблице `pets`. Отдельная таблица не нужна.
2. **Валидация перед сохранением.** Структуру проверяет схема `config.schema.json` (Swagger/OpenAPI, Pydantic, любые JSON Schema валидаторы). Если бэкенд на Node, используйте `validateConfig(config)`: она проверяет ещё и то, что части и узор допустимы для этого типа тела.
3. **API.** `GET/PUT /pets/{id}/avatar` возвращает и принимает конфиг как есть.
4. **Картинки для push, писем и превью** (Node ≥ 20, без нативных зависимостей):

```js
import { renderPNG, renderSpriteSheet } from '@petcare/pixel-pets/node';
const png = renderPNG(pet.avatar, { pose: 'stand', scale: 4 });             // Buffer 128×128
const sheet = renderSpriteSheet(pet.avatar, { pose: 'walk', scale: 2 });    // полоса кадров для CSS steps()
```

Если бэкенд не на Node, PNG рисует фронт через `toDataURL(config)` из `@petcare/pixel-pets/sprite`.

## Позы

`stand`, `walk`, `sit`, `sleep`, `jump`. Число кадров и fps зависят от типа тела, их возвращает `getPoses(config)`. Рыбы (`FLOATING_RIGS`) не стоят на полу, а парят.

## Версии и миграции

Раскраска привязана к геометрии спрайта. Поэтому если вид перерисовали так, что поменялась форма:

1. увеличьте `ENGINE_VERSION` в `src/index.js`;
2. добавьте в `migrateConfig()` шаг, который переносит ключи `paint` этого вида (или сбрасывает их);
3. читайте конфиги из БД через `migrateConfig()`.

## Тесты

Для тестов используется встроенный `node:test`, внешние пакеты не нужны. Что покрыто:

- все 167 видов × все пресеты × все позы × все кадры (около 22 000 кадров) рисуются, не пустые и стоят на полу;
- детерминизм рендера, зацикливание кадров, работа пресетов, частей и аксессуаров;
- раскраска переносится между кадрами, белая основа, цвета только из палитры;
- `validateConfig` отклоняет мусор: чужие части, цвета не из палитры, плохие ключи, длинные имена;
- миграции и смена вида;
- поиск с опечатками, синонимами и словами категорий, поиск видов для фото;
- подбор раскраски по цветам фото: по одной породе и по всем породам вида;
- PNG и спрайт-лист.

Покрытие строк около 97% (`npm run test:coverage`). Браузерные обёртки (`sprite.js`, `react.js`) тестируются e2e вместе с фронтом.

## Структура

```
engine/        исходники рисования (типы тела, узоры, каталог) — правьте здесь
src/
  engine.generated.js   собирается из engine/ (npm run build)
  index.js     публичное API
  sprite.js    анимация на canvas (браузер)
  react.js     React-компонент
  node.js      PNG и спрайт-листы на сервере
tests/         node:test
config.schema.json     схема конфига для бэкенда
examples/      пример без фреймворка
```
