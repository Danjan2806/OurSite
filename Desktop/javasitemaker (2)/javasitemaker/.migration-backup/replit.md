# lilluucore — Визуальный конструктор сайтов

## Описание
Конструктор сайтов в стиле Tilda/Webflow. Drag & drop редактор, 20+ типов блоков, подробная аналитика, PostgreSQL для хранения данных, домены `*.lilluucore.com`. Система модерации, уведомлений и ролей (user/moderator/admin).

## Архитектура

### Артефакты
- **artifacts/api-server** — Express.js API, порт 8080. Работает с PostgreSQL через Drizzle ORM.
- **artifacts/saas-builder-ui** — React + Vite фронтенд. SPA с роутингом через Wouter.

### Страницы фронтенда
- `/` — Лендинг (LandingPage.tsx): hero, возможности, как работает, CTA, футер
- `/auth` — Авторизация/регистрация (AuthPage.tsx): вход + регистрация
- `/pricing` — Тарифы (PricingPage.tsx): Free / Pro $19 / Business $49, toggle месяц/год, 10 вопросов FAQ
- `/dashboard` — Дашборд (DashboardPage.tsx): 6 метрик аналитики, мультилинейный chart (Recharts), «Дамп памяти пользователя» (512 МБ, статус OK), список сайтов, модал создания
- `/profile` — Профиль (ProfilePage.tsx): фото профиля с кадрированием (react-image-crop, JPG/PNG/WebP, 5 МБ), тариф, тема, раздельные тогглы уведомлений в приложении и email, поддержка
- `/builder/:siteId` — Редактор (BuilderPage.tsx): drag-and-drop, ширина блока, публикация, кнопка «Предпросмотр» для опубликованных сайтов, модальное окно создания страниц. Undo/Redo (Ctrl+Z/Ctrl+Y, 30 шагов, кнопки в тулбаре), захват истории перед add/delete/duplicate/move/save блока
- `/preview/:siteId` — Предпросмотр (PreviewPage.tsx): полноэкранный рендер блоков, переключение desktop/tablet/mobile, навигация по страницам. Для сайтов с блоком PRODUCTS: плавающая кнопка корзины (CartButton), боковая панель корзины (CartDrawer) с управлением кол-вом товаров, модал чекаута (CheckoutModal) с формой и отправкой заказа через formSubmit API
- `/admin` — Админ-панель (AdminPage.tsx): обзор, пользователи, сайты, уведомления, чат, система. Модераторы видят: сайты, чат с пользователями, уведомления. Вкладка «Чат» — полноценный двусторонний мессенджер для общения с пользователями.
- `/docs` — Документация (DocsPage.tsx): быстрый старт, редактор, домены, аналитика, безопасность и модерация, тарифы
- `/privacy` — Политика конфиденциальности (PrivacyPage.tsx): 11 разделов включая модерацию и госзапросы

### Иконки
Все пользовательские страницы используют Font Awesome через `@/lib/icons` (НЕ lucide-react). Файл `icons.tsx` экспортирует React-компоненты с props `size` и `className`. Shadcn/ui компоненты оставлены без изменений.

### База данных (PostgreSQL + Drizzle)
Таблицы в `lib/db/src/schema/index.ts`:
- `users` — пользователи (id, email, password_hash, first_name, last_name, plan, role: user/moderator/admin, avatar_url)
- `user_settings` — настройки (theme, notifications, emailNotifications)
- `sites` — сайты (name, subdomain `.lilluucore.com`, business_type, status, global_styles, frozen, frozenReason, frozenBy, frozenAt)
- `pages` — страницы сайтов (name, slug, site_id)
- `blocks` — блоки (type, position, content JSON, styles JSON, visible, width, page_id, row_id)
- `site_analytics` — аналитика
- `notifications` — уведомления (user_id, title, message, type, read)
- `chat_messages` — сообщения чата модерации (fromUserId, toUserId, message, read)

