# Публикация

## GitHub Pages

В Settings → Pages выбрать Source: GitHub Actions. Workflow `.github/workflows/pages.yml` запускается при push в `main`: устанавливает зависимости, выполняет тесты и проверку TypeScript, собирает `build:portfolio`, публикует `frontend/dist`.

`VITE_BASE` равен `/<имя-репозитория>/`. Пути рисунков, шрифтов, QR-ссылок и отдельного окна учитывают этот префикс. Публичные карточки открываются через `?tag=...`, поэтому не требуют серверного роутинга. Секреты для Pages не нужны.

## Собственный backend

Собрать обычный `npm --prefix frontend run build`, затем запустить `python backend/server.py`. Конфигурация — `backend/.env.example`. База создаётся в `backend/data`, другое расположение задаётся `PETCARE_DATA`. Для интернета необходим HTTPS reverse proxy и `PETCARE_SECURE_COOKIES=1`. Шаблоны Compose/Caddy находятся в `deploy`; домен и env нужно задать самостоятельно. Делайте согласованные SQLite backup и проверяйте восстановление; не удаляйте volume с базой.

GitHub Pages не обеспечивает хостинг API или бота. Не добавляйте токен Telegram или ключ модели в `VITE_*`: эти значения попадают в JS посетителя.
