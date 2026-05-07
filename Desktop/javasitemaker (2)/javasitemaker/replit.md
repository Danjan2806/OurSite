# Workspace — lilluucore

## Overview

**lilluucore** is a Russian-language drag-and-drop SaaS website builder. Users can register, create sites with business-type templates (landing, e-commerce, music label, fitness), add/reorder blocks visually, publish their sites, and manage their profile/billing.

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite, Tailwind CSS v4, wouter (routing), Zustand (auth state), @dnd-kit (drag-and-drop), @phosphor-icons, @fortawesome
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: JWT (jsonwebtoken + bcryptjs), stored in localStorage as `sb_token`
- **AI**: OpenAI GPT-4o (screenshot-to-site)
- **Object Storage**: Google Cloud Storage via Replit sidecar
- **Build**: esbuild (API), Vite (frontend)

## Artifacts

| Artifact | Path | Port | Notes |
|---|---|---|---|
| `saas-builder-ui` | `artifacts/saas-builder-ui/` | 19628 | React+Vite frontend, previewPath `/` |
| `api-server` | `artifacts/api-server/` | 8080 | Express API, previewPath `/api` |
| `api-server-spring` | `artifacts/api-server-spring/` | 8090 | Spring Boot 3 / Java 21 — отдельный бэкенд (не запускается в Replit, требует Java) |

## Spring Boot Backend (`artifacts/api-server-spring/`)

Полноценный альтернативный бэкенд на **Spring Boot 3.2.5 / Java 21** — отдельные файлы, не затрагивает Node.js сервер. Использует ту же PostgreSQL БД и те же JWT-токены (совместим с фронтендом).

### Структура (44 Java-файла)
- `entity/` — 8 JPA-сущностей (User, Site, Page, Block, Notification, ChatMessage, FormSubmission, UserSettings)
- `repository/` — 8 Spring Data JPA репозиториев с кастомными запросами
- `service/` — 6 сервисов (Auth, Site, Admin, Chat, Notification, Billing)
- `controller/` — 7 REST-контроллеров (все те же эндпоинты `/api/...`)
- `security/` — JwtUtil + JwtAuthFilter
- `config/` — SecurityConfig, CorsConfig, GlobalExceptionHandler

### Сборка и запуск (требует Java 21 + Maven)
```bash
cd artifacts/api-server-spring
mvn spring-boot:run
# или: mvn package && java -jar target/api-server-spring-1.0.0.jar
```

### Переменные окружения
`DATABASE_URL`, `SESSION_SECRET` (те же что у Node.js), `PORT` (по умолчанию 8090)

## Key Commands

- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm install` — install all workspace dependencies

## API Routes (base `/api`)

- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- `GET /auth/settings`, `PUT /auth/settings`, `PUT /auth/avatar`, `PUT /auth/profile`
- `GET/PUT /auth/seo-settings`, `PUT /auth/email`, `PUT /auth/password`
- `POST /auth/2fa/send`, `POST /auth/2fa/verify`, `POST /auth/support`
- `GET/POST /sites`, `GET/PUT/DELETE /sites/:id`, `POST /sites/:id/publish`
- `GET/POST/PUT/DELETE /sites/:id/pages/:pageId`
- `POST/PUT/DELETE /sites/:id/blocks/:blockId`, `PUT /sites/:id/blocks/reorder`
- `GET /sites/:id/stats`, `GET /sites/stats/all`
- `POST /sites/:id/form-submit`, `GET /sites/:id/form-submissions`
- `GET /public/sites/:id` — public preview (published sites only)
- `GET/PUT /notifications`, `PUT /notifications/read-all`, `PUT /notifications/:id/read`
- `GET /chat/unread-count`, `GET /chat/support-thread`, `POST /chat/to-support`
- `GET/POST /chat/:userId` — staff ↔ user chat
- `GET/PUT/DELETE /admin/*` — admin panel (role=admin/moderator required)
- `POST /billing/subscribe`, `POST /billing/cancel`
- `POST /ai/screenshot-to-site` — OpenAI GPT-4o vision (upload base64 PNG)
- `POST /ai/website-to-site` — local Playwright/Chromium screenshots any URL, then GPT-4o analysis
- `POST /storage/uploads/request-url`, `GET /storage/objects/*`, `GET /storage/public-objects/*`

## DB Schema (lib/db/src/schema/index.ts)

Tables: `users`, `user_settings`, `sites`, `pages`, `blocks`, `form_submissions`, `site_analytics`, `notifications`, `chat_messages`

## Frontend Pages (artifacts/saas-builder-ui/src/pages/)

- `LandingPage` — marketing homepage
- `AuthPage` — login/register
- `DashboardPage` — user's sites list
- `BuilderPage` — drag-and-drop site editor
- `PricingPage` — pricing plans
- `ProfilePage` — profile, settings, billing, notifications, chat
- `AdminPage` — admin panel (role-gated)
- `PreviewPage` — live preview of a published site
- `DocsPage`, `PrivacyPage`, `not-found`

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
