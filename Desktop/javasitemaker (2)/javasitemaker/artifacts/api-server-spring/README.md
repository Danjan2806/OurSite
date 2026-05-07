# lilluucore API — Spring Boot

Альтернативный бэкенд для платформы **lilluucore** (drag-and-drop SaaS website builder).  
Написан на **Spring Boot 3.2.5 / Java 21**, работает с той же PostgreSQL БД, что и Node.js-сервер.

---

## Структура проекта

```
src/main/java/com/lilluucore/
├── LilluucoreApplication.java      — точка входа
├── config/
│   ├── CorsConfig.java             — CORS
│   ├── SecurityConfig.java         — Spring Security + JWT
│   └── GlobalExceptionHandler.java — централизованная обработка ошибок
├── security/
│   ├── JwtUtil.java                — генерация / валидация JWT
│   └── JwtAuthFilter.java          — фильтр аутентификации
├── entity/                         — JPA-сущности (8 таблиц)
├── repository/                     — Spring Data JPA репозитории
├── dto/                            — Request/Response объекты
├── service/                        — Бизнес-логика
│   ├── AuthService.java
│   ├── SiteService.java
│   ├── AdminService.java
│   ├── ChatService.java
│   ├── NotificationService.java
│   └── BillingService.java
└── controller/                     — REST-контроллеры
    ├── AuthController.java
    ├── SiteController.java
    ├── AdminController.java
    ├── ChatController.java
    ├── NotificationController.java
    ├── BillingController.java
    └── HealthController.java
```

---

## Переменные окружения

| Переменная       | Описание                                 |
|------------------|------------------------------------------|
| `DATABASE_URL`   | PostgreSQL connection string             |
| `SESSION_SECRET` | JWT-секрет (тот же, что у Node.js сервера)|
| `PORT`           | Порт (по умолчанию 8090)                 |

---

## Запуск

```bash
# В корне artifacts/api-server-spring/
mvn spring-boot:run

# Или собрать jar:
mvn package -DskipTests
java -jar target/api-server-spring-1.0.0.jar
```

---

## API — эндпоинты

### Auth  (`/api/auth/...`)
| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/auth/register` | Регистрация |
| POST | `/auth/login` | Вход |
| GET | `/auth/me` | Текущий пользователь |
| GET/PUT | `/auth/settings` | Настройки |
| PUT | `/auth/profile` | Имя / фамилия |
| PUT | `/auth/email` | Смена email |
| PUT | `/auth/password` | Смена пароля |
| PUT | `/auth/avatar` | Загрузка аватара |
| POST | `/auth/2fa/send` | Отправить 2FA код |
| POST | `/auth/2fa/verify` | Проверить 2FA код |

### Sites  (`/api/sites/...`)
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/sites` | Мои сайты |
| POST | `/sites` | Создать сайт |
| GET | `/sites/:id` | Один сайт |
| DELETE | `/sites/:id` | Удалить |
| POST | `/sites/:id/publish` | Опубликовать |
| PUT | `/sites/:id/styles` | Глобальные стили |
| GET/POST | `/sites/:id/pages` | Страницы |
| PUT/DELETE | `/sites/:id/pages/:pageId` | Изменить страницу |
| POST | `/sites/:id/blocks` | Добавить блок |
| PUT/DELETE | `/sites/:id/blocks/:blockId` | Изменить/удалить блок |
| PUT | `/sites/:id/blocks/reorder` | Сортировка блоков |
| POST | `/sites/:id/form-submit` | Форма-заявка (публичный) |
| GET | `/sites/:id/form-submissions` | Заявки |
| GET | `/sites/:id/stats` | Статистика |
| GET | `/public/sites/:id` | Публичный просмотр |

### Admin  (`/api/admin/...`)
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/admin/stats` | Общая статистика |
| GET | `/admin/users` | Все пользователи |
| PUT | `/admin/users/:id` | Изменить план/роль |
| DELETE | `/admin/users/:id` | Удалить |
| GET | `/admin/sites` | Все сайты |
| DELETE | `/admin/sites/:id` | Удалить сайт |
| PUT | `/admin/sites/:id/freeze` | Заморозить/разморозить |
| PUT | `/admin/users/:id/db-lock` | Блокировка DB дампа |
| PUT | `/admin/db-lock-all` | Блокировка для всех |
| GET | `/admin/system` | Системная информация |
| POST | `/admin/notifications` | Уведомление пользователю |
| POST | `/admin/notifications/broadcast` | Рассылка |
| GET | `/admin/chat/conversations` | Диалоги поддержки |

### Chat  (`/api/chat/...`)
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/chat/support-thread` | Диалог с поддержкой |
| POST | `/chat/to-support` | Написать в поддержку |
| GET | `/chat/:userId` | Диалог с пользователем |
| POST | `/chat/:userId` | Отправить сообщение |

### Notifications + Billing + Health
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/notifications` | Мои уведомления |
| PUT | `/notifications/read-all` | Пометить всё прочитанным |
| PUT | `/notifications/:id/read` | Одно уведомление |
| POST | `/billing/subscribe` | Подписка / оплата |
| POST | `/billing/cancel` | Отмена подписки |
| GET | `/health` | Healthcheck |

---

## Совместимость с Node.js API

Spring Boot-сервер **полностью совместим** с Node.js-сервером:
- одинаковые JWT-токены (тот же `SESSION_SECRET`, claim `userId`)
- одинаковые пути (`/api/...`)
- одинаковая PostgreSQL-схема
- одинаковые JSON-форматы ответов

Можно переключить фронтенд с одного бэкенда на другой, просто изменив порт в `VITE_API_URL`.
