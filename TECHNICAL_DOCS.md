# NeuroPhoto SaaS — Техническая документация

> **Дата:** 14 февраля 2026  
> **Статус:** Задеплоено, работает

---

## 1. Обзор проекта

**NeuroPhoto** — веб-приложение для генерации профессиональных фотосессий людей и товаров с помощью AI (Google Gemini). Пользователи создают виртуальную модель, загружают фото товара, и AI генерирует фото «модели» с этим товаром.

### Ключевые функции
- 🔐 Регистрация / вход по email + пароль
- 👤 Создание виртуальных моделей (описание + превью)
- 📸 Генерация фото (модель + товар + фон)
- 🎨 Генерация вариаций (до 10 поз)
- 🖼️ Галерея сгенерированных изображений
- 👥 Многопользовательский режим (каждый видит только свои данные)

---

## 2. Архитектура

```mermaid
graph TB
    subgraph "Пользователь"
        Browser["🌐 Браузер"]
    end

    subgraph "Vercel (Frontend)"
        React["React + Vite<br/>neurophoto.vercel.app"]
    end

    subgraph "Render (Backend)"
        Express["Node.js + Express<br/>neurophoto-backend.onrender.com"]
    end

    subgraph "Внешние сервисы"
        Supabase["Supabase<br/>Auth + DB + Storage"]
        Gemini["Google Gemini API<br/>Генерация изображений"]
    end

    Browser --> React
    React -->|"API запросы + JWT"| Express
    React -->|"Auth (логин/регистрация)"| Supabase
    Express -->|"Сохранение данных"| Supabase
    Express -->|"Генерация фото"| Gemini
```

---

## 3. Технологический стек

| Слой | Технология | Версия |
|---|---|---|
| **Frontend** | React | 19.2.0 |
| Сборка | Vite | 7.3.1 |
| Стили | Tailwind CSS | 4.1.18 |
| 3D Фон | Three.js | 0.182.0 |
| Анимации | Framer Motion | 12.33.0 |
| Иконки | Lucide React | 0.563.0 |
| Роутинг | React Router DOM | 7.13.0 |
| HTTP клиент | Axios | 1.13.5 |
| **Backend** | Node.js | 24.x |
| Сервер | Express | 5.2.1 |
| AI API | @google/genai | 1.40.0 |
| БД клиент | @supabase/supabase-js | 2.95.3 |
| Загрузка файлов | Multer | 2.0.2 |
| **БД и Auth** | Supabase (PostgreSQL) | hosted |
| **Хостинг Frontend** | Vercel | free tier |
| **Хостинг Backend** | Render | free tier |

---

## 4. Все учётные данные и ключи

> [!CAUTION]
> Эти данные являются конфиденциальными. Не публикуйте их в открытом доступе.

### 4.1 Supabase

