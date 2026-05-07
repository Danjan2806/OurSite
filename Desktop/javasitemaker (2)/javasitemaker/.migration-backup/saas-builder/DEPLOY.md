# Руководство по развёртыванию lilluucore

---

## Содержание

1. [Требования](#1-требования)
2. [Быстрый старт — локально через Docker Compose](#2-быстрый-старт--локально-через-docker-compose)
3. [Развёртывание на сервере (VPS/выделенный)](#3-развёртывание-на-сервере-vpsвыделенный)
4. [Развёртывание в Kubernetes](#4-развёртывание-в-kubernetes)
5. [Переменные окружения — полный справочник](#5-переменные-окружения--полный-справочник)
6. [Проверка работоспособности](#6-проверка-работоспособности)
7. [Частые ошибки и их решения](#7-частые-ошибки-и-их-решения)

---

## 1. Требования

### Для Docker Compose (локально или VPS)

| Компонент | Минимум | Рекомендуется |
|-----------|---------|---------------|
| CPU | 2 ядра | 4 ядра |
| RAM | 4 ГБ | 8 ГБ |
| Диск | 20 ГБ | 50 ГБ |
| ОС | Ubuntu 20.04+ / Debian 11+ / любой Linux | Ubuntu 22.04 LTS |
| Docker | 24.0+ | последняя |
| Docker Compose | v2.20+ | последняя |

### Для Kubernetes

- Kubernetes 1.28+
- kubectl настроен и подключён к кластеру
- Nginx Ingress Controller установлен
- cert-manager установлен (для HTTPS)
- StorageClass с `ReadWriteOnce` и `ReadWriteMany` поддержкой

---

## 2. Быстрый старт — локально через Docker Compose

### Шаг 1: Установка Docker

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Проверка
docker --version
docker compose version
```

### Шаг 2: Распаковка проекта

```bash
tar -xzf saas-builder.tar.gz
cd saas-builder
```

### Шаг 3: Запуск

```bash
docker compose up --build
```

Первый запуск займёт **5–10 минут** — скачиваются образы и собираются контейнеры.

Дождитесь строк в логах:
```
saas-backend   | Started SaasBuilderApplication in X.XXX seconds
saas-frontend  | ▲ Next.js ready
```

### Шаг 4: Открыть в браузере

| Сервис | URL |
|--------|-----|
| Фронтенд (UI) | http://localhost:3000 |
| Backend API | http://localhost:8080/api |
| Swagger / Health | http://localhost:8080/api/actuator/health |

### Дополнительно: Kafka UI (для отладки очередей)

```bash
docker compose --profile dev up --build
# Kafka UI → http://localhost:8090
```

### Остановка

```bash
docker compose down          # остановить контейнеры
docker compose down -v       # остановить + удалить тома с данными (ВНИМАНИЕ: удалит БД!)
```

---

## 3. Развёртывание на сервере (VPS/выделенный)

### Шаг 1: Подготовка сервера

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Установка дополнительных утилит
sudo apt install -y git curl nano ufw
```

### Шаг 2: Настройка файрвола

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3000/tcp  # Frontend (если без Nginx)
sudo ufw allow 8080/tcp  # Backend API (если без Nginx)
sudo ufw enable
```

### Шаг 3: Загрузка проекта на сервер

Вариант А — через SCP со своего компьютера:
```bash
scp saas-builder.tar.gz user@YOUR_SERVER_IP:/home/user/
ssh user@YOUR_SERVER_IP
tar -xzf saas-builder.tar.gz
cd saas-builder
```

Вариант Б — напрямую на сервере через git (если выложили в репозиторий):
```bash
git clone https://github.com/your/repo.git saas-builder
cd saas-builder
```

### Шаг 4: Настройка переменных для продакшена

Создайте файл `.env` в папке `saas-builder/`:

```bash
nano .env
```

Вставьте содержимое (замените значения на свои):

```env
# База данных
POSTGRES_USER=saas_admin
POSTGRES_PASSWORD=SuperSecretPassword123!
POSTGRES_DB=saas_main

# JWT (минимум 32 символа, случайный набор)
JWT_SECRET=a9f3d2e1b7c8m4k6p0q5r8s2t1u7v3w9x4y6z2abc123def456ghi789

# URL вашего сервера (замените на реальный IP или домен)
SERVER_HOST=http://YOUR_SERVER_IP_OR_DOMAIN
```

### Шаг 5: Обновление docker-compose.yml для продакшена

Откройте `docker-compose.yml` и замените секции `postgres`, `backend` и `frontend`:

```bash
nano docker-compose.yml
```

Найдите раздел `postgres` и замените захардкоженные пароли на переменные из `.env`:

```yaml
  postgres:
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
```

В разделе `backend`:
```yaml
  backend:
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/${POSTGRES_DB}
      SPRING_DATASOURCE_USERNAME: ${POSTGRES_USER}
      SPRING_DATASOURCE_PASSWORD: ${POSTGRES_PASSWORD}
      SPRING_DATASOURCE_ADMIN_URL: jdbc:postgresql://postgres:5432/postgres
      SPRING_DATASOURCE_ADMIN_USERNAME: ${POSTGRES_USER}
      SPRING_DATASOURCE_ADMIN_PASSWORD: ${POSTGRES_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
```

В разделе `frontend` → `build.args`:
```yaml
  frontend:
    build:
      args:
        NEXT_PUBLIC_API_URL: ${SERVER_HOST}:8080
        NEXT_PUBLIC_WS_URL: ws://${SERVER_HOST}:8080/ws
```

### Шаг 6: Запуск

```bash
docker compose --env-file .env up --build -d
```

Флаг `-d` запускает в фоновом режиме.

### Шаг 7: Проверка логов

```bash
# Все сервисы
docker compose logs -f

# Только бэкенд
docker compose logs -f backend

# Только фронтенд
docker compose logs -f frontend
```

### Шаг 8: Настройка Nginx как reverse proxy (рекомендуется)

Это позволит работать на стандартных портах 80/443 и добавить SSL.

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Создайте конфиг:
```bash
sudo nano /etc/nginx/sites-available/lilluucore
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # WebSocket
    location /api/ws {
        proxy_pass http://localhost:8080/api/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 3600s;
    }
}
```

```bash
# Активируем конфиг
sudo ln -s /etc/nginx/sites-available/lilluucore /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Получаем SSL сертификат (замените на ваш домен)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

После этого обновите `NEXT_PUBLIC_API_URL` в `.env` на `https://your-domain.com` и пересоберите:
```bash
docker compose up --build -d frontend
```

### Шаг 9: Автозапуск при перезагрузке сервера

```bash
# Docker уже автозапускается через systemd.
# Убедитесь, что сервис включён:
sudo systemctl enable docker

# Добавьте restart: unless-stopped в docker-compose.yml (уже добавлено)
# Тогда контейнеры перезапустятся автоматически при старте Docker.
```

---

## 4. Развёртывание в Kubernetes

### Шаг 1: Подготовка манифестов

```bash
cd saas-builder/k8s/
```

### Шаг 2: Создание секретов

Отредактируйте файл `service.yaml` — найдите раздел `Secret` в конце файла и замените значения:

```yaml
stringData:
  db-url: "jdbc:postgresql://postgres-service:5432/saas_main"
  db-username: "saas_admin"
  db-password: "ВАШ_БЕЗОПАСНЫЙ_ПАРОЛЬ"
  db-admin-url: "jdbc:postgresql://postgres-service:5432/postgres"
  db-admin-username: "saas_admin"
  db-admin-password: "ВАШ_БЕЗОПАСНЫЙ_ПАРОЛЬ"
  jwt-secret: "ваш-длинный-jwt-секрет-минимум-32-символа"
```

Или создайте секрет через kubectl:
```bash
kubectl create namespace saas

kubectl create secret generic saas-secrets \
  --namespace=saas \
  --from-literal=db-url='jdbc:postgresql://postgres-service:5432/saas_main' \
  --from-literal=db-username='saas_admin' \
  --from-literal=db-password='SuperSecretPassword123!' \
  --from-literal=db-admin-url='jdbc:postgresql://postgres-service:5432/postgres' \
  --from-literal=db-admin-username='saas_admin' \
  --from-literal=db-admin-password='SuperSecretPassword123!' \
  --from-literal=jwt-secret='your-very-long-jwt-secret-32-plus-chars'
```

### Шаг 3: Сборка и публикация Docker-образов

```bash
# Собрать образы
docker build -t your-registry/saas-backend:latest ./backend
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.your-domain.com \
  --build-arg NEXT_PUBLIC_WS_URL=wss://api.your-domain.com/ws \
  -t your-registry/saas-frontend:latest ./frontend

# Опубликовать в registry (Docker Hub, GitHub Container Registry, и т.д.)
docker push your-registry/saas-backend:latest
docker push your-registry/saas-frontend:latest
```

Замените `your-registry` на ваш Docker Hub логин или адрес приватного registry.

### Шаг 4: Обновите deployment.yaml

В файле `k8s/deployment.yaml` замените `image:` в обоих деплойментах:

```yaml
# Для backend:
image: your-registry/saas-backend:latest

# Для frontend:
image: your-registry/saas-frontend:latest
```

### Шаг 5: Обновите ingress.yaml

В файле `k8s/ingress.yaml` замените хосты:

```yaml
spec:
  tls:
    - hosts:
        - your-domain.com
        - api.your-domain.com
  rules:
    - host: api.your-domain.com
      ...
    - host: your-domain.com
      ...
```

### Шаг 6: Применение манифестов

```bash
# Создать namespace и секреты
kubectl apply -f k8s/service.yaml

# Задеплоить все компоненты
kubectl apply -f k8s/deployment.yaml

# Настроить Ingress и автомасштабирование
kubectl apply -f k8s/ingress.yaml
```

### Шаг 7: Проверка

```bash
# Статус подов
kubectl -n saas get pods

# Логи бэкенда
kubectl -n saas logs -f deployment/lilluucore-backend

# Логи фронтенда
kubectl -n saas logs -f deployment/lilluucore-frontend

# Статус Ingress
kubectl -n saas get ingress
```

Дождитесь, пока все поды в статусе `Running`:
```
NAME                                      READY   STATUS    RESTARTS
lilluucore-backend-xxxx-xxxx              1/1     Running   0
lilluucore-frontend-xxxx-xxxx             1/1     Running   0
postgres-xxxx-xxxx                        1/1     Running   0
redis-xxxx-xxxx                           1/1     Running   0
```

---

## 5. Переменные окружения — полный справочник

### Backend (Spring Boot)

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/saas_main` | URL основной БД |
| `SPRING_DATASOURCE_USERNAME` | `saas_admin` | Пользователь основной БД |
| `SPRING_DATASOURCE_PASSWORD` | — | Пароль основной БД |
| `SPRING_DATASOURCE_ADMIN_URL` | `jdbc:postgresql://localhost:5432/postgres` | URL admin БД (для создания tenant-БД) |
| `SPRING_DATASOURCE_ADMIN_USERNAME` | — | Суперпользователь PostgreSQL |
| `SPRING_DATASOURCE_ADMIN_PASSWORD` | — | Пароль суперпользователя |
| `SPRING_REDIS_HOST` | `localhost` | Хост Redis |
| `SPRING_REDIS_PORT` | `6379` | Порт Redis |
| `SPRING_KAFKA_BOOTSTRAP_SERVERS` | `localhost:9092` | Kafka адрес |
| `JWT_SECRET` | — | Секрет для подписи JWT токенов (мин. 32 символа) |
| `JWT_EXPIRATION` | `86400000` | Время жизни токена в мс (24 ч) |
| `SITE_GENERATED_PATH` | `./generated` | Путь сохранения опубликованных сайтов |

### Frontend (Next.js)

⚠️ **Важно:** Переменные `NEXT_PUBLIC_*` запекаются в JS-бандл **во время сборки** (`npm run build` / `docker build`). Их нельзя изменить после сборки — нужна пересборка образа.

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | URL Backend API (доступен из браузера!) |
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:8080/ws` | URL WebSocket (доступен из браузера!) |

---

## 6. Проверка работоспособности

### Проверка через curl

```bash
# Health check бэкенда
curl http://localhost:8080/api/actuator/health

# Ожидаемый ответ:
# {"status":"UP"}

# Проверка регистрации
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword",
    "firstName": "Иван",
    "lastName": "Тестов"
  }'

# Ожидаемый ответ: JSON с token, userId, email и т.д.
```

### Проверка через браузер

1. Откройте http://localhost:3000
2. Нажмите "Зарегистрироваться"
3. Заполните форму
4. После входа попадёте на дашборд
5. Нажмите "Новый сайт", выберите тип бизнеса, введите название
6. Откроется визуальный редактор — перетащите блок из левой панели на холст
7. Нажмите "Опубликовать"

---

## 7. Частые ошибки и их решения

### ❌ `destination does not start with /` при сборке фронтенда

**Причина:** Старая версия `next.config.js` с `async rewrites()` и `process.env.NEXT_PUBLIC_API_URL` равным `undefined`.

**Решение:** Убедитесь, что `next.config.js` выглядит так:
```js
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: { domains: ['localhost', 'saas.local'] },
};
module.exports = nextConfig;
```

---

### ❌ `Type error: 'blocks' is of type 'unknown'`

**Причина:** Старая версия `app/builder/[siteId]/page.tsx` с неправильным типом `useState`.

**Решение:** Убедитесь, что в файле объявлен интерфейс:
```typescript
interface Block {
  id: string; type: string; position: number;
  content: string; styles: string; visible: boolean;
}
const [blocks, setBlocks] = useState<Block[]>([]);
```

---

### ❌ Бэкенд не запускается — `Connection refused` к PostgreSQL

**Причина:** PostgreSQL ещё не готов, когда бэкенд пытается подключиться.

**Решение:** Бэкенд настроен с `depends_on: postgres: condition: service_healthy`, но иногда нужно подождать. Перезапустите:
```bash
docker compose restart backend
```

---

### ❌ `Flyway migration error` при старте

**Причина:** База данных существует, но таблицы созданы вручную без Flyway.

**Решение:**
```bash
# Удалите контейнер с данными и пересоздайте
docker compose down -v
docker compose up -d postgres
# Подождите 10 секунд
docker compose up -d backend
```

---

### ❌ Kafka Consumer не получает сообщения

**Причина:** Kafka ещё не создала топики.

**Решение:** Топики создаются автоматически при первом использовании (`KAFKA_AUTO_CREATE_TOPICS_ENABLE: 'true'`). Если проблема сохраняется:
```bash
docker compose restart backend
```

---

### ❌ Фронтенд открывается, но API недоступен (CORS или 404)

**Причина:** `NEXT_PUBLIC_API_URL` указывает на неправильный адрес.

**Решение:** При развёртывании на сервере пересоберите фронтенд с правильным URL:
```bash
docker compose build --build-arg NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP:8080 frontend
docker compose up -d frontend
```

---

### ❌ Нет места на диске при сборке

```bash
# Очистить неиспользуемые образы и кэш
docker system prune -af
docker volume prune -f
```

---

### Просмотр логов в реальном времени

```bash
# Все сервисы
docker compose logs -f

# Только бэкенд (фильтрация ошибок)
docker compose logs -f backend 2>&1 | grep -E "ERROR|WARN|Started"

# Статус всех контейнеров
docker compose ps
```

---

## Структура проекта

```
saas-builder/
├── backend/              ← Java 17 + Spring Boot 3
│   ├── src/
│   │   └── main/
│   │       ├── java/com/saas/
│   │       │   ├── config/      ← Security, Kafka, Redis, WebSocket
│   │       │   ├── controller/  ← REST API endpoints
│   │       │   ├── dto/         ← Request/Response объекты
│   │       │   ├── entity/      ← JPA сущности (User, Tenant, Site, Block)
│   │       │   ├── kafka/       ← Async provisioning consumer
│   │       │   ├── repository/  ← Spring Data JPA
│   │       │   ├── scheduler/   ← Retry failed provisioning
│   │       │   ├── security/    ← JWT фильтр
│   │       │   ├── service/     ← Бизнес-логика
│   │       │   └── websocket/   ← Live preview (STOMP)
│   │       └── resources/
│   │           ├── application.yml
│   │           ├── db/migration/     ← Flyway миграции
│   │           └── db-schemas/       ← SQL схемы по типу бизнеса
│   │               ├── landing/
│   │               ├── ecommerce/
│   │               ├── music_label/
│   │               └── fitness/
│   ├── Dockerfile
│   └── pom.xml
├── frontend/             ← Next.js 14 + TypeScript
│   ├── app/
│   │   ├── auth/         ← Login / Register страницы
│   │   ├── dashboard/    ← Список сайтов + статистика
│   │   └── builder/      ← Визуальный редактор
│   ├── components/       ← BlockPalette, Canvas, StyleEditor
│   ├── hooks/            ← TanStack Query хуки
│   ├── lib/              ← API клиент, WebSocket, Zustand store
│   ├── Dockerfile
│   └── package.json
├── k8s/                  ← Kubernetes манифесты
│   ├── deployment.yaml
│   ├── service.yaml
│   └── ingress.yaml
├── docker-compose.yml    ← Полный стек для локального запуска
└── DEPLOY.md             ← Этот файл
```