### API эндпоинты (artifacts/api-server/src/routes/)
**auth.ts:** POST /auth/register, POST /auth/login, GET /auth/me, GET /auth/settings, PUT /auth/settings, PUT /auth/avatar
**sites.ts:** GET /sites, POST /sites, GET /sites/:id, DELETE /sites/:id, POST /sites/:id/blocks, PUT /sites/:id/blocks/:id, DELETE /sites/:id/blocks/:id, PUT /sites/:id/blocks/reorder, POST /sites/:id/publish, PUT /sites/:id/styles, GET /sites/:id/stats, GET /sites/stats/all, GET /sites/:id/pages, POST /sites/:id/pages, PUT /sites/:id/pages/:pageId, DELETE /sites/:id/pages/:pageId, GET /public/sites/:id (публичный)
**admin.ts:** GET /admin/stats, GET /admin/users, PUT /admin/users/:id, DELETE /admin/users/:id, GET /admin/sites, DELETE /admin/sites/:id, PUT /admin/sites/:id/freeze, GET /admin/system, POST /admin/notifications (отправка одному), POST /admin/notifications/broadcast (всем), GET /admin/chat/conversations
**notifications:** GET /notifications, PUT /notifications/:id/read
**chat:** GET /chat/:userId (сообщения), POST /chat/:userId (отправить), GET /chat/unread-count

### Блоки (23+ типов)
HERO, FEATURES, STATS, PRICING, TESTIMONIALS, TEAM, FAQ, GALLERY, VIDEO, TEXT, CONTACTS, PRODUCTS, CTA, FOOTER, MUSIC_PLAYER, DISCOGRAPHY, SCHEDULE, COACHES, FORM, BLOG, HEADER_MENU, MAP, ZERO_BLOCK, POPUP

**POPUP блок** — всплывающее окно, вызываемое по триггеру. Варианты: centered, image-left, fullscreen, bottom-sheet. В канвасе отображается как карточка-заглушка с ID и признаком "скрыт". В настройках 3 вкладки: content (заголовок, Rich Text тело, изображение с позицией, размер, анимация), form (конструктор полей с типами text/email/tel/number/textarea/select/checkbox/radio), trigger (ID попапа, закрытие, автозакрытие, фон оверлея). Кнопки HERO/CTA поддерживают действие "Открыть попап" (выбор из списка POPUP-блоков на странице). В PreviewPage: POPUP блоки исключены из основного потока и рендерятся через PopupRenderer как fixed-оверлеи с backdrop, анимацией и Escape-закрытием.

### Глобальная система дизайна
В настройках сайта (кнопка SEO в тулбаре) → вкладка «Дизайн»:
- **Акцентный цвет** — color picker + 8 пресетов. Применяется через `--site-primary` CSS var, автоматически перекрашивает все кнопки, ссылки, бейджи в PreviewPage.
- **Фон сайта** — color picker + 8 тёмных/светлых пресетов. Устанавливает фон контейнера блоков.
- **Шрифт сайта** — выбор из 6 вариантов (Inter, Roboto, Montserrat, Playfair Display, Oswald, System UI). Google Fonts загружаются динамически в PreviewPage.
- **Превью** — мини-превью прямо в модале показывает результат применения токенов.
- Все токены сохраняются в `site.globalStyles` JSON и читаются в PreviewPage через CSS Custom Properties (`:root { --site-primary; --site-bg; --site-font }`).

### Стили блоков
- `borderRadius` — скругление углов (0-32px)
- `opacity` — прозрачность (20-100%)
- `minHeight` — минимальная высота (auto, 300px, 500px, 100vh)
- `animation` — анимация при появлении (fade-up/down/left/right, zoom-in) через IntersectionObserver
- `anchorId` — якорь для навигации внутри страницы
- `ctaColor` — цвет CTA-кнопки (HERO, CTA, HEADER_MENU, FORM)
- `hideCta` — скрыть CTA-кнопку (HEADER_MENU)

### Безопасность блоков
- ZERO_BLOCK HTML рендерится в sandboxed iframe (без allow-scripts) для защиты от XSS
- MAP block использует iframe embed с ограничением по URL

### Админ-панель — DB Dump Lock
- PUT /admin/users/:id/db-lock — блокировка/разблокировка дампа для пользователя
- PUT /admin/db-lock-all — массовая блокировка/разблокировка
- Поля: `dbAccessLocked` (boolean), `dbLockReason` (text) в user_settings
- ProfilePage показывает amber-предупреждение при блокировке

### Типы бизнеса
LANDING, ECOMMERCE, MUSIC_LABEL, FITNESS — каждый со своим уникальным шаблоном

### Система ролей
- **user** — обычный пользователь
- **moderator** — доступ к админ-панели (вкладки: сайты, уведомления), отправка уведомлений
- **admin** — полный доступ (обзор, пользователи, сайты, уведомления, система)