| Параметр | Значение |
|---|---|
| **Проект URL** | `https://iizmjkbdufjxxteklmib.supabase.co` |
| **Anon Key (публичный)** | `sb_publishable_ecIMBKz1w2CDjrf71y2GrA_0KbcQRJd` |
| **Дашборд** | [app.supabase.com](https://app.supabase.com) (вход по GitHub или email) |

### 4.2 Google Gemini API

| Параметр | Значение |
|---|---|
| **API Key** | `AIzaSyCat9TYV7xSftqdR5v-4u3S42FPr1OQKO4` |
| **Модель** | `gemini-3-pro-image-preview` |
| **Консоль** | [aistudio.google.com](https://aistudio.google.com) |

### 4.3 GitHub

| Параметр | Значение |
|---|---|
| **Репозиторий** | `lastlysmith26-create/neurophoto` (private) |
| **URL** | [github.com/lastlysmith26-create/neurophoto](https://github.com/lastlysmith26-create/neurophoto) |
| **Ветка** | `main` |

### 4.4 Render (Backend хостинг)

| Параметр | Значение |
|---|---|
| **Сервис** | `neurophoto-backend` |
| **URL** | `https://neurophoto-backend.onrender.com` |
| **Дашборд** | [dashboard.render.com](https://dashboard.render.com) (вход через GitHub `lastlysmith26-create`) |
| **Тариф** | Free (засыпает через ~15 мин неактивности) |

### 4.5 Vercel (Frontend хостинг)

| Параметр | Значение |
|---|---|
| **Проект** | `neurophoto` |
| **URL** | `https://neurophoto.vercel.app` |
| **Дашборд** | [vercel.com/dashboard](https://vercel.com/dashboard) (вход через GitHub `lastlysmith26-create`) |
| **Тариф** | Hobby (бесплатный) |

---

## 5. Переменные окружения

### 5.1 Backend (Render)

Файл: `backend/.env` (локально) / Environment Variables на Render (продакшен)

```env
GEMINI_API_KEY=AIzaSyCat9TYV7xSftqdR5v-4u3S42FPr1OQKO4
PORT=3001
SUPABASE_URL=https://iizmjkbdufjxxteklmib.supabase.co
SUPABASE_KEY=sb_publishable_ecIMBKz1w2CDjrf71y2GrA_0KbcQRJd
CORS_ORIGIN=https://neurophoto.vercel.app
```

> [!NOTE]
> `CORS_ORIGIN` задан только на Render. Локально CORS разрешает все домены (`*`).

### 5.2 Frontend (Vercel)

Файл: `frontend/.env` (локально) / Environment Variables на Vercel (продакшен)

```env
VITE_SUPABASE_URL=https://iizmjkbdufjxxteklmib.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_ecIMBKz1w2CDjrf71y2GrA_0KbcQRJd
VITE_API_URL=https://neurophoto-backend.onrender.com/api
```

> [!NOTE]
> Локально `VITE_API_URL` не задан — фолбек на `http://localhost:3001/api`.

---

## 6. Структура проекта

```
neurophoto/
├── .git/
├── .gitignore
├── CLAUDE_HANDOVER.md          # Документ передачи от предыдущего разработчика
├── handover.md                 # Расширенный хендовер
├── start_app.command           # Скрипт запуска (двойной клик на Mac)
├── stop_app.command            # Скрипт остановки
├── supabase_schema.sql         # SQL схема для создания таблиц
├── storage_policy.sql          # Политики доступа к Storage
├── storage_policy_v2.sql       # Обновлённые политики Storage
│
├── backend/
│   ├── .env                    # Переменные окружения (не в git)
│   ├── .node-version           # Версия Node.js (24)
│   ├── package.json
│   ├── server.js               # Точка входа Express сервера
│   ├── config/
│   │   └── supabase.js         # Supabase клиент
│   ├── routes/
│   │   ├── generate.js         # /api/generate — генерация фото + вариации
│   │   ├── models.js           # /api/models — CRUD моделей
│   │   ├── history.js          # /api/history — история генераций
│   │   └── presets.js          # /api/presets — пресеты настроек
│   ├── services/
│   │   ├── geminiService.js    # Взаимодействие с Gemini API
│   │   └── promptBuilder.js    # Построение промптов для AI
│   ├── presets/
│   │   └── default.json        # Дефолтные пресеты
│   └── storage/
│       └── images/             # Локальное хранилище (не используется в проде)
│
└── frontend/
    ├── .env                    # Переменные окружения (не в git)
    ├── package.json
    ├── vite.config.js          # Конфиг Vite
    ├── index.html              # HTML точка входа
    ├── dist/                   # Собранный бандл (Vercel собирает сам)
    └── src/
        ├── main.jsx            # Точка входа React
        ├── App.jsx             # Роутинг приложения
        ├── App.css
        ├── index.css           # Глобальные стили (Glassmorphism, цвета)
        ├── api/
        │   ├── client.js       # Axios клиент + JWT интерцептор
        │   └── supabase.js     # Supabase клиент (Auth)
        ├── contexts/
        │   └── AuthContext.jsx # Контекст авторизации
        ├── pages/
        │   └── Login.jsx       # Страница входа/регистрации
        ├── components/
        │   ├── AuthRoute.jsx   # Защищённые маршруты
        │   ├── Sidebar.jsx     # Боковое меню навигации
        │   ├── Layout.jsx      # Обёртка с фоном
        │   ├── ModelCreator.jsx# Создание модели (29KB — основной компонент)
        │   ├── PhotoSession.jsx# Генерация фото (42KB — основной компонент)
        │   ├── Gallery.jsx     # Галерея сгенерированных фото
        │   └── ui/
        │       ├── Combobox.jsx
        │       └── shader-animation.jsx  # Three.js фон
        └── assets/
```

---

## 7. API Эндпоинты бэкенда

**Base URL:** `https://neurophoto-backend.onrender.com/api`

| Метод | URL | Описание | Авторизация |
|---|---|---|---|
| GET | `/health` | Проверка здоровья сервера | ❌ |
| GET | `/models` | Список моделей текущего юзера | ✅ JWT |
| GET | `/models/:id` | Одна модель | ✅ JWT |
| POST | `/models` | Создать модель | ✅ JWT |
| PUT | `/models/:id` | Обновить модель | ✅ JWT |
| DELETE | `/models/:id` | Удалить модель | ✅ JWT |
| POST | `/generate` | Сгенерировать 1 фото | ✅ JWT |
| POST | `/generate/variations` | Сгенерировать вариации (2-10 фото) | ✅ JWT |
| POST | `/generate/preview` | Превью модели (без товара) | ❌ |
| POST | `/generate/angles` | 4 ракурса модели | ❌ |
| GET | `/history` | История генераций | ✅ JWT |
| DELETE | `/history/:id` | Удалить запись из истории | ✅ JWT |
| DELETE | `/history` | Очистить всю историю | ✅ JWT |
| GET | `/presets` | Получить пресеты | ❌ |

> [!NOTE]
> JWT токен передаётся в заголовке `Authorization: Bearer <token>`. Фронтенд добавляет его автоматически через Axios interceptor.

---

## 8. База данных (Supabase PostgreSQL)

### Таблицы

```mermaid
erDiagram
    auth_users ||--o| profiles : "1:1"
    auth_users ||--o{ models : "1:N"
    auth_users ||--o{ generations : "1:N"
    models ||--o{ generations : "1:N"

    profiles {
        uuid id PK
        text email
        text full_name
        text avatar_url
    }

    models {
        uuid id PK
        uuid user_id FK
        text name
        text gender
        text description
        jsonb photos
        timestamptz created_at
        timestamptz updated_at
    }

    generations {
        uuid id PK
        uuid user_id FK
        uuid model_id FK
        text image_url
        text filename
        text product_type
        text background
        text pose
        jsonb parameters
        boolean is_variation
        integer variation_index
        timestamptz created_at
    }
```

### Row Level Security (RLS)
Каждый пользователь видит **только свои** записи. Политики настроены на все таблицы.

### Storage
- **Bucket:** `images`
- **Путь:** `{user_id}/{timestamp}_{type}.png`
- **Доступ:** публичное чтение, запись только авторизованным пользователям

---

## 9. Как запустить локально

### Требования
- Node.js 24+
- npm

### Быстрый запуск (Mac)
Двойной клик на `start_app.command` в корне проекта.

### Ручной запуск

**Терминал 1 — Backend:**
```bash
cd neurophoto/backend
npm install          # первый раз
node server.js
# → Сервер на http://localhost:3001
```

**Терминал 2 — Frontend:**
```bash
cd neurophoto/frontend
npm install          # первый раз
npm run dev
# → Приложение на http://localhost:5173
```

### Остановка
- `Ctrl+C` в каждом терминале, или двойной клик на `stop_app.command`

---

## 10. Деплой (что где хостится)

### Frontend → Vercel
- **URL:** [neurophoto.vercel.app](https://neurophoto.vercel.app)
- **Автодеплой:** при пуше в `main` на GitHub
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output:** `dist`

### Backend → Render
- **URL:** [neurophoto-backend.onrender.com](https://neurophoto-backend.onrender.com)
- **Автодеплой:** при пуше в `main` на GitHub
- **Root Directory:** `backend`
- **Build Command:** `npm install`
- **Start Command:** `node server.js`
- **Instance:** Free (512 MB RAM, 0.1 CPU)

> [!WARNING]
> **Free tier Render** — сервер засыпает после ~15 мин неактивности. Первый запрос после сна ≈ 30 сек. Для стабильной работы — план Starter ($7/мес).

---

## 11. Поток данных (как работает генерация)

```mermaid
sequenceDiagram
    participant U as Пользователь
    participant F as Frontend (Vercel)
    participant B as Backend (Render)
    participant G as Gemini API
    participant S as Supabase

    U->>F: Выбирает модель + товар + фон
    F->>B: POST /api/generate (FormData + JWT)
    B->>S: Получает данные модели
    S-->>B: Модель (описание + фото)
    B->>G: Отправляет промпт + изображения
    G-->>B: Сгенерированное изображение (base64)
    B->>S: Загружает в Storage (images bucket)
    S-->>B: Public URL
    B->>S: Сохраняет запись в generations
    B-->>F: { image: publicUrl }
    F-->>U: Отображает фото
```

---

## 12. Устранение неполадок

| Проблема | Решение |
|---|---|
| Бэкенд не отвечает | Зайти на [dashboard.render.com](https://dashboard.render.com), проверить логи сервиса |
| CORS ошибка | Проверить `CORS_ORIGIN` в env vars на Render — должен быть `https://neurophoto.vercel.app` |
| «Generation blocked by safety» | Gemini заблокировал генерацию по правилам безопасности — сменить промпт |
| Фото не отображается | Проверить Storage policies в Supabase (выполнить `storage_policy_v2.sql`) |
| Долгий первый запрос | Нормально для бесплатного Render — сервер «просыпается» ~30 сек |
| Ошибка авторизации 401 | JWT токен истёк — перелогиниться |
