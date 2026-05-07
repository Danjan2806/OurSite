# lilluucore — Визуальный конструктор сайтов

Визуальный конструктор сайтов (аналог Tilda / Webflow) с динамическим созданием БД под каждого клиента.

## Стек

- **Backend**: Java 17, Spring Boot 3, Spring Security (JWT), Spring Data JPA, WebSocket, Kafka, Redis
- **Frontend**: Next.js 14, TypeScript, Material UI, TanStack Query, Framer Motion, dnd-kit
- **DB**: PostgreSQL (основная + динамические tenant-БД)
- **Инфраструктура**: Docker Compose, Kubernetes

## Быстрый старт

```bash
git clone <repo>
cd saas-builder
docker-compose up --build
```

Откройте http://localhost:3000

## Сервисы (после docker-compose up)

| Сервис    | Адрес                  |
|-----------|------------------------|
| Frontend  | http://localhost:3000  |
| Backend   | http://localhost:8080  |
| PostgreSQL| localhost:5432         |
| Redis     | localhost:6379         |
| Kafka     | localhost:9092         |

## API эндпоинты

### Auth
- `POST /api/auth/register` — регистрация
- `POST /api/auth/login` — логин, возвращает JWT

### Tenants
- `POST /api/tenants` — создать клиента + его БД
- `GET /api/tenants/{id}` — получить клиента

### Sites
- `GET /api/sites` — список сайтов текущего пользователя
- `POST /api/sites` — создать новый сайт
- `GET /api/sites/{id}` — получить сайт
- `PUT /api/sites/{id}` — обновить
- `DELETE /api/sites/{id}` — удалить
- `POST /api/sites/{id}/publish` — опубликовать

### Blocks
- `GET /api/sites/{siteId}/blocks` — блоки сайта
- `POST /api/sites/{siteId}/blocks` — добавить блок
- `PUT /api/blocks/{id}` — обновить блок
- `DELETE /api/blocks/{id}` — удалить блок
- `PUT /api/sites/{siteId}/blocks/reorder` — изменить порядок

## Типы бизнеса

- `LANDING` — лендинг (SEO-блоки, форма захвата)
- `ECOMMERCE` — интернет-магазин (каталог, корзина, платежи)
- `MUSIC_LABEL` — музыкальный лейбл (плеер, кабинет артиста, релизы)
- `FITNESS` — фитнес-клуб (расписание, запись, абонементы)

## WebSocket

Подключение: `ws://localhost:8080/ws`

Топик: `/topic/site/{siteId}` — получать live-обновления канваса

## Kubernetes

```bash
kubectl apply -f k8s/
```

## Структура проекта

```
saas-builder/
├── backend/          # Spring Boot приложение
├── frontend/         # Next.js 14 приложение
├── k8s/              # Kubernetes манифесты
├── docker-compose.yml
└── README.md
```