### Система уведомлений
- Колокольчик в шапке с badge непрочитанных
- Типы: info, warning, moderation, success, error
- Отправка через админ-панель: одному пользователю или всем (broadcast)
- Шаблоны быстрой отправки модераторских уведомлений

## Загрузка изображений (Object Storage)
- Используется Replit App Storage (Google Cloud Storage) — бакет `replit-objstore-302f9140-94be-4100-8576-9b783a7f7367`
- Эндпоинты: `POST /api/storage/uploads/request-url` (presigned URL), `GET /api/storage/objects/*`
- Файлы: `artifacts/api-server/src/lib/objectStorage.ts`, `objectAcl.ts`, `routes/storage.ts`
- В BuilderPage: хелпер `IF()` — поле URL + кнопка загрузки файла. Поддержка в `Items()` через тип `"image"`.
- Все поля изображений (bgImage, аватары, обложки, фото товаров, галерея, статьи) поддерживают прямую загрузку.
- `uploadImage(file)` в `api.ts` — двухэтапный upload: presigned URL → PUT в GCS → URL для хранения.

## Технологии
- **Frontend:** React 18, Vite, TypeScript, Wouter, TanStack Query, Framer Motion, @dnd-kit, Recharts, Zustand, Tailwind CSS, Font Awesome
- **Backend (Replit):** Node.js, Express, Drizzle ORM, PostgreSQL, bcryptjs, jsonwebtoken, zod, @google-cloud/storage
- **Backend (Docker/локальный):** Java 21, Spring Boot 3.2, Spring Data JPA, Spring Security, jjwt, BCrypt, PostgreSQL
- **БД:** Replit PostgreSQL (переменная DATABASE_URL) / PostgreSQL 16 в Docker
- **Хранилище:** Replit App Storage / GCS (в Replit) / локальный файловый том (в Docker)

## Java Spring Boot Backend (Docker-деплой)

Полная замена Node.js/Express бэкенда для локального запуска через Docker Compose.

### Расположение файлов
- `backend-java/` — Spring Boot проект (Maven, Java 21)
  - `src/main/java/com/lilluucore/entity/` — JPA-сущности (8 таблиц)
  - `src/main/java/com/lilluucore/repository/` — Spring Data JPA репозитории
  - `src/main/java/com/lilluucore/controller/` — REST-контроллеры (Auth, Site, Admin, Billing, Notification, Chat, Storage, Health)
  - `src/main/java/com/lilluucore/service/` — сервисы (JWT, 2FA, шаблоны блоков, JSON)
  - `src/main/java/com/lilluucore/config/` — SecurityConfig, JwtAuthFilter
- `Dockerfile.backend` — сборка Java бэкенда (multi-stage: Maven build → JRE образ)
- `Dockerfile.frontend` — сборка React (pnpm build → nginx)
- `docker-compose.yml` — postgres + backend + frontend
- `docker/nginx.conf` — nginx конфигурация для SPA
- `DOCKER_README.md` — инструкция по локальному запуску
- `.env.example` — шаблон переменных окружения

### Запуск локально
```bash
docker compose up --build
# Фронтенд: http://localhost
# Бэкенд:   http://localhost:8080/api/health
```

### Особенности Java бэкенда
- JWT (jjwt) с тем же алгоритмом (HS256), что и Node.js версия — токены совместимы
- BCrypt (strength=10) — хэши паролей совместимы с существующей БД
- `spring.jpa.hibernate.ddl-auto=update` — автоматически создаёт/обновляет таблицы при старте
- Хранение файлов: локальный Docker volume `/app/uploads` вместо GCS
- Шаблоны блоков LANDING/ECOMMERCE/MUSIC_LABEL/FITNESS полностью перенесены в `SiteTemplateService.java`
- 2FA коды хранятся in-memory (ConcurrentHashMap) с TTL 5 минут

## Дизайн
- Тёмная тема: `bg-background` (#070711)
- Акцент: `#7C3AED` (purple-600)
- Glassmorphism: класс `.glass`
- Кнопки: класс `.gradient-purple`
- CSS: user-dropdown-menu, notif-badge, tooltip

## Домены
Субдомен сайта: `[name].lilluucore.com` (например `my-shop.lilluucore.com`)

## Контакты
- Email: support@lilluucore.com
- Телефон: +7 952 777-14-88
- Admin: lilluucore@gmail.com
