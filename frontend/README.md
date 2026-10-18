# Frontend PetCare

React рисует страницы, Vite собирает JS/CSS, Radix отвечает за доступные диалоги и списки, canvas — за пиксельных питомцев. Исходники остаются читаемыми; минифицированный dist генерируется при сборке и не хранится в Git.

## Путь данных

Пользователь нажимает кнопку → компонент проверяет форму → `api` в `src/data.js` выбирает режим → ответ обновляет React state → экран перерисовывается. В полном режиме запрос идёт в `/api` Python-сервера; в портфолио — в `portfolio/store.js`, где данные сохраняются в localStorage.

## Карта исходников

| Путь | Зачем нужен |
|---|---|
| index.html | HTML-каркас и точка подключения JS |
| src/main.jsx | Подключение стилей, начальная тема, createRoot |
| src/App.jsx | Root выбирает обычный дневник или QR-карточку. App хранит страницу, питомца, модальные окна и состояние. Home/Profile/Health/Food/Calendar/Search отображают разделы; PetForm/RecordForm сохраняют данные |
| src/data.js | api, экспорт календаря, форматирование дат, возраст, ближайшие и последние записи |
| src/portfolio/config.js | Флаг VITE_PORTFOLIO и базовый URL |
| src/portfolio/store.js | createPortfolioStore: чтение/запись, CRUD, локальный поиск, QR-отчёты, сброс; portfolioCalendar создаёт ICS |
| src/portfolio/seed.json | Только вымышленные начальные питомцы и истории |
| src/components/auth.jsx | Вход/регистрация для сервера; описание и кнопка демо для Pages |
| src/components/public-tag.jsx | Публичная карточка, загрузка фото, согласие на геолокацию, предпросмотр отчёта |
| src/components/tag-settings.jsx | Настройка QR-карточки, генерация PNG через qrcode, просмотр сообщений |
| src/components/avatar-editor.jsx | Выбор животного, цвета, формы и вкладок редактора |
| src/components/pet.jsx | Отрисовка аватара |
| src/components/pet-walkway.jsx | Питомец у нижней границы, pointer-события, перенос и отпускание |
| src/components/care-widget.jsx | Отдельное окно с питомцем и делами |
| src/components/care-fields.jsx | Поля повторных процедур |
| src/components/calendar-transfer.jsx | Экспорт и передача календаря |
| src/components/food-autocomplete.jsx | Подсказки названий корма |
| src/components/reminders-popover.jsx | Список ближайших дел по колокольчику |
| src/components/pet-notices.jsx | Подсказки питомца на сайте |
| src/components/guide.jsx | Короткое знакомство с разделами |
| src/components/theme-toggle.jsx | Переключение темы и системный режим |
| src/theme-preference.js | Чтение настройки, реакция на prefers-color-scheme |
| src/components/welcome-story.jsx | Приветственный экран с декоративными животными |
| src/components/error-page.jsx | Состояния ошибки/запрета/отсутствия страницы |
| src/components/brand.jsx, pixel-icons.jsx | Логотип и пиксельные значки |
| src/components/ui | Общие кнопки, поля, диалоги, select, sheet и таблица |
| src/avatar.js, pets.js | Настройки аватаров, подписи видов и типов событий |
| src/animal-options.js | Поиск вида/породы и допустимые палитры |
| src/avatar-tools.js, photo-avatar.js | Инструменты раскраски, кадрирования и подбора цветов |
| src/image-upload.js | Проверка фото, HEIC-конвертация и уменьшение перед сохранением |
| src/care.js, companion.js | Расчёты ухода и правил напоминаний |
| src/push.js | Опциональный Web Push для серверного режима |
| src/lib | Вспомогательные функции компонентов |
| src/*.css, components/*.css | Тема, компоновка, пиксельные рамки и адаптивность |
| src/assets/fonts, public/assets/fonts | Локальные шрифты и лицензии |
| public/assets/illustrations | Иллюстрации разделов |
| public/swagger* | Статическая оболочка API-документации |
| public/rfc.html | Краткая схема архитектуры |
| public/sw.js | Service worker опционального Web Push |
| vendor/pixel-pets | Движок рисунков, каталог, анимации и тесты |
| scripts | Браузерные сценарии для полного приложения |
| src/*.test.js | Тесты чистых функций и локального хранилища |
| vite.config.js | Сборка, базовый путь, assets и proxy API для разработки |
| package.json, package-lock.json | Команды, зависимости и их зафиксированные версии |
| tsconfig.json | Параметры проверки типов |

## Ключевые функции при чтении

В `App.jsx` начните с `Root`, затем `App`, `reload`, `openRecord`, `PetForm`, `RecordForm`. Для внешнего API откройте `api` в `data.js`. Для Pages последовательно прочитайте `createPortfolioStore`, `request`, `publicRequest` и `write` в `portfolio/store.js`. В QR-сценарии `tagRequest` выбирает источник данных, `FinderReport` подготавливает форму и только после предпросмотра сохраняет её. `TagSettings` генерирует QR по URL, но сама картинка не хранит историю питомца — только ссылку.

## Запуск и ограничения

`npm ci`; `npm run dev -- --mode portfolio` — самостоятельное демо. `npm run build:portfolio` — статическая сборка. Обычный `npm run dev` ожидает Python API на 8000; `npm run build` собирает серверный интерфейс. `npm test` и `npm run check` — проверки. Для подпапки хостинга задаётся VITE_BASE.

Локальные QR-отчёты не передаются владельцу на другое устройство. Это объясняется на карточке и в основном README. Компоненты полного приложения сохранены для самостоятельного развёртывания; они не означают, что Pages запускает backend.
