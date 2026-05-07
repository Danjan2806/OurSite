import { useState } from "react";
import { useLocation } from "wouter";
import AppHeader from "@/components/AppHeader";
import {
  Lightning, Layout, GlobeSimple, ChartBar, ShieldCheck, CreditCard,
  CaretDown, CaretRight,
  Presentation, List as ListIcon, AlignBottom, ListChecks, NumberSquareOne,
  TextT, Images, Quotes, Question, Megaphone, Tag, UsersThree, Heartbeat,
  VideoCamera, MusicNotes, Package, CalendarBlank, PaperPlaneTilt,
  Newspaper, MapPin, BracketsAngle,
  Rocket, ShoppingBag, Barbell,
  Square, Circle, PencilSimple, BezierCurve,
  ShoppingCart, ClipboardText,
  Info, Warning, CheckCircle, XCircle,
  Snowflake, LockOpen, Trash, ChatCircle, Bell,
  User, Crown, Shield,
  DeviceMobile, Bank, Lock,
  Code, Database, Cpu, FileArrowDown,
} from "@phosphor-icons/react";

/* ─── BLOCK ACCORDION DATA ─────────────────────────────── */

type BlockEntry = {
  key: string;
  name: string;
  category: string;
  catColor: string;
  Icon: React.ElementType;
  description: string;
  features: string[];
  settings: string[];
  guide?: { title: string; steps: string[] };
  mockup: React.ReactNode;
};

const BLOCKS: BlockEntry[] = [
  {
    key: "hero",
    name: "Hero — Главный экран",
    category: "Основные",
    catColor: "bg-violet-500/15 text-violet-400",
    Icon: Presentation,
    description:
      "Первый экран сайта — самый важный. Hero-блок формирует первое впечатление: крупный заголовок, подзаголовок, кнопка призыва к действию и фоновое изображение/видео. Обычно занимает всю ширину экрана.",
    features: [
      "Крупный заголовок (H1) с поддержкой форматирования",
      "Подзаголовок для пояснения ценностного предложения",
      "CTA-кнопка с настраиваемым текстом, цветом и ссылкой",
      "Фоновое изображение или видео с тёмным оверлеем",
      "Анимация появления (fade-up, zoom-in и др.)",
    ],
    settings: [
      "Заголовок и подзаголовок",
      "Текст и ссылка CTA-кнопки",
      "Цвет CTA-кнопки (HEX)",
      "Фоновое изображение (URL)",
      "Цвет фона и текста",
      "Анимация блока",
      "Якорь (anchor ID) для навигации",
    ],
    guide: {
      title: "Настройка Hero с фоновым изображением",
      steps: [
        "Добавьте блок Hero из левой панели.",
        "В правой панели введите заголовок — кратко опишите главную ценность: «Продающие сайты за 5 минут».",
        "В поле «Подзаголовок» добавьте уточнение в 1–2 предложения.",
        "Скопируйте URL изображения (например, с Unsplash) и вставьте в поле «Фон (URL)».",
        "В поле «Цвет CTA» введите HEX нужного цвета: #7C3AED для фиолетового.",
        "В поле «Текст кнопки» напишите призыв: «Попробовать бесплатно».",
        "В «Ссылка кнопки» введите /auth или https://... для внешней ссылки.",
        "Задайте анимацию — рекомендуем fade-up для плавного появления.",
      ],
    },
    mockup: (
      <div className="relative rounded-xl overflow-hidden h-28 bg-gradient-to-br from-violet-900/50 to-indigo-900/50 border border-white/10 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="text-white font-black text-base mb-1">Ваш крутой заголовок</div>
          <div className="text-white/60 text-xs mb-3">Подзаголовок с ценностным предложением</div>
          <div className="inline-block bg-violet-600 text-white text-xs px-4 py-1.5 rounded-lg font-semibold">CTA Кнопка</div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      </div>
    ),
  },
  {
    key: "header_menu",
    name: "Header Menu — Навигация",
    category: "Основные",
    catColor: "bg-violet-500/15 text-violet-400",
    Icon: ListIcon,
    description:
      "Шапка сайта с логотипом и навигационным меню. Обычно закреплена вверху страницы. Поддерживает ссылки на страницы сайта, якоря внутри страницы, а также CTA-кнопку. Полностью настраиваемый внешний вид.",
    features: [
      "Логотип (текст или изображение)",
      "Несколько пунктов меню с настраиваемыми ссылками",
      "Ссылка на страницу или якорь (anchor ID)",
      "CTA-кнопка в правом углу (можно скрыть)",
      "Цвет фона шапки и текста ссылок",
    ],
    settings: [
      "Название (текст логотипа)",
      "URL изображения логотипа",
      "Пункты меню: текст + тип ссылки (страница / якорь / URL)",
      "Текст и ссылка CTA-кнопки",
      "Скрыть CTA-кнопку (чекбокс)",
      "Цвет фона шапки",
      "Цвет текста ссылок",
    ],
    guide: {
      title: "Настройка навигации с якорями",
      steps: [
        "Добавьте блок Header Menu. Он займёт всю ширину автоматически.",
        "Для каждого блока на странице задайте Anchor ID (поле #якорь в правой панели): features, pricing, contacts.",
        "В Header Menu добавьте пункты меню: «Возможности» → якорь #features, «Тарифы» → якорь #pricing.",
        "Кнопка «Попробовать» → тип URL → /auth.",
        "Чтобы скрыть CTA-кнопку, поставьте галочку «Скрыть CTA».",
        "Для тёмного фона шапки задайте цвет фона #0a0a14.",
      ],
    },
    mockup: (
      <div className="rounded-xl bg-[#0f0f1a] border border-white/10 p-3 flex items-center justify-between">
        <div className="text-white font-bold text-sm">MyBrand</div>
        <div className="flex gap-4">
          {["Главная", "О нас", "Тарифы"].map(l => (
            <span key={l} className="text-white/50 text-xs">{l}</span>
          ))}
        </div>
        <div className="bg-violet-600 text-white text-xs px-3 py-1 rounded-lg">Начать</div>
      </div>
    ),
  },
  {
    key: "footer",
    name: "Footer — Подвал",
    category: "Основные",
    catColor: "bg-violet-500/15 text-violet-400",
    Icon: AlignBottom,
    description:
      "Подвал сайта содержит контактную информацию, ссылки на разделы, социальные сети и копирайт. Занимает всю ширину страницы и обычно размещается последним блоком.",
    features: [
      "Логотип или название бренда",
      "Несколько колонок со ссылками",
      "Контактная информация (email, телефон)",
      "Ссылки на социальные сети",
      "Строка копирайта",
    ],
    settings: [
      "Название бренда",
      "Текст копирайта",
      "Колонки ссылок с заголовками",
      "Email и телефон",
      "Ссылки: VK, Telegram, Instagram",
      "Цвет фона подвала",
      "Цвет текста",
    ],
    mockup: (
      <div className="rounded-xl bg-[#080810] border border-white/10 p-4">
        <div className="flex justify-between mb-3">
          <div className="text-white font-bold text-sm">MyBrand</div>
          <div className="flex gap-3 text-white/40 text-xs">
            <span>О нас</span><span>Условия</span><span>Контакты</span>
          </div>
        </div>
        <div className="border-t border-white/8 pt-2 flex justify-between">
          <span className="text-white/30 text-xs">© 2025 MyBrand</span>
          <span className="text-white/30 text-xs">support@mybrand.ru</span>
        </div>
      </div>
    ),
  },
  {
    key: "features",
    name: "Features — Преимущества",
    category: "Контент",
    catColor: "bg-blue-500/15 text-blue-400",
    Icon: ListChecks,
    description:
      "Блок для отображения ключевых преимуществ, функций или характеристик вашего продукта. Каждый элемент содержит иконку (emoji или URL), заголовок и описание. Идеально для landing-страниц.",
    features: [
      "Неограниченное количество пунктов",
      "Иконка: emoji-символ или URL изображения",
      "Заголовок и описание каждого пункта",
      "Автоматическая сетка из 2–3 колонок",
      "Настраиваемый заголовок всего блока",
    ],
    settings: [
      "Заголовок блока",
      "Для каждого пункта: иконка (emoji или URL), заголовок, описание",
      "Добавление/удаление пунктов",
      "Цвет фона блока",
      "Анимация появления",
    ],
    guide: {
      title: "Использование иконок в Features",
      steps: [
        "Добавьте блок Features. Редактируйте каждый пункт через правую панель.",
        "В поле «Иконка» вставьте один emoji-символ: 🚀, ✅, 🔒.",
        "Для кастомной иконки вставьте прямую ссылку на SVG/PNG изображение (16×16 или 32×32).",
        "Добавьте новые пункты кнопкой «+ Добавить пункт» в панели блока.",
        "Удалите ненужные пункты нажав «×» рядом с каждым пунктом.",
        "Рекомендуемое количество: 3, 6 или 9 пунктов — кратно 3 для симметричной сетки.",
      ],
    },
    mockup: (
      <div className="rounded-xl bg-secondary/20 border border-white/8 p-4">
        <div className="text-white font-bold text-sm text-center mb-3">Наши преимущества</div>
        <div className="grid grid-cols-3 gap-2">
          {[["🚀", "Быстро"], ["🔒", "Безопасно"], ["📊", "Аналитика"]].map(([icon, t]) => (
            <div key={t} className="glass rounded-lg p-2.5 text-center">
              <div className="text-xl mb-1">{icon}</div>
              <div className="text-white/80 text-xs font-medium">{t}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    key: "stats",
    name: "Stats — Числа и статистика",
    category: "Контент",
    catColor: "bg-blue-500/15 text-blue-400",
    Icon: NumberSquareOne,
    description:
      "Блок с крупными числовыми показателями — идеален для демонстрации достижений, масштаба и доверия. Числа отображаются крупным шрифтом с метками под ними.",
    features: [
      "Несколько числовых показателей в строку",
      "Крупные цифры с метками-подписями",
      "Поддержка единиц измерения (+, %, K, M и др.)",
      "Настраиваемый фон секции",
    ],
    settings: [
      "Заголовок блока",
      "Для каждого показателя: значение и метка",
      "Добавление/удаление показателей",
      "Цвет фона",
      "Цвет текста",
    ],
    mockup: (
      <div className="rounded-xl bg-secondary/20 border border-white/8 p-4">
        <div className="grid grid-cols-4 gap-2 text-center">
          {[["10k+", "Клиентов"], ["99%", "Uptime"], ["4.9★", "Рейтинг"], ["24/7", "Поддержка"]].map(([v, l]) => (
            <div key={l}>
              <div className="text-white font-black text-xl">{v}</div>
              <div className="text-white/40 text-xs mt-0.5">{l}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    key: "text",
    name: "Text — Текстовый блок",
    category: "Контент",
    catColor: "bg-blue-500/15 text-blue-400",
    Icon: TextT,
    description:
      "Свободный текстовый блок для добавления абзацев, описаний, параграфов. Подходит для страниц «О нас», «Условия использования», статей блога. Поддерживает произвольный HTML-текст.",
    features: [
      "Произвольный многострочный текст",
      "Отдельные поля: заголовок и тело текста",
      "Поддержка переносов строк",
      "Регулируемый отступ и выравнивание через стили",
    ],
    settings: [
      "Заголовок (необязательно)",
      "Текст содержимого",
      "Цвет фона",
      "Цвет заголовка и текста",
      "Минимальная высота блока",
    ],
    mockup: (
      <div className="rounded-xl bg-secondary/20 border border-white/8 p-4">
        <div className="text-white font-bold text-sm mb-2">О нашей компании</div>
        <div className="space-y-1.5">
          <div className="h-2 bg-white/15 rounded-full w-full" />
          <div className="h-2 bg-white/15 rounded-full w-5/6" />
          <div className="h-2 bg-white/15 rounded-full w-4/5" />
          <div className="h-2 bg-white/15 rounded-full w-full" />
        </div>
      </div>
    ),
  },
  {
    key: "gallery",
    name: "Gallery — Фотогалерея",
    category: "Контент",
    catColor: "bg-blue-500/15 text-blue-400",
    Icon: Images,
    description:
      "Блок для отображения коллекции фотографий. Поддерживает подписи к каждому изображению. Идеален для портфолио, фото событий, каталога продукции. Отображается в виде сетки карточек.",
    features: [
      "Неограниченное количество изображений",
      "Подпись к каждому фото (caption)",
      "Адаптивная сетка (2–3 колонки)",
      "Lightbox для просмотра фото в полный размер",
    ],
    settings: [
      "Заголовок блока",
      "Для каждого фото: URL изображения и подпись",
      "Добавление/удаление фотографий",
      "Цвет фона блока",
    ],
    guide: {
      title: "Добавление изображений с подписями",
      steps: [
        "Добавьте блок Gallery. По умолчанию будет несколько пустых слотов.",
        "Для каждого изображения введите прямой URL в поле «URL фото».",
        "Совет: используйте Unsplash (unsplash.com) или Pexels — найдите фото, нажмите ПКМ и скопируйте адрес изображения.",
        "В поле «Подпись» введите описание: «Открытие офиса, март 2024».",
        "Нажмите «+ Добавить фото» для добавления новой карточки.",
        "Для удаления фото нажмите «×» рядом с нужным изображением в панели.",
      ],
    },
    mockup: (
      <div className="rounded-xl bg-secondary/20 border border-white/8 p-4">
        <div className="text-white font-bold text-xs mb-2 text-center">Галерея</div>
        <div className="grid grid-cols-3 gap-1.5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="aspect-square bg-white/8 rounded-lg border border-white/10 flex items-center justify-center">
              <Images size={14} weight="light" className="text-white/30" />
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    key: "testimonials",
    name: "Testimonials — Отзывы",
    category: "Маркетинг",
    catColor: "bg-pink-500/15 text-pink-400",
    Icon: Quotes,
    description:
      "Блок с отзывами клиентов или пользователей. Каждая карточка содержит текст отзыва, имя автора, его должность и аватар. Отлично повышает доверие к продукту.",
    features: [
      "Несколько карточек отзывов",
      "Аватар автора (URL или инициал)",
      "Имя, должность/компания",
      "Текст отзыва произвольной длины",
    ],
    settings: [
      "Заголовок блока",
      "Для каждого отзыва: текст, имя, должность, URL аватара",
      "Добавление/удаление карточек",
      "Цвет фона",
    ],
    mockup: (
      <div className="rounded-xl bg-secondary/20 border border-white/8 p-4">
        <div className="space-y-2">
          {[
            { name: "Анна К.", role: "Основатель, Studiolab", text: "Создала сайт за 30 минут — это невероятно!" },
            { name: "Михаил Р.", role: "Маркетолог", text: "Лучший конструктор, которым я пользовался." },
          ].map(t => (
            <div key={t.name} className="glass rounded-lg p-2.5 flex gap-2.5">
              <div className="w-7 h-7 gradient-purple rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{t.name[0]}</div>
              <div>
                <div className="text-white text-xs font-semibold">{t.name} <span className="text-white/40 font-normal">· {t.role}</span></div>
                <div className="text-white/60 text-xs mt-0.5">«{t.text}»</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    key: "faq",
    name: "FAQ — Вопросы и ответы",
    category: "Маркетинг",
    catColor: "bg-pink-500/15 text-pink-400",
    Icon: Question,
    description:
      "Блок с часто задаваемыми вопросами в формате аккордеона. Посетитель нажимает на вопрос — появляется ответ. Снижает нагрузку на поддержку и закрывает возражения покупателей.",
    features: [
      "Неограниченное количество вопросов",
      "Раскрывающийся аккордеон (один открыт за раз)",
      "Произвольный текст ответа",
      "Настраиваемый заголовок секции",
    ],
    settings: [
      "Заголовок блока",
      "Для каждого элемента: вопрос и ответ",
      "Добавление/удаление вопросов",
      "Цвет фона",
    ],
    mockup: (
      <div className="rounded-xl bg-secondary/20 border border-white/8 p-4 space-y-2">
        <div className="text-white font-bold text-xs text-center mb-2">Часто задаваемые вопросы</div>
        {["Сколько это стоит?", "Могу ли я использовать свой домен?", "Как добавить блок на страницу?"].map((q, i) => (
          <div key={q} className="glass rounded-lg px-3 py-2 flex items-center justify-between">
            <span className="text-white/80 text-xs">{q}</span>
            <CaretDown size={12} className={`text-white/40 flex-shrink-0 ${i === 0 ? "rotate-180" : ""}`} />
          </div>
        ))}
      </div>
    ),
  },
  {
    key: "cta",
    name: "CTA — Призыв к действию",
    category: "Маркетинг",
    catColor: "bg-pink-500/15 text-pink-400",
    Icon: Megaphone,
    description:
      "Секция с призывом к действию в середине или конце страницы. Крупный заголовок + подзаголовок + одна кнопка. Используйте для конверсионных точек: «Записаться», «Купить», «Начать».",
    features: [
      "Заголовок и подзаголовок",
      "Одна CTA-кнопка с настраиваемым текстом и ссылкой",
      "Настраиваемый цвет кнопки",
      "Фоновое изображение или сплошной цвет",
    ],
    settings: [
      "Заголовок и подзаголовок",
      "Текст и ссылка кнопки",
      "Цвет кнопки (HEX)",
      "Цвет фона и текста",
      "Фоновое изображение (URL)",
      "Анимация появления",
    ],
    mockup: (
      <div className="rounded-xl bg-gradient-to-r from-violet-900/60 to-indigo-900/60 border border-white/10 p-5 text-center">
        <div className="text-white font-black text-sm mb-1">Начните прямо сейчас</div>
        <div className="text-white/60 text-xs mb-3">Без кредитной карты · Бесплатно</div>
        <div className="inline-block bg-violet-600 text-white text-xs px-5 py-1.5 rounded-lg font-bold">Начать бесплатно</div>
      </div>
    ),
  },
  {
    key: "pricing",
    name: "Pricing — Тарифы и цены",
    category: "Маркетинг",
    catColor: "bg-pink-500/15 text-pink-400",
    Icon: Tag,
    description:
      "Таблица тарифов с несколькими столбцами. Каждая карточка содержит название плана, цену, список возможностей и кнопку. Один план можно выделить как «Рекомендуемый».",
    features: [
      "Несколько тарифных планов",
      "Название, цена, период (месяц/год)",
      "Список включённых возможностей (✓ / ✗)",
      "Выделение «Популярного» плана",
      "CTA-кнопка для каждого плана",
    ],
    settings: [
      "Заголовок блока",
      "Для каждого плана: название, цена, период, список фич, текст кнопки, ссылка кнопки",
      "Признак «Популярный» (highlighted)",
      "Добавление/удаление планов",
      "Цвет фона",
    ],
    mockup: (
      <div className="rounded-xl bg-secondary/20 border border-white/8 p-4">
        <div className="grid grid-cols-3 gap-2">
          {[["Free", "$0", false], ["Pro", "$19", true], ["Business", "$49", false]].map(([name, price, pop]) => (
            <div key={String(name)} className={`rounded-lg p-2.5 border text-center ${pop ? "border-violet-500/50 bg-violet-500/10" : "border-white/8 bg-white/3"}`}>
              {pop && <div className="text-xs text-violet-400 font-bold mb-1">★ Популярный</div>}
              <div className="text-white font-bold text-xs">{name}</div>
              <div className="text-white/50 text-xs">{price}/мес</div>
              <div className={`mt-2 text-xs py-1 rounded font-medium ${pop ? "bg-violet-600 text-white" : "bg-white/8 text-white/60"}`}>Выбрать</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    key: "team",
    name: "Team — Команда",
    category: "Команда",
    catColor: "bg-cyan-500/15 text-cyan-400",
    Icon: UsersThree,
    description:
      "Карточки членов команды с фото, именем, должностью и описанием. Идеален для раздела «О нас» или «Наша команда». Аватар берётся по URL или отображает инициал.",
    features: [
      "Карточки с аватаром, именем и должностью",
      "Описание или короткое bio",
      "URL аватара или инициал (если URL не указан)",
      "Адаптивная сетка",
    ],
    settings: [
      "Заголовок блока",
      "Для каждого участника: имя, должность, описание, URL аватара",
      "Добавление/удаление участников",
      "Цвет фона",
    ],
    mockup: (
      <div className="rounded-xl bg-secondary/20 border border-white/8 p-4">
        <div className="text-white font-bold text-xs text-center mb-3">Наша команда</div>
        <div className="grid grid-cols-3 gap-2">
          {[["Анна", "CEO"], ["Борис", "CTO"], ["Галина", "Design"]].map(([name, role]) => (
            <div key={name} className="glass rounded-lg p-2 text-center">
              <div className="w-8 h-8 gradient-purple rounded-full flex items-center justify-center text-white text-xs font-bold mx-auto mb-1">{name[0]}</div>
              <div className="text-white text-xs font-semibold">{name}</div>
              <div className="text-white/40 text-xs">{role}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    key: "coaches",
    name: "Coaches — Тренеры / Специалисты",
    category: "Команда",
    catColor: "bg-cyan-500/15 text-cyan-400",
    Icon: Heartbeat,
    description:
      "Специализированный блок для тренеров, преподавателей или специалистов. Аналог Team, но с акцентом на специализацию. Идеален для фитнес-клубов, языковых школ, консалтинга.",
    features: [
      "Фото, имя, специализация",
      "Расширенное описание каждого специалиста",
      "URL аватара или инициал",
      "Адаптивная сетка карточек",
    ],
    settings: [
      "Заголовок блока",
      "Для каждого тренера: имя, специализация, описание, URL фото",
      "Добавление/удаление тренеров",
      "Цвет фона",
    ],
    mockup: (
      <div className="rounded-xl bg-secondary/20 border border-white/8 p-4">
        <div className="text-white font-bold text-xs text-center mb-3">Наши тренеры</div>
        <div className="grid grid-cols-2 gap-2">
          {[["Иван Петров", "Силовые тренировки"], ["Мария Лен", "Йога и стретчинг"]].map(([name, spec]) => (
            <div key={name} className="glass rounded-lg p-2.5 flex gap-2 items-center">
              <div className="w-9 h-9 gradient-purple rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0">{name[0]}</div>
              <div>
                <div className="text-white text-xs font-semibold">{name}</div>
                <div className="text-white/40 text-xs">{spec}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    key: "video",
    name: "Video — Видеоблок",
    category: "Медиа",
    catColor: "bg-red-500/15 text-red-400",
    Icon: VideoCamera,
    description:
      "Встроенный видеоплеер для YouTube или Vimeo. Вставьте ссылку — блок автоматически определит платформу и отобразит плеер с адаптивным размером. Поддерживает описание под видео.",
    features: [
      "Встраивание YouTube и Vimeo по URL",
      "Заголовок и описание под видео",
      "Адаптивный плеер (16:9)",
      "Автоопределение платформы по ссылке",
    ],
    settings: [
      "Заголовок блока",
      "URL видео (YouTube или Vimeo)",
      "Описание под видео",
      "Цвет фона",
    ],
    guide: {
      title: "Вставка YouTube-видео",
      steps: [
        "Откройте видео на YouTube и скопируйте URL из адресной строки.",
        "Формат: https://www.youtube.com/watch?v=XXXXX или https://youtu.be/XXXXX",
        "Вставьте URL в поле «Ссылка на видео» в правой панели.",
        "Блок автоматически преобразует ссылку в embed-формат для воспроизведения.",
        "Добавьте заголовок и описание для контекста.",
        "Примечание: видео не автовоспроизводится — посетитель нажимает кнопку Play.",
      ],
    },
    mockup: (
      <div className="rounded-xl bg-black border border-white/10 h-28 flex items-center justify-center">
        <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
          <div className="w-0 h-0 border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent border-l-[14px] border-l-white ml-1" />
        </div>
      </div>
    ),
  },
  {
    key: "music_player",
    name: "Music Player — Плеер треков",
    category: "Медиа",
    catColor: "bg-red-500/15 text-red-400",
    Icon: MusicNotes,
    description:
      "Встроенный аудиоплеер для музыкальных лейблов и артистов. Отображает список треков с возможностью воспроизведения прямо на странице. Поддерживает обложки треков.",
    features: [
      "Плейлист с несколькими треками",
      "Обложка трека (URL изображения)",
      "Название трека и исполнитель",
      "Встроенный HTML5 Audio плеер",
      "Прямые ссылки на MP3-файлы",
    ],
    settings: [
      "Заголовок блока",
      "Для каждого трека: название, исполнитель, URL аудио, URL обложки",
      "Добавление/удаление треков",
      "Цвет фона",
    ],
    mockup: (
      <div className="rounded-xl bg-[#0d0d1a] border border-white/10 p-4">
        <div className="text-white font-bold text-xs mb-3">Последние треки</div>
        <div className="space-y-2">
          {[["Трек 1", "Артист"], ["Трек 2", "Артист"]].map(([t, a]) => (
            <div key={t} className="flex items-center gap-2.5 glass rounded-lg px-3 py-2">
              <div className="w-6 h-6 bg-violet-600 rounded flex items-center justify-center flex-shrink-0">
                <MusicNotes size={12} weight="fill" className="text-white" />
              </div>
              <div className="flex-1">
                <div className="text-white text-xs font-semibold">{t}</div>
                <div className="text-white/40 text-xs">{a}</div>
              </div>
              <div className="text-white/30 text-xs">▶</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    key: "discography",
    name: "Discography — Дискография",
    category: "Медиа",
    catColor: "bg-red-500/15 text-red-400",
    Icon: MusicNotes,
    description:
      "Блок для отображения дискографии артиста или лейбла: альбомы, синглы, EP. Каждый релиз содержит обложку, название, год и ссылку на стриминг.",
    features: [
      "Карточки альбомов с обложкой",
      "Название, год выпуска, тип релиза",
      "Ссылка на Spotify, Apple Music и т.д.",
      "Адаптивная сетка",
    ],
    settings: [
      "Заголовок блока",
      "Для каждого альбома: название, год, тип, URL обложки, URL стриминга",
      "Добавление/удаление альбомов",
      "Цвет фона",
    ],
    mockup: (
      <div className="rounded-xl bg-secondary/20 border border-white/8 p-4">
        <div className="text-white font-bold text-xs mb-2">Дискография</div>
        <div className="grid grid-cols-3 gap-2">
          {[["Альбом I", "2023"], ["Single", "2024"], ["EP Vol.2", "2024"]].map(([n, y]) => (
            <div key={n} className="rounded-lg overflow-hidden">
              <div className="aspect-square bg-gradient-to-br from-violet-800 to-indigo-900 flex items-center justify-center">
                <MusicNotes size={20} weight="fill" className="text-white/60" />
              </div>
              <div className="bg-white/5 p-1.5">
                <div className="text-white text-xs font-semibold truncate">{n}</div>
                <div className="text-white/40 text-xs">{y}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    key: "products",
    name: "Products — Каталог товаров",
    category: "Бизнес",
    catColor: "bg-amber-500/15 text-amber-400",
    Icon: Package,
    description:
      "Каталог продуктов или услуг с карточками. Каждая карточка содержит фото, название, цену, описание и кнопку «Купить» или «Подробнее». Идеален для интернет-магазинов.",
    features: [
      "Карточки товаров с фото и ценой",
      "Название, описание, цена (с валютой)",
      "Кнопка действия с ссылкой",
      "Метка «Хит» или «Новинка»",
      "Адаптивная сетка карточек",
    ],
    settings: [
      "Заголовок блока",
      "Для каждого товара: название, описание, цена, валюта, URL фото, текст и ссылка кнопки",
      "Добавление/удаление товаров",
      "Цвет фона",
    ],
    mockup: (
      <div className="rounded-xl bg-secondary/20 border border-white/8 p-4">
        <div className="text-white font-bold text-xs text-center mb-3">Наши товары</div>
        <div className="grid grid-cols-3 gap-2">
          {[["Товар А", "1 200 ₽"], ["Товар Б", "3 500 ₽"], ["Товар В", "890 ₽"]].map(([n, p]) => (
            <div key={n} className="glass rounded-lg overflow-hidden">
              <div className="h-12 bg-white/8 flex items-center justify-center">
                <Package size={16} weight="light" className="text-white/30" />
              </div>
              <div className="p-1.5">
                <div className="text-white text-xs font-semibold">{n}</div>
                <div className="text-violet-400 text-xs">{p}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    key: "schedule",
    name: "Schedule — Расписание",
    category: "Бизнес",
    catColor: "bg-amber-500/15 text-amber-400",
    Icon: CalendarBlank,
    description:
      "Блок с расписанием занятий, событий или сеансов. Идеален для фитнес-клубов, курсов, студий. Отображает дни недели с временными слотами и описанием занятий.",
    features: [
      "Расписание по дням недели",
      "Название занятия, время, тренер",
      "Цветовые метки по типу занятия",
      "Место проведения (зал, формат)",
    ],
    settings: [
      "Заголовок блока",
      "Для каждого события: день, время начала и конца, название, тренер, место",
      "Добавление/удаление слотов",
      "Цвет фона",
    ],
    mockup: (
      <div className="rounded-xl bg-secondary/20 border border-white/8 p-4">
        <div className="text-white font-bold text-xs mb-3">Расписание на неделю</div>
        <div className="space-y-1.5">
          {[["Пн 08:00", "Силовая тренировка", "Иван"], ["Ср 10:00", "Йога", "Мария"], ["Пт 18:00", "Кардио", "Алексей"]].map(([time, name, trainer]) => (
            <div key={name} className="flex items-center gap-2 glass rounded-lg px-2.5 py-1.5">
              <div className="text-violet-400 text-xs font-mono w-16 flex-shrink-0">{time}</div>
              <div className="flex-1 text-white text-xs font-semibold">{name}</div>
              <div className="text-white/40 text-xs">{trainer}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    key: "contacts",
    name: "Contacts / Form — Форма и контакты",
    category: "Бизнес",
    catColor: "bg-amber-500/15 text-amber-400",
    Icon: PaperPlaneTilt,
    description:
      "Контактный блок с формой обратной связи (имя, email, сообщение) и контактными данными: адрес, телефон, email, часы работы. Форма отправляет данные на указанный email.",
    features: [
      "Форма: имя, email, сообщение, кнопка",
      "Контактная информация рядом с формой",
      "Адрес, телефон, email",
      "Часы работы",
      "Уведомление о успешной отправке",
    ],
    settings: [
      "Заголовок блока",
      "Email для получения заявок",
      "Адрес, телефон, email, часы работы",
      "Текст кнопки формы",
      "Цвет фона",
    ],
    mockup: (
      <div className="rounded-xl bg-secondary/20 border border-white/8 p-4">
        <div className="text-white font-bold text-xs mb-3">Свяжитесь с нами</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            {["Ваше имя", "Email", "Сообщение"].map(p => (
              <div key={p} className="bg-white/6 border border-white/10 rounded-lg px-2 py-1.5 text-white/30 text-xs">{p}</div>
            ))}
            <div className="bg-violet-600 text-white text-xs px-3 py-1.5 rounded-lg text-center font-semibold">Отправить</div>
          </div>
          <div className="space-y-2 text-xs text-white/60">
            <div>📍 ул. Ленина, 1</div>
            <div>📞 +7 999 123-45-67</div>
            <div>✉️ info@company.ru</div>
            <div>🕐 Пн–Пт 9:00–18:00</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "blog",
    name: "Blog — Статьи и новости",
    category: "Бизнес",
    catColor: "bg-amber-500/15 text-amber-400",
    Icon: Newspaper,
    description:
      "Блок для публикации статей, новостей или кейсов. Отображает карточки с обложкой, заголовком, датой и отрывком текста. Кнопка «Читать далее» ведёт на полную статью.",
    features: [
      "Карточки статей с обложкой",
      "Заголовок, дата, краткое описание",
      "Ссылка «Читать далее» (URL)",
      "Адаптивная сетка 2–3 колонки",
    ],
    settings: [
      "Заголовок блока",
      "Для каждой статьи: заголовок, дата, описание, URL обложки, ссылка «Читать далее»",
      "Добавление/удаление статей",
      "Цвет фона",
    ],
    mockup: (
      <div className="rounded-xl bg-secondary/20 border border-white/8 p-4">
        <div className="text-white font-bold text-xs mb-3">Последние статьи</div>
        <div className="grid grid-cols-2 gap-2">
          {[["Как создать сайт за 5 минут", "12 янв"], ["10 советов по SEO", "5 фев"]].map(([title, date]) => (
            <div key={title} className="glass rounded-lg overflow-hidden">
              <div className="h-10 bg-white/8" />
              <div className="p-2">
                <div className="text-white text-xs font-semibold leading-tight">{title}</div>
                <div className="text-white/40 text-xs mt-1">{date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    key: "map",
    name: "Map — Карта",
    category: "Бизнес",
    catColor: "bg-amber-500/15 text-amber-400",
    Icon: MapPin,
    description:
      "Встроенная карта Google Maps или Яндекс Карт с отмеченным адресом. Помогает покупателям найти ваш офис, магазин или шоурум. Вставляется через embed-ссылку из сервиса карт.",
    features: [
      "Поддержка Google Maps и Яндекс Карт",
      "Настраиваемый заголовок над картой",
      "Адаптивный размер блока",
      "Вставка через стандартный iframe-embed",
    ],
    settings: [
      "Заголовок блока",
      "Embed URL карты (из Google Maps или Яндекс)",
      "Высота карты (авто / 400px / 600px)",
      "Цвет фона",
    ],
    guide: {
      title: "Как получить embed-ссылку для Google Maps",
      steps: [
        "Откройте maps.google.com и найдите нужный адрес.",
        "Нажмите «Поделиться» → выберите вкладку «Встроить карту».",
        "Нажмите кнопку «Скопировать HTML».",
        "Из скопированного кода возьмите только значение атрибута src=«...» — это и есть embed URL.",
        "Вставьте этот URL в поле «Embed URL карты» в правой панели блока.",
        "Для Яндекс Карт: maps.yandex.ru → Поделиться → Встроить карту → скопируйте iframe src.",
      ],
    },
    mockup: (
      <div className="rounded-xl bg-secondary/20 border border-white/8 overflow-hidden h-28 relative">
        <div className="absolute inset-0 grid grid-cols-8 grid-rows-5 gap-px opacity-20">
          {Array.from({ length: 40 }).map((_, i) => <div key={i} className="bg-white/10" />)}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-red-500 rounded-full p-2 shadow-lg shadow-red-500/40">
            <MapPin size={20} weight="fill" className="text-white" />
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "popup",
    name: "Popup — Всплывающее окно",
    category: "Продвинутые",
    catColor: "bg-emerald-500/15 text-emerald-400",
    Icon: Bell,
    description:
      "Всплывающий попап с заголовком, текстом, изображением и встроенной формой. Открывается по нажатию кнопки с нужным ID или автоматически. Поддерживает 4 варианта расположения: центрированный, с картинкой слева, полноэкранный и нижний drawer.",
    features: [
      "4 варианта: По центру, Картинка слева, Полноэкранный, Снизу (drawer)",
      "Встроенный конструктор полей формы (text, email, tel, select, checkbox)",
      "Открытие по кнопке — любая кнопка ссылается на ID попапа",
      "Изображение с позицией: слева, справа, сверху или фоном",
      "Настраиваемый размер окна (sm / md / lg)",
      "Закрытие по клику на оверлей или кнопке ✕",
    ],
    settings: [
      "Вариант (variant): centered / image-left / fullscreen / bottom-sheet",
      "Заголовок и Rich Text тело попапа",
      "URL изображения и его позиция",
      "Размер окна: sm / md / lg",
      "Анимация появления",
      "Уникальный ID попапа (для триггера кнопок)",
      "Поля формы: тип, метка, placeholder, обязательность",
      "Email для получения заявок из формы",
    ],
    guide: {
      title: "Открытие попапа по нажатию кнопки",
      steps: [
        "Добавьте блок Popup из раздела «Продвинутые» в левой панели редактора.",
        "В правой панели → вкладка «Триггер» → задайте уникальный ID, например: promo-popup.",
        "Откройте настройки нужной кнопки (Hero, CTA или любого другого блока).",
        "В поле «Действие кнопки» выберите «Открыть попап».",
        "В выпадающем списке появятся все попапы страницы — выберите promo-popup.",
        "Нажмите кнопку в режиме предпросмотра — попап откроется. Закрыть: кнопка ✕ или клик на фоновый оверлей.",
      ],
    },
    mockup: (
      <div className="rounded-xl bg-[#0f0f1a] border border-white/10 p-4 relative min-h-[120px]">
        <div className="absolute inset-0 opacity-20 flex flex-col gap-1.5 p-4 pointer-events-none">
          <div className="h-2 bg-white/20 rounded w-2/3" />
          <div className="h-2 bg-white/15 rounded w-1/2" />
        </div>
        <div className="relative flex items-center justify-center">
          <div className="w-full max-w-[220px] bg-[#1a1a30] border border-white/20 rounded-xl p-3.5 shadow-2xl shadow-black/60">
            <div className="flex justify-between items-center mb-2">
              <div className="text-white text-xs font-bold">Специальное предложение 🎁</div>
              <div className="text-white/30 text-xs leading-none">✕</div>
            </div>
            <div className="text-white/50 text-xs mb-3 leading-relaxed">Скидка 30% только сегодня — не упусти!</div>
            <div className="flex gap-2">
              <div className="flex-1 bg-white/8 border border-white/10 rounded-lg px-2 py-1 text-white/30 text-xs">Email</div>
              <div className="bg-violet-600 text-white text-xs px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap">Получить</div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "zero_block",
    name: "ZERO_BLOCK — Свободный HTML",
    category: "Продвинутые",
    catColor: "bg-emerald-500/15 text-emerald-400",
    Icon: BracketsAngle,
    description:
      "Мощный блок для вставки произвольного HTML+CSS. Отображается в изолированном sandbox-iframe — HTML выполняется безопасно, без доступа к скриптам основной страницы. Для разработчиков и опытных пользователей.",
    features: [
      "Любой HTML и CSS код",
      "Песочница (sandbox) — скрипты заблокированы для безопасности",
      "Предпросмотр в режиме реального времени",
      "Поддержка inline-стилей и CSS-классов",
      "Вставка SVG, таблиц, кастомных компонентов",
    ],
    settings: [
      "Заголовок блока (необязательно)",
      "HTML-содержимое (свободный ввод)",
      "Цвет фона",
      "Минимальная высота",
    ],
    guide: {
      title: "Пошаговый гайд: вставка кастомного HTML-счётчика",
      steps: [
        "Добавьте блок ZERO_BLOCK из раздела «Продвинутые» в левой панели.",
        "В правой панели откроется поле для ввода HTML.",
        "Вставьте свой HTML-код. Пример простого таймера:",
        "<div style=\"text-align:center;font-size:48px;color:#7C3AED;font-weight:900;\">00:00</div>",
        "Всё что вы введёте отобразится в iframe в предпросмотре.",
        "ВАЖНО: теги <script> заблокированы — используйте только HTML и CSS.",
        "Для сложных интерактивных элементов (JS-анимации) используйте внешние CDN-стили через <link rel='stylesheet' href='...'>.",
        "Сохраните блок — HTML отобразится в предпросмотре и на живом сайте.",
      ],
    },
    mockup: (
      <div className="rounded-xl bg-[#0d1117] border border-emerald-500/20 p-4 font-mono text-xs">
        <div className="text-emerald-400/60 mb-2">{"<!-- ZERO_BLOCK -->"}</div>
        <div>
          <span className="text-red-400">{"<div"}</span>
          <span className="text-amber-300">{" style"}</span>
          <span className="text-white">{"="}</span>
          <span className="text-green-400">{"\"color:#7C3AED\""}</span>
          <span className="text-red-400">{">"}</span>
        </div>
        <div className="pl-4 text-white/70">{"  Свободный HTML"}</div>
        <div>
          <span className="text-red-400">{"</div>"}</span>
        </div>
        <div className="mt-2 text-white/20 text-xs">sandbox ✓ — скрипты заблокированы</div>
      </div>
    ),
  },
];

/* ─── SIDEBAR SECTIONS ──────────────────────────────────── */

const SECTIONS = [
  {
    id: "start", Icon: Lightning, label: "Быстрый старт",
    articles: [
      { id: "what-is", title: "Что такое lilluucore?" },
      { id: "first-site", title: "Создайте первый сайт за 5 минут" },
      { id: "business-types", title: "Типы бизнеса" },
      { id: "ai-generation", title: "AI генерация сайтов ✦" },
      { id: "blocks-intro", title: "Введение в блоки" },
      { id: "publish", title: "Как опубликовать сайт" },
    ]
  },
  {
    id: "builder", Icon: Layout, label: "Редактор сайтов",
    articles: [
      { id: "canvas", title: "Холст и рабочая область" },
      { id: "pages", title: "Страницы сайта" },
      { id: "blocks", title: "Типы блоков (24+)" },
      { id: "block-templates", title: "Шаблоны блоков" },
      { id: "header-footer", title: "Шапка и подвал сайта" },
      { id: "shorts-slider", title: "Shorts / Reels слайдер" },
      { id: "grid", title: "Сетка и колонки" },
      { id: "styles", title: "Стили и глобальный дизайн" },
      { id: "elem-animations", title: "Анимации элементов" },
      { id: "rich-text", title: "Редактор текста" },
      { id: "zero-block", title: "Zero Block — свободный холст" },
      { id: "popup", title: "Всплывающие окна (Popup)" },
      { id: "undo-redo", title: "Отмена и возврат действий" },
      { id: "image-upload", title: "Загрузка изображений и видео" },
    ]
  },
  {
    id: "forms-shop", Icon: Package, label: "Формы и магазин",
    articles: [
      { id: "forms", title: "Формы и заявки" },
      { id: "ecommerce", title: "Интернет-магазин и заказы" },
    ]
  },
  {
    id: "domain", Icon: GlobeSimple, label: "Домены и SEO",
    articles: [
      { id: "subdomain", title: "Субдомен .lilluucore.com" },
      { id: "custom-domain", title: "Подключение кастомного домена" },
      { id: "ssl", title: "SSL сертификат" },
      { id: "seo-site", title: "SEO настройки сайта" },
      { id: "seo-global", title: "Глобальный SEO" },
    ]
  },
  {
    id: "analytics", Icon: ChartBar, label: "Аналитика",
    articles: [
      { id: "metrics", title: "Метрики и показатели" },
      { id: "periods", title: "Периоды отчётности" },
      { id: "storage-bar", title: "Хранилище и дамп памяти" },
      { id: "export", title: "Экспорт данных" },
    ]
  },
  {
    id: "security", Icon: ShieldCheck, label: "Профиль и модерация",
    articles: [
      { id: "profile-personal", title: "Личные данные профиля" },
      { id: "password", title: "Смена email и пароля" },
      { id: "profile-appearance", title: "Внешний вид и уведомления" },
      { id: "profile-subscription", title: "Подписка в профиле" },
      { id: "2fa", title: "Двухфакторная аутентификация" },
      { id: "data", title: "Хранение данных (Дамп памяти)" },
      { id: "moderation", title: "Модерация контента" },
      { id: "freeze", title: "Заморозка и удаление сайтов" },
      { id: "notifications", title: "Система уведомлений" },
      { id: "chat-support", title: "Чат с поддержкой" },
      { id: "admin-roles", title: "Роли и права доступа" },
      { id: "admin-users", title: "Управление пользователями" },
      { id: "admin-panel", title: "Панель администратора" },
      { id: "preview", title: "Предпросмотр сайта" },
    ]
  },
  {
    id: "billing", Icon: CreditCard, label: "Тарифы и оплата",
    articles: [
      { id: "plans", title: "Сравнение тарифов" },
      { id: "payment", title: "Способы оплаты" },
      { id: "cancel", title: "Отмена подписки" },
    ]
  },
  {
    id: "devapi", Icon: Code, label: "Для разработчиков",
    articles: [
      { id: "api-overview", title: "Обзор API" },
      { id: "api-auth", title: "Авторизация (JWT)" },
      { id: "api-sites", title: "API: Сайты и блоки" },
      { id: "api-spring", title: "Spring Boot бэкенд" },
      { id: "db-dump", title: "Дамп базы данных" },
      { id: "db-schema", title: "Схема базы данных" },
    ]
  },
];

/* ─── BLOCK ACCORDION COMPONENT ────────────────────────── */

function BlockAccordion({ block }: { block: BlockEntry }) {
  const [open, setOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all ${open ? "border-primary/30 bg-primary/3" : "border-border bg-transparent hover:border-primary/20"}`}>
      <button
        className="w-full flex items-center gap-3 p-4 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${open ? "bg-primary/20" : "bg-transparent"}`}>
          <block.Icon size={18} weight="light" className={open ? "text-primary" : "text-muted-foreground"} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${open ? "text-foreground" : "text-foreground/80"}`}>{block.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${block.catColor}`}>{block.category}</span>
          </div>
        </div>
        <CaretDown size={16} className={`text-muted-foreground transition-transform flex-shrink-0 ${open ? "rotate-180 text-primary" : ""}`} />
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-5 border-t border-border pt-5">
          {/* Description */}
          <p className="text-muted-foreground text-sm leading-relaxed">{block.description}</p>

          {/* Mockup */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-3">Внешний вид</p>
            <div className="docs-mockup rounded-xl overflow-hidden">{block.mockup}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Features */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-3">Возможности</p>
              <ul className="space-y-2">
                {block.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary mt-0.5 flex-shrink-0">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Settings */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-3">Настройки</p>
              <ul className="space-y-2">
                {block.settings.map(s => (
                  <li key={s} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-amber-400/70 mt-0.5 flex-shrink-0">⚙</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Step-by-step guide */}
          {block.guide && (
            <div className="bg-primary/5 border border-primary/15 rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center gap-2 px-4 py-3 text-left"
                onClick={() => setGuideOpen(o => !o)}
              >
                <span className="text-primary text-xs font-bold uppercase tracking-wider">📖 Пошаговый гайд: {block.guide.title}</span>
                <CaretDown size={14} className={`text-primary/60 ml-auto transition-transform ${guideOpen ? "rotate-180" : ""}`} />
              </button>
              {guideOpen && (
                <div className="px-4 pb-4 space-y-2 border-t border-primary/10 pt-4">
                  {block.guide.steps.map((step, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-5 h-5 rounded-md gradient-purple flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
                      <p className={`text-sm ${step.startsWith("<") ? "font-mono text-emerald-400 bg-black/30 px-2 py-1 rounded" : "text-muted-foreground"}`}>{step}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── ARTICLE CONTENT ───────────────────────────────────── */

const CONTENT: Record<string, { title: string; body: React.ReactNode }> = {
  "what-is": {
    title: "Что такое lilluucore?",
    body: (
      <div className="space-y-5">
        <p>lilluucore — это визуальный конструктор сайтов нового поколения в стиле Tilda и Webflow. Создавайте профессиональные сайты без знания программирования с помощью удобного drag-and-drop редактора.</p>

        <div className="bg-primary/6 border border-primary/20 rounded-xl p-4">
          <p className="text-primary font-bold text-sm mb-1">Версия платформы: 3.0</p>
          <p className="text-muted-foreground text-sm">24+ блока, Zero Block, магазин с корзиной, попапы, глобальный дизайн, чат с поддержкой, полноценная админ-панель, Spring Boot бэкенд, дамп БД.</p>
        </div>

        <h3 className="font-bold text-lg text-foreground">Редактор и блоки</h3>
        <ul className="space-y-2">
          {[
            "Drag & drop редактор — добавляйте, перемещайте и настраивайте блоки",
            "24+ типов блоков: Hero, Features, Gallery, Blog, Map, Products и другие",
            "Zero Block — свободный холст с позиционированием, текстом, фигурами и кривыми Безье",
            "Popup-блоки — всплывающие окна с формами, анимацией и триггерами",
            "Многостраничность — несколько страниц в одном сайте",
            "Grid-сетка — колоночные макеты (25%, 33%, 50%, 66%, 75%)",
            "Undo/Redo — отмена и возврат до 30 шагов (Ctrl+Z / Ctrl+Y)",
          ].map(f => (
            <li key={f} className="flex items-start gap-2"><span className="text-primary mt-1">✓</span><span className="text-muted-foreground">{f}</span></li>
          ))}
        </ul>

        <h3 className="font-bold text-lg text-foreground">Дизайн и стили</h3>
        <ul className="space-y-2">
          {[
            "Глобальная система дизайна — акцентный цвет, фон и шрифт для всего сайта",
            "6 шрифтов на выбор (Inter, Roboto, Montserrat, Playfair, Oswald, System)",
            "Анимации появления блоков (fade-up, zoom-in, fade-left и другие)",
            "Настройка скругления углов, прозрачности и минимальной высоты каждого блока",
            "Загрузка изображений напрямую в хранилище (JPG, PNG, WebP до 10 МБ)",
          ].map(f => (
            <li key={f} className="flex items-start gap-2"><span className="text-violet-400 mt-1">✓</span><span className="text-muted-foreground">{f}</span></li>
          ))}
        </ul>

        <h3 className="font-bold text-lg text-foreground">Бизнес-функции</h3>
        <ul className="space-y-2">
          {[
            "Интернет-магазин — каталог товаров, корзина, оформление заказа",
            "Формы и заявки — конструктор форм, приём заявок, просмотр в дашборде",
            "Аналитика — просмотры, уникальные посетители, клики, среднее время на сайте",
            "Публикация на домене *.lilluucore.com за 30 секунд",
            "Кастомные домены + SSL (Pro и Business)",
            "SEO-настройки для каждой страницы",
          ].map(f => (
            <li key={f} className="flex items-start gap-2"><span className="text-emerald-400 mt-1">✓</span><span className="text-muted-foreground">{f}</span></li>
          ))}
        </ul>

        <h3 className="font-bold text-lg text-foreground">Для кого подходит?</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { Icon: Rocket, color: "text-violet-400", t: "Стартапы", d: "Быстрый запуск лендинга и тест гипотез" },
            { Icon: ShoppingBag, color: "text-blue-400", t: "Магазины", d: "Каталог товаров, корзина, заказы" },
            { Icon: MusicNotes, color: "text-pink-400", t: "Музыканты", d: "Дискография, расписание, плеер" },
            { Icon: Barbell, color: "text-emerald-400", t: "Фитнес", d: "Расписание занятий, тренеры, запись" },
          ].map(c => (
            <div key={c.t} className="glass border border-border rounded-xl p-3">
              <c.Icon size={24} weight="light" className={`${c.color} mb-2`} />
              <p className="text-foreground font-semibold text-sm">{c.t}</p>
              <p className="text-muted-foreground text-xs">{c.d}</p>
            </div>
          ))}
        </div>
      </div>
    )
  },
  "first-site": {
    title: "Создайте первый сайт за 5 минут",
    body: (
      <div className="space-y-4">
        <p>Следуйте этим шагам, чтобы создать и опубликовать свой первый сайт:</p>
        {[
          { n: "1", t: "Зарегистрируйтесь", d: "Перейдите на главную страницу и нажмите «Начать бесплатно». Заполните форму: имя, email, пароль." },
          { n: "2", t: "Создайте новый сайт", d: "На Дашборде нажмите «+ Новый сайт». Введите название, выберите субдомен (например, my-site) и тип бизнеса." },
          { n: "3", t: "Добавляйте блоки", d: "В редакторе нажимайте на блоки в левой панели, чтобы добавлять их на страницу. Попробуйте добавить Hero, Features и CTA." },
          { n: "4", t: "Редактируйте контент", d: "Кликните на блок, чтобы выделить его. Справа появится панель редактирования с полями заголовка, текста и кнопок." },
          { n: "5", t: "Опубликуйте", d: "Когда сайт готов, нажмите кнопку «Опубликовать» в верхней панели. Сайт станет доступен по адресу your-site.lilluucore.com" },
        ].map(step => (
          <div key={step.n} className="flex gap-4 p-4 glass rounded-xl border border-border">
            <div className="gradient-purple w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">{step.n}</div>
            <div><p className="text-foreground font-semibold">{step.t}</p><p className="text-muted-foreground text-sm mt-0.5">{step.d}</p></div>
          </div>
        ))}
      </div>
    )
  },
  "business-types": {
    title: "Типы бизнеса",
    body: (
      <div className="space-y-5">
        <p>При создании нового сайта нужно выбрать тип бизнеса. Это влияет на иконку сайта в дашборде и набор рекомендуемых блоков.</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { Icon: Rocket, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20", t: "Лендинг", v: "LANDING", d: "Универсальный одностраничник. Подходит для стартапов, промо-акций, портфолио, презентаций продуктов и услуг." },
            { Icon: ShoppingBag, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", t: "Интернет-магазин", v: "ECOMMERCE", d: "Сайт с каталогом товаров, корзиной и оформлением заказа. Автоматически получает блок Products и корзину в предпросмотре." },
            { Icon: MusicNotes, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20", t: "Музыкальный лейбл", v: "MUSIC_LABEL", d: "Для исполнителей, групп и лейблов. Доступны блоки Discography, Music Player и Shorts Slider для вертикального видео." },
            { Icon: Barbell, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", t: "Фитнес", v: "FITNESS", d: "Для фитнес-клубов, тренеров и студий. Включает блоки Schedule (расписание занятий) и Coaches (карточки тренеров)." },
          ].map(bt => (
            <div key={bt.v} className={`glass border rounded-2xl p-5 ${bt.bg}`}>
              <bt.Icon size={28} weight="light" className={`${bt.color} mb-3`} />
              <p className="text-foreground font-bold text-sm mb-0.5">{bt.t}</p>
              <code className={`text-xs font-mono ${bt.color} opacity-70`}>{bt.v}</code>
              <p className="text-muted-foreground text-xs mt-2 leading-relaxed">{bt.d}</p>
            </div>
          ))}
        </div>
        <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-4">
          <p className="text-amber-400 font-semibold text-sm mb-1">Изменение типа бизнеса</p>
          <p className="text-muted-foreground text-sm">Тип бизнеса выбирается при создании сайта и не влияет на список доступных блоков — все блоки доступны для всех типов. Тип определяет только иконку на карточке в дашборде.</p>
        </div>
      </div>
    )
  },
  "ai-generation": {
    title: "AI генерация сайтов",
    body: (
      <div className="space-y-5">
        <div className="bg-primary/8 border border-primary/25 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">✦</span>
            <p className="text-primary font-bold">Флагманская функция lilluucore</p>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">ИИ на основе GPT-4o анализирует скриншот или живой сайт по URL и автоматически генерирует готовый набор блоков для вашего нового сайта. Всё — за несколько секунд.</p>
        </div>

        <h3 className="font-bold text-foreground">Два режима генерации</h3>
        <div className="grid grid-cols-1 gap-3">
          {[
            { t: "Из скриншота", d: "Загрузите изображение любого сайта (JPG, PNG, WebP, до 10 МБ). AI анализирует структуру, стиль и контент на скриншоте, затем генерирует подходящий набор блоков с текстами." },
            { t: "Из URL сайта", d: "Вставьте адрес любого существующего сайта. Система автоматически делает скриншот страницы через сервис thum.io и показывает живой предпросмотр, пока идёт генерация. Скриншот обновляется через 1 секунду после ввода URL." },
          ].map(m => (
            <div key={m.t} className="glass border border-primary/20 rounded-xl p-4 bg-primary/3">
              <p className="text-foreground font-semibold text-sm mb-1">{m.t}</p>
              <p className="text-muted-foreground text-sm">{m.d}</p>
            </div>
          ))}
        </div>

        <h3 className="font-bold text-foreground">Пошаговый процесс</h3>
        {[
          { n: "1", t: "Нажмите «AI из скриншота»", d: "Кнопка с иконкой ✦ в верхнем правом углу раздела «Мои сайты» на дашборде. При достижении лимита сайтов предложит перейти на другой тариф." },
          { n: "2", t: "Выберите режим и загрузите материал", d: "Переключитесь между вкладками «Из скриншота» и «Из URL». Загрузите изображение или вставьте URL — в режиме URL вы увидите живой превью целевого сайта." },
          { n: "3", t: "Дождитесь анализа", d: "GPT-4o анализирует изображение и возвращает структурированный список блоков с контентом. Прогресс-статус обновляется в реальном времени: «Анализирую скриншот...», «Генерирую блоки...»." },
          { n: "4", t: "Отредактируйте список блоков", d: "На шаге «Предпросмотр» вы видите предложенные блоки (тип + описание). Можно удалить лишние нажатием ×. Порядок блоков соответствует структуре сайта." },
          { n: "5", t: "Введите название и создайте сайт", d: "AI предлагает название сайта автоматически. Вы можете его изменить. Нажмите «Создать сайт» — и через секунду откроется редактор с уже заполненными блоками." },
        ].map(step => (
          <div key={step.n} className="flex gap-4 p-4 glass rounded-xl border border-border">
            <div className="gradient-purple w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">{step.n}</div>
            <div><p className="text-foreground font-semibold">{step.t}</p><p className="text-muted-foreground text-sm mt-0.5">{step.d}</p></div>
          </div>
        ))}

        <h3 className="font-bold text-foreground">AI в редакторе</h3>
        <p className="text-muted-foreground text-sm">Функция AI генерации доступна не только с дашборда, но и прямо из редактора — кнопка «AI» в верхней панели редактора. Это позволяет добавить AI-сгенерированные блоки в уже существующий сайт.</p>

        <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-4">
          <p className="text-emerald-400 font-semibold text-sm mb-2">Качество результата</p>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li className="flex gap-2"><span className="text-emerald-400">✓</span>AI заполняет реальным текстом, адаптированным под тип сайта</li>
            <li className="flex gap-2"><span className="text-emerald-400">✓</span>Структура блоков соответствует иерархии оригинального сайта</li>
            <li className="flex gap-2"><span className="text-emerald-400">✓</span>Генерируется от 4 до 10 блоков в зависимости от сложности</li>
            <li className="flex gap-2"><span className="text-amber-400">→</span>Результат можно полностью отредактировать в конструкторе</li>
          </ul>
        </div>
      </div>
    )
  },
  "blocks-intro": {
    title: "Введение в блоки",
    body: (
      <div className="space-y-4">
        <p>Блок — это основная единица содержимого вашего сайта. Каждый блок выполняет определённую функцию и настраивается независимо. Нажмите на блок ниже, чтобы раскрыть подробное описание, возможности, настройки и пошаговые гайды.</p>
        <div className="flex flex-wrap gap-2 pb-2">
          {["Основные", "Контент", "Маркетинг", "Команда", "Медиа", "Бизнес", "Продвинутые"].map(cat => (
            <span key={cat} className="text-xs px-2.5 py-1 rounded-full bg-secondary/60 text-muted-foreground border border-border">{cat}</span>
          ))}
        </div>
        <div className="space-y-2">
          {BLOCKS.map(block => <BlockAccordion key={block.key} block={block} />)}
        </div>
      </div>
    )
  },
  "grid": {
    title: "Сетка и колонки",
    body: (
      <div className="space-y-4">
        <p>lilluucore поддерживает многоколоночный макет. Вы можете размещать блоки в одну строку, создавая сетку из 2, 3 или 4 колонок.</p>
        <h3 className="font-bold text-foreground">Как создать строку с колонками</h3>
        <ol className="space-y-2 list-decimal list-inside text-muted-foreground">
          <li>Добавьте первый блок в редакторе</li>
          <li>Выделите его (нажав на него)</li>
          <li>В правой панели нажмите «+ Добавить колонку» — появится новый блок в той же строке</li>
          <li>Настройте ширину каждого блока: 25%, 33%, 50%, 66%, 75% или 100%</li>
        </ol>
        <div className="bg-secondary/40 rounded-xl p-4 border border-border">
          <p className="text-foreground font-semibold text-sm mb-2">Пример: 3-колоночный макет</p>
          <div className="flex gap-2">
            <div className="flex-1 bg-primary/10 border border-primary/20 rounded-lg p-2 text-center text-xs text-primary">33%</div>
            <div className="flex-1 bg-primary/10 border border-primary/20 rounded-lg p-2 text-center text-xs text-primary">33%</div>
            <div className="flex-1 bg-primary/10 border border-primary/20 rounded-lg p-2 text-center text-xs text-primary">33%</div>
          </div>
        </div>
      </div>
    )
  },
  "pages": {
    title: "Страницы сайта",
    body: (
      <div className="space-y-4">
        <p>Каждый сайт может содержать несколько страниц. По умолчанию создаётся страница «Главная».</p>
        <h3 className="font-bold text-foreground">Управление страницами</h3>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex gap-2"><span className="text-primary">→</span> В редакторе откройте панель «Страницы» (иконка в левом меню)</li>
          <li className="flex gap-2"><span className="text-primary">→</span> Нажмите «+ Страница» для добавления новой</li>
          <li className="flex gap-2"><span className="text-primary">→</span> Дважды кликните на название для переименования</li>
          <li className="flex gap-2"><span className="text-primary">→</span> Задайте slug (URL путь): /about, /contacts и т.д.</li>
        </ul>
        <p>Лимит страниц: Free — 3 страницы, Pro — 20 страниц, Business — без ограничений.</p>
      </div>
    )
  },
  "subdomain": {
    title: "Субдомен .lilluucore.com",
    body: (
      <div className="space-y-4">
        <p>Каждый сайт получает уникальный адрес в формате <code className="bg-secondary px-2 py-0.5 rounded text-primary font-mono text-sm">your-site.lilluucore.com</code></p>
        <p>Субдомен задаётся при создании сайта и не может быть изменён после публикации.</p>
        <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-4">
          <p className="text-amber-400 font-semibold text-sm">Правила выбора субдомена</p>
          <ul className="text-muted-foreground text-sm mt-2 space-y-1">
            <li>• Только латинские буквы, цифры и дефис</li>
            <li>• От 3 до 32 символов</li>
            <li>• Не может начинаться или заканчиваться дефисом</li>
            <li>• Должен быть уникальным в системе</li>
          </ul>
        </div>
      </div>
    )
  },
  "plans": {
    title: "Сравнение тарифов",
    body: (
      <div className="space-y-4">
        <p>lilluucore предлагает три тарифных плана для разных потребностей.</p>
        <div className="space-y-3">
          {[
            { name: "Free — $0/мес", features: ["1 сайт", "3 страницы на сайт", "5 блоков на страницу", "Домен *.lilluucore.com", "Аналитика за 7 дней", "Email поддержка", "500 МБ хранилище"] },
            { name: "Pro — $19/мес", features: ["10 сайтов", "20 страниц на сайт", "Неограниченно блоков", "Кастомный домен", "Аналитика за 90 дней", "Приоритетная поддержка", "10 ГБ хранилище", "Загрузка изображений", "Экспорт данных"] },
            { name: "Business — $49/мес", features: ["Неограниченно сайтов", "Неограниченно страниц", "Неограниченно блоков", "Кастомный домен + SSL", "Аналитика за 1 год", "Выделенная поддержка 24/7", "100 ГБ хранилище", "API доступ", "White Label", "До 5 участников команды"] },
          ].map(plan => (
            <div key={plan.name} className="glass border border-border rounded-xl p-4">
              <p className="text-foreground font-bold mb-2">{plan.name}</p>
              <div className="grid grid-cols-2 gap-1">
                {plan.features.map(f => <p key={f} className="text-muted-foreground text-xs">✓ {f}</p>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  },
  "metrics": {
    title: "Метрики и показатели",
    body: (
      <div className="space-y-4">
        <p>Раздел Аналитика на Дашборде показывает ключевые метрики эффективности ваших сайтов.</p>
        {[
          { t: "Просмотры", d: "Общее количество загрузок страниц. Один пользователь может создать несколько просмотров за сессию." },
          { t: "Уникальные посетители", d: "Количество отдельных пользователей, определяемых по IP-адресу и параметрам браузера." },
          { t: "Клики", d: "Количество кликов по кнопкам и интерактивным элементам на ваших страницах." },
          { t: "Новые регистрации", d: "Пользователи, заполнившие форму регистрации на вашем сайте за выбранный период." },
          { t: "Среднее время на сайте", d: "Среднее время, которое посетитель проводит на сайте в минутах и секундах." },
          { t: "Процент отказов", d: "Доля посетителей, покинувших сайт после просмотра одной страницы. Чем ниже — тем лучше." },
        ].map(m => (
          <div key={m.t} className="glass border border-border rounded-xl p-4">
            <p className="text-foreground font-semibold text-sm">{m.t}</p>
            <p className="text-muted-foreground text-sm mt-1">{m.d}</p>
          </div>
        ))}
      </div>
    )
  },
  "periods": {
    title: "Периоды отчётности",
    body: (
      <div className="space-y-4">
        <p>Аналитика на дашборде фильтруется по периодам. Переключатель периода находится в правом верхнем углу раздела «Аналитика».</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { period: "7 дней", desc: "Последние 7 суток. Полезно для мониторинга свежих публикаций и оценки текущей активности." },
            { period: "30 дней", desc: "Последний месяц. Основной рабочий период для анализа трафика и конверсий." },
            { period: "90 дней", desc: "Квартальная динамика. Позволяет отследить сезонность и долгосрочные тренды." },
          ].map(p => (
            <div key={p.period} className="glass border border-primary/20 rounded-xl p-4 text-center">
              <p className="text-primary font-black text-2xl mb-1">{p.period}</p>
              <p className="text-muted-foreground text-xs">{p.desc}</p>
            </div>
          ))}
        </div>
        <h3 className="font-bold text-foreground">График динамики</h3>
        <p className="text-muted-foreground text-sm">Под карточками метрик отображается area-chart с тремя линиями: <span className="text-violet-400">Просмотры</span>, <span className="text-pink-400">Клики</span>, <span className="text-blue-400">Посетители</span>. Данные агрегированы по всем сайтам аккаунта за выбранный период. Наведите курсор на точку на графике, чтобы увидеть точные значения за конкретный день.</p>
        <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-4">
          <p className="text-amber-400 font-semibold text-sm mb-1">Глубина аналитики по тарифам</p>
          <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mt-2">
            <div><span className="text-gray-400 font-bold block mb-1">Free</span>7 дней</div>
            <div><span className="text-purple-400 font-bold block mb-1">Pro</span>90 дней</div>
            <div><span className="text-amber-400 font-bold block mb-1">Business</span>1 год</div>
          </div>
        </div>
      </div>
    )
  },
  "storage-bar": {
    title: "Хранилище и дамп памяти",
    body: (
      <div className="space-y-4">
        <p>На дашборде под графиком аналитики отображается индикатор использования хранилища — <strong className="text-foreground">Дамп памяти</strong>.</p>
        <div className="glass border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-foreground font-semibold text-sm">Дамп памяти</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>18 МБ использовано</span>
            <span>из 512 МБ</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden mb-2">
            <div className="h-full gradient-purple rounded-full" style={{ width: "3.5%" }} />
          </div>
          <span className="text-xs text-green-400">✓ 97% свободно</span>
        </div>
        <h3 className="font-bold text-foreground">Что входит в хранилище</h3>
        {[
          { t: "База данных (PostgreSQL)", d: "Сайты, блоки, страницы, форма-заявки, настройки — всё это хранится в БД." },
          { t: "Медиафайлы", d: "Загруженные изображения и видео сохраняются в объектном хранилище." },
          { t: "Параметры", d: "dbUsedMb / dbTotalMb — показывают использование выделенной квоты. При превышении лимита новые данные перестают записываться." },
        ].map(f => (
          <div key={f.t} className="glass border border-border rounded-xl p-4">
            <p className="text-foreground font-semibold text-sm">{f.t}</p>
            <p className="text-muted-foreground text-sm mt-1">{f.d}</p>
          </div>
        ))}
        <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-4">
          <p className="text-amber-400 font-semibold text-sm mb-1">Лимиты хранилища по тарифам</p>
          <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mt-2">
            <div><span className="text-gray-400 font-bold block mb-1">Free</span>512 МБ</div>
            <div><span className="text-purple-400 font-bold block mb-1">Pro</span>10 ГБ</div>
            <div><span className="text-amber-400 font-bold block mb-1">Business</span>100 ГБ</div>
          </div>
        </div>
      </div>
    )
  },
  "2fa": {
    title: "Двухфакторная аутентификация",
    body: (
      <div className="space-y-4">
        <p>2FA добавляет дополнительный уровень защиты вашего аккаунта. При каждом входе вам потребуется вводить одноразовый код.</p>
        <h3 className="font-bold text-foreground">Как включить 2FA</h3>
        <ol className="space-y-2 list-decimal list-inside text-muted-foreground">
          <li>Перейдите в Профиль → Двухфакторная</li>
          <li>Нажмите «Отправить код»</li>
          <li>Введите 6-значный код, полученный на email</li>
          <li>2FA активирована</li>
        </ol>
        <div className="bg-green-500/8 border border-green-500/20 rounded-xl p-4 text-sm text-muted-foreground">
          <p className="text-green-400 font-semibold mb-1">Рекомендация</p>
          Включите 2FA, если у вас есть сайты с активной аудиторией. Это защитит их от несанкционированного доступа.
        </div>
      </div>
    )
  },
  "publish": {
    title: "Как опубликовать сайт",
    body: (
      <div className="space-y-4">
        <p>Публикация сайта делает его доступным в интернете по вашему субдомену. Это займёт не более 30 секунд.</p>
        <h3 className="font-bold text-foreground">Шаги публикации</h3>
        {[
          { n: "1", t: "Откройте редактор", d: "Перейдите в нужный сайт с Дашборда." },
          { n: "2", t: "Нажмите «Опубликовать»", d: "Кнопка находится в верхней панели редактора справа. Нажмите её." },
          { n: "3", t: "Подтвердите публикацию", d: "В появившемся диалоге нажмите «Опубликовать сейчас»." },
          { n: "4", t: "Откройте сайт", d: "После публикации появится ссылка вида your-site.lilluucore.com — нажмите на неё, чтобы открыть сайт." },
        ].map(step => (
          <div key={step.n} className="flex gap-4 p-4 glass rounded-xl border border-border">
            <div className="gradient-purple w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">{step.n}</div>
            <div><p className="text-foreground font-semibold">{step.t}</p><p className="text-muted-foreground text-sm mt-0.5">{step.d}</p></div>
          </div>
        ))}
        <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-4">
          <p className="text-amber-400 font-semibold text-sm">Важно</p>
          <p className="text-muted-foreground text-sm mt-1">Повторно нажмите «Опубликовать» после каждого изменения, чтобы обновить живую версию сайта.</p>
        </div>
      </div>
    )
  },
  "canvas": {
    title: "Холст и рабочая область",
    body: (
      <div className="space-y-4">
        <p>Редактор lilluucore состоит из трёх зон: левая панель, холст и правая панель настроек.</p>
        {[
          { t: "Левая панель", d: "Список доступных блоков по категориям: основные, контент, маркетинг, медиа, бизнес, продвинутые. Нажмите на блок, чтобы добавить его на страницу." },
          { t: "Холст (центр)", d: "Рабочая область сайта. Блоки располагаются вертикально. Нажмите на блок, чтобы выделить его и открыть настройки справа. Перетаскивайте блоки для изменения порядка." },
          { t: "Правая панель", d: "Настройки выделенного блока: заголовок, текст, цвета, ссылки, изображения, стили (скругление, прозрачность, анимация, высота, якорь)." },
          { t: "Верхняя панель", d: "Содержит: кнопку «Опубликовать», режим просмотра (Desktop/Tablet/Mobile), кнопку «Предпросмотр», кнопки отмены/возврата (Ctrl+Z / Ctrl+Y), SEO-настройки и настройки сайта." },
          { t: "Вкладки страниц", d: "Вверху холста отображаются вкладки страниц сайта. Нажмите «+», чтобы добавить новую страницу. Переключайтесь между страницами одним кликом." },
          { t: "Undo / Redo", d: "Стрелки ↩ ↪ в тулбаре (или Ctrl+Z / Ctrl+Y) отменяют и возвращают последние 30 действий: добавление, удаление, перемещение и сохранение блоков." },
        ].map(item => (
          <div key={item.t} className="glass border border-border rounded-xl p-4">
            <p className="text-foreground font-semibold text-sm">{item.t}</p>
            <p className="text-muted-foreground text-sm mt-1">{item.d}</p>
          </div>
        ))}
        <div className="bg-primary/6 border border-primary/20 rounded-xl p-4">
          <p className="text-primary font-semibold text-sm mb-2">Горячие клавиши</p>
          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            {[["Ctrl+Z", "Отменить действие"], ["Ctrl+Y", "Вернуть действие"], ["Ctrl+Shift+Z", "Вернуть (альтернатива)"], ["Delete", "Удалить выделенный элемент (Zero Block)"]].map(([k, v]) => (
              <div key={k} className="flex gap-2 items-center">
                <code className="bg-black/30 text-primary px-2 py-0.5 rounded font-mono text-xs">{k}</code>
                <span className="text-xs">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  },
  "blocks": {
    title: "Типы блоков (24+)",
    body: (
      <div className="space-y-4">
        <p>В lilluucore доступно 24 типа блоков, разделённых по категориям. Нажмите блок в левой панели редактора — он мгновенно добавится на страницу.</p>
        {[
          { cat: "Основные", color: "text-violet-400", items: [
            "Hero — главный экран: заголовок H1, подзаголовок, CTA-кнопка, фоновое фото/видео",
            "Header Menu — навигация с логотипом, пунктами меню и CTA",
            "Footer — подвал с колонками, контактами, ссылками и копирайтом",
          ]},
          { cat: "Контент", color: "text-blue-400", items: [
            "Features — список преимуществ с иконками Font Awesome и описаниями",
            "Stats — числовые показатели крупным шрифтом с подписями",
            "Text — свободный текстовый блок с HTML-контентом",
            "Gallery — фотогалерея с сеткой изображений и подписями",
            "Blog — карточки статей с обложкой, заголовком, датой и текстом",
          ]},
          { cat: "Маркетинг", color: "text-pink-400", items: [
            "Testimonials — отзывы клиентов с аватаром, именем и текстом",
            "FAQ — аккордеон часто задаваемых вопросов",
            "CTA — призыв к действию с заголовком и кнопкой",
            "Pricing — таблица тарифов с колонками и списком фич",
            "Popup — всплывающее окно с формой, анимацией и триггером",
          ]},
          { cat: "Команда", color: "text-cyan-400", items: [
            "Team — карточки участников команды с фото, должностью и соцсетями",
            "Coaches — карточки тренеров/специалистов",
          ]},
          { cat: "Медиа", color: "text-amber-400", items: [
            "Video — встроенное видео (YouTube, Vimeo) с настройкой постера",
            "Music Player — плеер треков с обложкой и описанием",
            "Discography — альбомы и релизы с треклистом",
          ]},
          { cat: "Бизнес", color: "text-emerald-400", items: [
            "Products / Catalog — карточки товаров с фото, ценой, кнопкой «В корзину»",
            "Schedule — расписание занятий по дням недели",
            "Contacts — форма обратной связи с конструктором полей",
            "Form — универсальная форма с произвольными полями",
            "Blog — статьи и новости с превью-карточками",
            "Map — встроенная карта (Яндекс/Google) с адресом и маркером",
          ]},
          { cat: "Продвинутые", color: "text-rose-400", items: [
            "Zero Block — свободный холст: произвольное позиционирование элементов, кривые Безье, текст, прямоугольники, эллипсы",
          ]},
        ].map(cat => (
          <div key={cat.cat} className="glass border border-border rounded-xl p-4">
            <p className={`font-bold text-sm mb-2 ${cat.color}`}>{cat.cat}</p>
            <ul className="space-y-1">{cat.items.map(i => <li key={i} className="text-muted-foreground text-sm flex gap-2"><span className="text-primary">•</span>{i}</li>)}</ul>
          </div>
        ))}
        <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-4">
          <p className="text-amber-400 font-semibold text-sm mb-1">Лимиты по тарифам</p>
          <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
            <div><span className="text-gray-400 font-bold">Free</span><br/>5 блоков на страницу</div>
            <div><span className="text-purple-400 font-bold">Pro</span><br/>Без ограничений</div>
            <div><span className="text-amber-400 font-bold">Business</span><br/>Без ограничений</div>
          </div>
        </div>
      </div>
    )
  },
  "styles": {
    title: "Стили и глобальный дизайн",
    body: (
      <div className="space-y-5">
        <p>lilluucore предлагает два уровня стилизации: глобальный дизайн всего сайта и индивидуальные настройки каждого блока.</p>

        <h3 className="font-bold text-foreground">Глобальная система дизайна</h3>
        <p className="text-muted-foreground text-sm">Откройте настройки сайта (кнопка SEO в тулбаре) → вкладка «Дизайн». Настройки применяются ко всем блокам сразу через CSS Custom Properties.</p>
        {[
          { t: "Акцентный цвет", d: "Color picker + 8 предустановок. Автоматически перекрашивает все кнопки, ссылки и бейджи на сайте. Хранится как CSS-переменная --site-primary." },
          { t: "Цвет фона сайта", d: "Color picker + 8 тёмных/светлых пресетов. Устанавливает фон всей страницы в предпросмотре." },
          { t: "Шрифт сайта", d: "6 вариантов: Inter, Roboto, Montserrat, Playfair Display, Oswald, System UI. Загружается из Google Fonts динамически." },
          { t: "Мини-превью", d: "В модальном окне настроек есть мини-превью, которое моментально показывает результат применённых токенов дизайна." },
        ].map(item => (
          <div key={item.t} className="glass border border-border rounded-xl p-4">
            <p className="text-foreground font-semibold text-sm">{item.t}</p>
            <p className="text-muted-foreground text-sm mt-1">{item.d}</p>
          </div>
        ))}

        <h3 className="font-bold text-foreground">Стили отдельных блоков</h3>
        {[
          { t: "Цвет фона блока", d: "HEX-код цвета фона конкретного блока. Переопределяет глобальный фон." },
          { t: "Фоновое изображение", d: "URL изображения или загруженный файл. Блок покрывает изображение с тёмным оверлеем для читаемости текста." },
          { t: "Цвет заголовка и текста", d: "Поля «Цвет текста» и «Цвет заголовка» для каждого блока независимо." },
          { t: "Скругление углов", d: "Слайдер от 0 до 32px. Применяется к контейнеру блока." },
          { t: "Прозрачность", d: "Слайдер от 20% до 100%. Полезно для overlay-эффектов." },
          { t: "Минимальная высота", d: "Авто, 300px, 500px или 100vh (полный экран)." },
          { t: "Анимация появления", d: "fade-up, fade-down, fade-left, fade-right, zoom-in. Срабатывает при прокрутке через IntersectionObserver." },
          { t: "Якорь (Anchor ID)", d: "Задайте ID блока (например «features»), и на него можно будет ссылаться как #features из пунктов меню Header." },
          { t: "Ширина в строке", d: "При многоколоночном макете — 25%, 33%, 50%, 66%, 75%, 100%." },
        ].map(item => (
          <div key={item.t} className="glass border border-border rounded-xl p-4">
            <p className="text-foreground font-semibold text-sm">{item.t}</p>
            <p className="text-muted-foreground text-sm mt-1">{item.d}</p>
          </div>
        ))}
      </div>
    )
  },
  "custom-domain": {
    title: "Подключение кастомного домена",
    body: (
      <div className="space-y-4">
        <p>Кастомные домены доступны на тарифе <span className="text-primary font-semibold">Pro и выше</span>.</p>
        <h3 className="font-bold text-foreground">Как подключить домен</h3>
        {[
          { n: "1", t: "Купите домен", d: "Приобретите домен у любого регистратора (REG.RU, NIC.RU, Namecheap и т.д.)." },
          { n: "2", t: "Укажите домен в настройках", d: "В редакторе перейдите в «Настройки сайта» и введите ваш домен, например example.com." },
          { n: "3", t: "Настройте DNS", d: "В панели управления доменом добавьте CNAME-запись: @ → cname.lilluucore.com" },
          { n: "4", t: "Подождите распространения", d: "DNS обновляется в течение 1–24 часов. После этого ваш сайт будет доступен по кастомному домену." },
        ].map(step => (
          <div key={step.n} className="flex gap-4 p-4 glass rounded-xl border border-border">
            <div className="gradient-purple w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">{step.n}</div>
            <div><p className="text-foreground font-semibold">{step.t}</p><p className="text-muted-foreground text-sm mt-0.5">{step.d}</p></div>
          </div>
        ))}
      </div>
    )
  },
  "ssl": {
    title: "SSL сертификат",
    body: (
      <div className="space-y-4">
        <p>Все сайты на lilluucore автоматически получают SSL-сертификат и работают по протоколу <span className="text-green-400 font-mono">https://</span>.</p>
        <div className="bg-green-500/8 border border-green-500/20 rounded-xl p-4">
          <p className="text-green-400 font-semibold text-sm">✓ SSL включён по умолчанию</p>
          <p className="text-muted-foreground text-sm mt-1">Для субдоменов *.lilluucore.com SSL активируется автоматически. Для кастомных доменов — в течение 30 минут после успешного подключения DNS.</p>
        </div>
        {[
          { t: "Wildcard SSL", d: "Покрывает все поддомены *.lilluucore.com. Входит в базовую стоимость." },
          { t: "Кастомный SSL", d: "Для ваших собственных доменов (Pro и выше). Автоматически обновляется каждые 90 дней." },
          { t: "HSTS", d: "HTTP Strict Transport Security включён для всех сайтов — защищает от атак типа downgrade." },
        ].map(item => (
          <div key={item.t} className="glass border border-border rounded-xl p-4">
            <p className="text-foreground font-semibold text-sm">{item.t}</p>
            <p className="text-muted-foreground text-sm mt-1">{item.d}</p>
          </div>
        ))}
      </div>
    )
  },
  "export": {
    title: "Экспорт данных",
    body: (
      <div className="space-y-4">
        <p>Экспорт аналитики доступен на тарифе <span className="text-primary font-semibold">Pro и выше</span>.</p>
        <div className="glass border border-border rounded-xl p-4">
          <p className="text-foreground font-semibold mb-2">Доступные форматы</p>
          <div className="grid grid-cols-2 gap-2">
            {["CSV — таблицы для Excel/Google Sheets", "JSON — для разработчиков и API", "PDF — готовые отчёты с графиками", "PNG — скриншоты графиков"].map(f => (
              <p key={f} className="text-muted-foreground text-sm flex gap-2"><span className="text-primary">✓</span>{f}</p>
            ))}
          </div>
        </div>
        <p className="text-muted-foreground text-sm">Для экспорта перейдите в Аналитика → выберите период → нажмите кнопку «Экспорт» в правом верхнем углу.</p>
      </div>
    )
  },
  "seo-site": {
    title: "SEO настройки сайта",
    body: (
      <div className="space-y-5">
        <p>Каждый сайт имеет индивидуальные SEO-настройки, которые влияют на отображение страницы в поисковых системах и при шаринге в социальных сетях.</p>

        <h3 className="font-bold text-foreground">Как открыть SEO-настройки сайта</h3>
        <p className="text-muted-foreground text-sm">На дашборде в карточке каждого сайта есть кнопка <strong className="text-foreground">SEO</strong> внизу карточки. Кнопка подсвечивается зелёным (SEO ✓), если настройки уже заполнены.</p>

        <h3 className="font-bold text-foreground">Доступные поля</h3>
        {[
          { t: "SEO Title (seoTitle)", d: "Заголовок страницы для поисковиков. Отображается в вкладке браузера и в сниппете Google. Рекомендуется 50–60 символов." },
          { t: "SEO Description (seoDesc)", d: "Мета-описание страницы. Отображается под заголовком в результатах поиска. Рекомендуется 120–160 символов." },
          { t: "Ключевые слова (seoKeywords)", d: "Meta Keywords через запятую. Используется рядом поисковиков, хотя Google их игнорирует. Помогает структурировать семантику." },
          { t: "Favicon (favicon)", d: "URL иконки сайта 32×32px (ICO или PNG). Отображается во вкладке браузера и в закладках. Загрузите в хранилище и вставьте URL." },
          { t: "OG Image (ogImage)", d: "Изображение для Open Graph (1200×630px). Отображается при шаринге сайта в VK, Telegram, Facebook, Twitter. Загрузите JPG/PNG через кнопку загрузки." },
        ].map(f => (
          <div key={f.t} className="glass border border-border rounded-xl p-4">
            <p className="text-foreground font-semibold text-sm">{f.t}</p>
            <p className="text-muted-foreground text-sm mt-1">{f.d}</p>
          </div>
        ))}

        <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-4">
          <p className="text-emerald-400 font-semibold text-sm mb-1">Индикатор заполненности</p>
          <p className="text-muted-foreground text-sm">Когда seoTitle и seoDesc заполнены, кнопка «SEO» на карточке становится зелёной с галочкой — так удобно отслеживать, для каких сайтов SEO ещё не настроено.</p>
        </div>
      </div>
    )
  },
  "seo-global": {
    title: "Глобальный SEO",
    body: (
      <div className="space-y-5">
        <p><strong className="text-foreground">Глобальный SEO</strong> — настройки, которые применяются ко всей платформе как дефолтные значения, когда у конкретного сайта нет своих SEO-настроек.</p>

        <h3 className="font-bold text-foreground">Как открыть</h3>
        <p className="text-muted-foreground text-sm">На дашборде, рядом с переключателем периода аналитики, есть кнопка <strong className="text-foreground">Глобальный SEO</strong> (иконка шестерёнки). Доступна всем пользователям для настройки своего аккаунта.</p>

        <h3 className="font-bold text-foreground">Настройки</h3>
        {[
          { t: "Глобальный заголовок", d: "Дефолтный title страницы, если у сайта не задан собственный seoTitle. Обычно — название бренда или компании." },
          { t: "Глобальное описание", d: "Дефолтный мета-description для страниц без индивидуального seoDesc." },
          { t: "Глобальный favicon", d: "Иконка, используемая по умолчанию для всех сайтов, у которых не задан собственный favicon." },
          { t: "Глобальный OG Image", d: "Open Graph изображение по умолчанию для социального шаринга (при отсутствии индивидуального ogImage)." },
        ].map(f => (
          <div key={f.t} className="glass border border-border rounded-xl p-4">
            <p className="text-foreground font-semibold text-sm">{f.t}</p>
            <p className="text-muted-foreground text-sm mt-1">{f.d}</p>
          </div>
        ))}

        <div className="bg-primary/6 border border-primary/20 rounded-xl p-4">
          <p className="text-primary font-semibold text-sm mb-1">Приоритет настроек</p>
          <p className="text-muted-foreground text-sm">SEO-настройки конкретного сайта <strong className="text-foreground">всегда переопределяют</strong> глобальные. Глобальные настройки — это «запасной вариант» для сайтов без индивидуальных SEO-данных.</p>
        </div>
      </div>
    )
  },
  "password": {
    title: "Смена email и пароля",
    body: (
      <div className="space-y-5">
        <p>Вкладка <strong className="text-foreground">«Безопасность»</strong> в Профиле содержит два независимых раздела: смена email и смена пароля.</p>

        <h3 className="font-bold text-foreground">Смена Email</h3>
        <div className="space-y-3">
          {[
            { t: "Как открыть", d: "Профиль → вкладка «Безопасность» → блок «Смена Email»." },
            { t: "Поля формы", d: "«Новый email» — введите новый адрес. «Подтвердите текущий пароль» — обязательное поле для безопасности." },
            { t: "После сохранения", d: "Email немедленно обновляется в системе. Текущий email отображается над формой для проверки. Все JWT-токены привязаны к userId, поэтому сессия не сбрасывается." },
          ].map(item => (
            <div key={item.t} className="glass border border-border rounded-xl p-4">
              <p className="text-foreground font-semibold text-sm">{item.t}</p>
              <p className="text-muted-foreground text-sm mt-1">{item.d}</p>
            </div>
          ))}
        </div>

        <h3 className="font-bold text-foreground">Смена пароля</h3>
        <div className="space-y-3">
          {[
            { t: "Как открыть", d: "Профиль → вкладка «Безопасность» → блок «Смена пароля»." },
            { t: "Поля формы", d: "«Текущий пароль», «Новый пароль» (мин. 6 символов), «Повторите пароль». Кнопка активна только при совпадении паролей." },
            { t: "Требования", d: "Минимум 6 символов. Рекомендуется: буквы + цифры + спецсимволы. Пароли чувствительны к регистру." },
            { t: "После сохранения", d: "Новый пароль хэшируется bcrypt и сохраняется. Текущая сессия остаётся активной." },
          ].map(item => (
            <div key={item.t} className="glass border border-border rounded-xl p-4">
              <p className="text-foreground font-semibold text-sm">{item.t}</p>
              <p className="text-muted-foreground text-sm mt-1">{item.d}</p>
            </div>
          ))}
        </div>
      </div>
    )
  },
  "profile-personal": {
    title: "Личные данные профиля",
    body: (
      <div className="space-y-5">
        <p>Страница профиля доступна через меню аватара в правом верхнем углу → «Профиль». Состоит из нескольких вкладок.</p>

        <h3 className="font-bold text-foreground">Вкладка «Личные данные»</h3>
        {[
          { t: "Аватар с кадрированием", d: "Нажмите на кружок аватара для загрузки фото. После выбора файла откроется инструмент кадрирования (crop) прямо в браузере — перемещайте и масштабируйте рамку. Результат сохраняется в JPG." },
          { t: "Имя и фамилия", d: "Редактируются свободно в полях «Имя» и «Фамилия». Нажмите «Сохранить изменения» для применения." },
          { t: "Email (read-only)", d: "Email отображается, но не редактируется здесь — изменить его можно во вкладке «Безопасность» → «Смена Email»." },
          { t: "Дамп памяти (прогресс)", d: "Под полями профиля отображается прогресс-бар использования хранилища с текущими значениями в МБ. При блокировке доступа администратором — показывает предупреждение с причиной." },
        ].map(f => (
          <div key={f.t} className="glass border border-border rounded-xl p-4">
            <p className="text-foreground font-semibold text-sm">{f.t}</p>
            <p className="text-muted-foreground text-sm mt-1">{f.d}</p>
          </div>
        ))}

        <h3 className="font-bold text-foreground">Все вкладки профиля</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { t: "Личные данные", d: "Аватар, имя, фамилия" },
            { t: "Безопасность", d: "Смена email и пароля" },
            { t: "Двухфакторная", d: "2FA по email-коду" },
            { t: "Внешний вид", d: "Тема и уведомления" },
            { t: "Подписка", d: "Текущий тариф" },
            { t: "Поддержка", d: "Чат с командой" },
          ].map(tab => (
            <div key={tab.t} className="glass border border-border rounded-xl p-3">
              <p className="text-foreground font-semibold text-xs">{tab.t}</p>
              <p className="text-muted-foreground text-xs mt-0.5">{tab.d}</p>
            </div>
          ))}
        </div>
      </div>
    )
  },
  "profile-appearance": {
    title: "Внешний вид и уведомления",
    body: (
      <div className="space-y-5">
        <p>Вкладка <strong className="text-foreground">«Внешний вид»</strong> в Профиле позволяет настроить тему интерфейса и управлять уведомлениями.</p>

        <h3 className="font-bold text-foreground">Тема интерфейса</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="glass border border-border rounded-2xl p-5 text-center bg-gray-900/50">
            <div className="text-2xl mb-2">🌙</div>
            <p className="text-foreground font-bold text-sm">Тёмная</p>
            <p className="text-muted-foreground text-xs mt-1">По умолчанию. Тёмный фон, меньше нагрузки на глаза.</p>
          </div>
          <div className="glass border border-border rounded-2xl p-5 text-center bg-white/5">
            <div className="text-2xl mb-2">☀️</div>
            <p className="text-foreground font-bold text-sm">Светлая</p>
            <p className="text-muted-foreground text-xs mt-1">Светлый фон. Подходит для работы в яркой обстановке.</p>
          </div>
        </div>
        <p className="text-muted-foreground text-sm">Выбранная тема применяется мгновенно ко всему интерфейсу и сохраняется в настройках аккаунта — при следующем входе тема восстанавливается автоматически.</p>

        <h3 className="font-bold text-foreground">Уведомления</h3>
        {[
          { t: "Уведомления в приложении", d: "Системные сообщения, статус модерации, ответы поддержки, изменения тарифа. Отображаются в колокольчике 🔔 в шапке." },
          { t: "Email-уведомления", d: "Новости сервиса, важные обновления, статус модерации. Отправляются на email аккаунта." },
        ].map(n => (
          <div key={n.t} className="glass border border-border rounded-xl p-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-foreground font-semibold text-sm">{n.t}</p>
              <p className="text-muted-foreground text-xs mt-1">{n.d}</p>
            </div>
            <div className="w-10 h-5 bg-primary rounded-full flex-shrink-0 relative mt-0.5">
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-white rounded-full" />
            </div>
          </div>
        ))}

        <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-4">
          <p className="text-amber-400 font-semibold text-sm mb-1">Обязательные уведомления</p>
          <p className="text-muted-foreground text-sm">Уведомления о заморозке/разморозке сайта и критических нарушениях всегда доставляются в приложение — независимо от ваших настроек.</p>
        </div>
      </div>
    )
  },
  "profile-subscription": {
    title: "Подписка в профиле",
    body: (
      <div className="space-y-5">
        <p>Вкладка <strong className="text-foreground">«Подписка»</strong> в Профиле показывает текущий тарифный план и позволяет управлять им.</p>

        <h3 className="font-bold text-foreground">Карточка текущего тарифа</h3>
        {[
          { t: "Название и бейдж тарифа", d: "Free, Pro или Business. Бейдж отображается рядом с названием." },
          { t: "Лимит сайтов", d: "Количество сайтов, доступных на текущем плане: 1 / 10 / Безлимит." },
          { t: "Хранилище", d: "Объём доступного дискового пространства: 512 МБ / 10 ГБ / 100 ГБ." },
          { t: "Глубина аналитики", d: "Период хранения данных аналитики: 7 дней / 90 дней / 1 год." },
          { t: "Поддержка", d: "Тип поддержки: Email 48ч / Приоритет 12ч / Выделенная 24/7." },
          { t: "Кнопка «Сменить тариф»", d: "Переход на страницу /pricing для апгрейда или смены плана." },
        ].map(f => (
          <div key={f.t} className="flex gap-3 py-2 border-b border-white/6 last:border-0">
            <span className="text-primary mt-0.5 flex-shrink-0 text-sm">→</span>
            <div>
              <span className="text-foreground font-semibold text-sm">{f.t}</span>
              <p className="text-muted-foreground text-xs mt-0.5">{f.d}</p>
            </div>
          </div>
        ))}

        <h3 className="font-bold text-foreground">Отмена подписки</h3>
        <p className="text-muted-foreground text-sm">На платных тарифах (Pro/Business) отображается раздел «Отменить подписку». После подтверждения:</p>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          <li className="flex gap-2"><span className="text-amber-400">→</span>Тариф остаётся активным до конца оплаченного периода</li>
          <li className="flex gap-2"><span className="text-amber-400">→</span>По истечении срока аккаунт переходит на Free</li>
          <li className="flex gap-2"><span className="text-amber-400">→</span>Сайты сверх лимита Free (1 сайт) будут скрыты, но не удалены</li>
        </ul>

        <div className="bg-primary/6 border border-primary/20 rounded-xl p-4">
          <p className="text-primary font-semibold text-sm mb-1">Смена тарифа администратором</p>
          <p className="text-muted-foreground text-sm">Тариф также может быть изменён администратором платформы вручную — это отображается в разделе «Подписка» после обновления страницы.</p>
        </div>
      </div>
    )
  },
  "data": {
    title: "Хранение данных (Дамп памяти)",
    body: (
      <div className="space-y-4">
        <p>Все данные lilluucore хранятся в защищённых дата-центрах с ежедневным резервным копированием.</p>
        {[
          { t: "Дамп памяти", d: "В настройках профиля отображается текущий объём использованной базы данных, статус (OK — всё в норме) и лимит на аккаунт." },
          { t: "База данных", d: "PostgreSQL с шифрованием at-rest. Ваши сайты, блоки и настройки хранятся в изолированной базе данных." },
          { t: "Резервные копии", d: "Автоматические резервные копии каждые 24 часа. Хранятся 30 дней (Pro) или 90 дней (Business)." },
          { t: "Изображения", d: "Загруженные изображения хранятся в объектном хранилище с CDN для быстрой доставки." },
          { t: "GDPR", d: "Все персональные данные обрабатываются в соответствии с GDPR. Вы можете запросить удаление данных в любой момент." },
          { t: "Лимиты хранилища", d: "Free: 500 МБ. Pro: 10 ГБ. Business: 100 ГБ. Лимит включает базу данных и медиафайлы." },
        ].map(item => (
          <div key={item.t} className="glass border border-border rounded-xl p-4">
            <p className="text-foreground font-semibold text-sm">{item.t}</p>
            <p className="text-muted-foreground text-sm mt-1">{item.d}</p>
          </div>
        ))}
      </div>
    )
  },
  "moderation": {
    title: "Модерация контента",
    body: (
      <div className="space-y-5">
        <p>lilluucore следит за качеством и безопасностью контента. Специальная команда модераторов и администраторов проверяет опубликованные сайты и при необходимости применяет меры.</p>

        <h3 className="font-bold text-foreground">Что проверяется</h3>
        <ul className="space-y-2">
          {[
            "Запрещённый контент (насилие, экстремизм, нелегальный контент)",
            "Нарушение авторских прав и товарных знаков",
            "Вредоносный код, фишинг и мошеннические схемы",
            "Спам и введение в заблуждение",
            "Нарушение законодательства",
          ].map(f => (
            <li key={f} className="flex items-start gap-2"><span className="text-red-400 mt-1">⚠</span><span className="text-muted-foreground text-sm">{f}</span></li>
          ))}
        </ul>

        <h3 className="font-bold text-foreground">Инструменты модерации</h3>
        <div className="space-y-3">
          {[
            { Icon: Snowflake, iconColor: "text-blue-400", color: "border-blue-500/20 bg-blue-500/5", t: "Заморозка сайта", d: "Временное отключение публичного доступа к сайту. Данные сохраняются, вы получаете уведомление с причиной. Сайт в редакторе остаётся доступным для исправления." },
            { Icon: LockOpen, iconColor: "text-emerald-400", color: "border-emerald-500/20 bg-emerald-500/5", t: "Разморозка сайта", d: "После устранения нарушения модератор может снять заморозку. Сайт снова становится доступен посетителям." },
            { Icon: Trash, iconColor: "text-red-400", color: "border-red-500/20 bg-red-500/5", t: "Удаление сайта", d: "При грубых или повторных нарушениях администратор может полностью удалить сайт. Это необратимо — все данные теряются." },
            { Icon: ChatCircle, iconColor: "text-violet-400", color: "border-violet-500/20 bg-violet-500/5", t: "Чат с пользователем", d: "Модераторы могут напрямую общаться с пользователями через встроенный мессенджер для разъяснения ситуации." },
            { Icon: Bell, iconColor: "text-amber-400", color: "border-amber-500/20 bg-amber-500/5", t: "Уведомления", d: "Отправка персональных уведомлений пользователю или broadcast-рассылка всем пользователями платформы." },
          ].map(tool => (
            <div key={tool.t} className={`p-4 glass rounded-xl border ${tool.color} flex gap-3 items-start`}>
              <tool.Icon size={20} weight="light" className={`${tool.iconColor} flex-shrink-0 mt-0.5`} />
              <div>
                <p className="text-foreground font-semibold text-sm mb-1">{tool.t}</p>
                <p className="text-muted-foreground text-sm">{tool.d}</p>
              </div>
            </div>
          ))}
        </div>

        <h3 className="font-bold text-foreground">Управление пользователями (Admin)</h3>
        <p className="text-muted-foreground text-sm">Администраторы дополнительно могут изменять статус аккаунтов пользователей:</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            "Смена роли (user → moderator → admin)",
            "Ручное изменение тарифного плана",
            "Блокировка экспорта данных (дамп памяти)",
            "Полное удаление аккаунта",
          ].map(a => <p key={a} className="text-muted-foreground text-xs flex gap-1.5"><span className="text-primary mt-0.5">•</span>{a}</p>)}
        </div>

        <h3 className="font-bold text-foreground">Как обжаловать решение модератора</h3>
        {[
          { n: "1", t: "Прочитайте причину", d: "Проверьте уведомления (колокольчик вверху) — там указана конкретная причина заморозки." },
          { n: "2", t: "Устраните нарушение", d: "Откройте редактор, удалите или измените нарушающий контент. Редактор доступен даже при заморозке." },
          { n: "3", t: "Напишите в чат или на почту", d: "Откройте чат с поддержкой в профиле или напишите на support@lilluucore.com с описанием принятых мер." },
          { n: "4", t: "Дождитесь проверки", d: "Модератор рассмотрит запрос в течение 1–2 рабочих дней и разморозит сайт или уточнит, что нужно ещё исправить." },
        ].map(step => (
          <div key={step.n} className="flex gap-4 p-4 glass rounded-xl border border-border">
            <div className="gradient-purple w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">{step.n}</div>
            <div><p className="text-foreground font-semibold">{step.t}</p><p className="text-muted-foreground text-sm mt-0.5">{step.d}</p></div>
          </div>
        ))}
      </div>
    )
  },
  "notifications": {
    title: "Система уведомлений",
    body: (
      <div className="space-y-5">
        <p>lilluucore имеет встроенную систему уведомлений. Важные сообщения от команды, модераторов и системы доставляются прямо в интерфейс приложения.</p>

        <h3 className="font-bold text-foreground">Как получить уведомления</h3>
        <p className="text-muted-foreground text-sm">Нажмите иконку колокольчика 🔔 в верхнем правом углу страницы. Красный счётчик показывает количество непрочитанных уведомлений. Нажмите на уведомление, чтобы отметить его прочитанным.</p>

        <h3 className="font-bold text-foreground">Типы уведомлений</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { Icon: Info, iconColor: "text-blue-400", t: "Информация", color: "border-blue-500/20", d: "Системные объявления, новости платформы, обновления функций" },
            { Icon: Warning, iconColor: "text-amber-400", t: "Предупреждение", color: "border-amber-500/20", d: "Важные предупреждения о работе сервиса или приближении лимитов" },
            { Icon: ShieldCheck, iconColor: "text-violet-400", t: "Модерация", color: "border-violet-500/20", d: "Сообщения от модераторов о контенте вашего сайта" },
            { Icon: CheckCircle, iconColor: "text-emerald-400", t: "Успех", color: "border-emerald-500/20", d: "Подтверждения: публикация сайта, верификация, выполненные действия" },
            { Icon: XCircle, iconColor: "text-red-400", t: "Ошибка", color: "border-red-500/20", d: "Критические проблемы, требующие вашего внимания" },
          ].map(n => (
            <div key={n.t} className={`glass border rounded-xl p-4 ${n.color}`}>
              <n.Icon size={22} weight="light" className={`${n.iconColor} mb-2`} />
              <p className="text-foreground font-semibold text-sm">{n.t}</p>
              <p className="text-muted-foreground text-xs mt-0.5">{n.d}</p>
            </div>
          ))}
        </div>

        <h3 className="font-bold text-foreground">Когда вы получите уведомление</h3>
        <ul className="space-y-2">
          {[
            "Модератор заморозил или разморозил ваш сайт",
            "Администратор изменил ваш тарифный план",
            "Новая функция или важное обновление платформы",
            "Ответ на ваш запрос в поддержку",
            "Плановые технические работы",
            "Превышение лимитов хранилища или блоков",
          ].map(e => <li key={e} className="flex items-start gap-2 text-muted-foreground text-sm"><span className="text-primary mt-0.5">•</span>{e}</li>)}
        </ul>

        <h3 className="font-bold text-foreground">Настройка уведомлений</h3>
        <p className="text-muted-foreground text-sm">В профиле → раздел «Уведомления» можно раздельно настроить уведомления в приложении (In-app) и email-уведомления с помощью независимых переключателей.</p>

        <div className="bg-primary/6 border border-primary/20 rounded-xl p-4">
          <p className="text-primary font-semibold text-sm mb-1">Broadcast от администратора</p>
          <p className="text-muted-foreground text-sm">Администраторы могут отправить уведомление сразу всем пользователям платформы — например, об обновлении или плановых работах. Такие уведомления вы увидите в колокольчике.</p>
        </div>
      </div>
    )
  },
  "preview": {
    title: "Предпросмотр сайта",
    body: (
      <div className="space-y-4">
        <p>После публикации сайта вы можете просмотреть его в режиме предпросмотра — полноэкранное отображение всех блоков, как увидит их посетитель.</p>
        {[
          { n: "1", t: "Опубликуйте сайт", d: "В редакторе нажмите кнопку «Опубликовать» в верхней панели." },
          { n: "2", t: "Откройте предпросмотр", d: "После публикации появится кнопка «Предпросмотр» — нажмите на неё, чтобы открыть сайт на отдельной странице." },
          { n: "3", t: "Переключайте устройства", d: "В верхней панели предпросмотра есть иконки для переключения между десктопом, планшетом и мобильным видом." },
        ].map(step => (
          <div key={step.n} className="flex gap-4 p-4 glass rounded-xl border border-border">
            <div className="gradient-purple w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">{step.n}</div>
            <div><p className="text-foreground font-semibold">{step.t}</p><p className="text-muted-foreground text-sm mt-0.5">{step.d}</p></div>
          </div>
        ))}
      </div>
    )
  },
  "payment": {
    title: "Способы оплаты",
    body: (
      <div className="space-y-4">
        <p>lilluucore принимает различные способы оплаты для удобства пользователей по всему миру.</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { Icon: CreditCard, color: "text-violet-400", t: "Банковские карты", d: "Visa, Mastercard, МИР" },
            { Icon: DeviceMobile, color: "text-blue-400", t: "СБП", d: "Система быстрых платежей" },
            { Icon: Bank, color: "text-emerald-400", t: "Банковский перевод", d: "Для юридических лиц" },
            { Icon: Lock, color: "text-amber-400", t: "ЮMoney", d: "Яндекс Пей, ЮMoney" },
          ].map(p => (
            <div key={p.t} className="glass border border-border rounded-xl p-4 text-center">
              <p.Icon size={28} weight="light" className={`${p.color} mx-auto mb-2`} />
              <p className="text-foreground font-semibold text-sm">{p.t}</p>
              <p className="text-muted-foreground text-xs mt-0.5">{p.d}</p>
            </div>
          ))}
        </div>
        <div className="bg-primary/8 border border-primary/20 rounded-xl p-4">
          <p className="text-primary font-semibold text-sm">Счёт для юридических лиц</p>
          <p className="text-muted-foreground text-sm mt-1">Напишите на support@lilluucore.com с реквизитами — выставим счёт в течение 1 рабочего дня.</p>
        </div>
      </div>
    )
  },
  "cancel": {
    title: "Отмена подписки",
    body: (
      <div className="space-y-4">
        <p>Вы можете отменить подписку в любое время. После отмены тариф остаётся активным до конца оплаченного периода.</p>
        {[
          { n: "1", t: "Перейдите в настройки", d: "Профиль → вкладка «Тариф» → кнопка «Отменить подписку»." },
          { n: "2", t: "Подтвердите отмену", d: "В диалоге нажмите «Подтвердить отмену». Подписка будет активна до конца оплаченного периода." },
          { n: "3", t: "Переход на Free", d: "После окончания периода аккаунт автоматически переходит на Free. Сайты сверх лимита будут скрыты (не удалены)." },
        ].map(step => (
          <div key={step.n} className="flex gap-4 p-4 glass rounded-xl border border-border">
            <div className="gradient-purple w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">{step.n}</div>
            <div><p className="text-foreground font-semibold">{step.t}</p><p className="text-muted-foreground text-sm mt-0.5">{step.d}</p></div>
          </div>
        ))}
        <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-4">
          <p className="text-red-400 font-semibold text-sm">Возврат средств</p>
          <p className="text-muted-foreground text-sm mt-1">Возврат возможен в течение 7 дней с момента оплаты, если вы не использовали платные функции. Пишите на support@lilluucore.com.</p>
        </div>
      </div>
    )
  },
  "zero-block": {
    title: "Zero Block — свободный холст",
    body: (
      <div className="space-y-5">
        <p>Zero Block — самый мощный инструмент в lilluucore. В отличие от обычных блоков, здесь нет фиксированных колонок — вы располагаете элементы абсолютно свободно, как в Figma или Photoshop.</p>

        <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-4">
          <p className="text-emerald-400 font-bold text-sm mb-1">Совет</p>
          <p className="text-muted-foreground text-sm">Zero Block идеально подходит для создания уникальных секций, hero-экранов со сложной композицией, инфографики и нестандартных макетов.</p>
        </div>

        <h3 className="font-bold text-foreground">Типы элементов</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { Icon: Square, color: "text-violet-400", t: "Прямоугольник", d: "Блок с цветом заливки, рамкой и скруглением. Базовый строительный блок макета." },
            { Icon: Circle, color: "text-blue-400", t: "Эллипс", d: "Окружность или овал. Подходит для иконок, аватаров, декоративных элементов." },
            { Icon: TextT, color: "text-emerald-400", t: "Текст", d: "Произвольный текст с настройкой шрифта, размера, цвета, жирности и выравнивания. Двойной клик для редактирования." },
            { Icon: BezierCurve, color: "text-pink-400", t: "Путь (кривые Безье)", d: "Рисование свободных форм и кривых. Инструмент «Редактировать точки» для управления касательными." },
          ].map(e => (
            <div key={e.t} className="glass border border-border rounded-xl p-3">
              <e.Icon size={24} weight="light" className={`${e.color} mb-2`} />
              <p className="text-foreground font-semibold text-sm">{e.t}</p>
              <p className="text-muted-foreground text-xs mt-0.5">{e.d}</p>
            </div>
          ))}
        </div>

        <h3 className="font-bold text-foreground">Инструменты редактора</h3>
        {[
          { t: "Левая панель Zero Block", d: "Содержит кнопки добавления элементов (rect/ellipse/text/path) в компактной 3-колоночной сетке. Внизу — список всех элементов для навигации." },
          { t: "Выделение и перемещение", d: "Кликните на элемент для выделения (синяя рамка). Перетащите для перемещения. Handles по углам и сторонам для изменения размера." },
          { t: "Правая панель настроек", d: "Для каждого элемента: координаты X/Y, ширина/высота, цвет, прозрачность, скругление (для rect), жирность/размер шрифта (для text)." },
          { t: "Выравнивание", d: "Панель Quick Actions содержит 6 кнопок выравнивания: по левому/центру/правому краю, по верхнему/центру/нижнему краю." },
          { t: "Редактировать точки", d: "Для path-элементов: кнопка «Редактировать точки» активирует режим редактирования узлов кривой Безье с управлением касательными." },
          { t: "Редактировать текст", d: "Для text-элементов: кнопка «Редактировать текст» или двойной клик активирует inline-редактор прямо на холсте." },
          { t: "Копировать / Вставить", d: "Выделите элемент → Ctrl+C, Ctrl+V. Вставленная копия сдвигается на 10px вправо и вниз." },
          { t: "Удалить", d: "Кнопка «Удалить» в правой панели или клавиша Delete/Backspace при выделенном элементе." },
        ].map(item => (
          <div key={item.t} className="glass border border-border rounded-xl p-4">
            <p className="text-foreground font-semibold text-sm">{item.t}</p>
            <p className="text-muted-foreground text-sm mt-1">{item.d}</p>
          </div>
        ))}

        <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-4">
          <p className="text-amber-400 font-semibold text-sm mb-1">Безопасность</p>
          <p className="text-muted-foreground text-sm">Zero Block рендерится в изолированном sandboxed iframe без права выполнения скриптов. Это защищает посетителей сайта от XSS-атак, сохраняя полную свободу дизайна.</p>
        </div>
      </div>
    )
  },
  "popup": {
    title: "Всплывающие окна (Popup)",
    body: (
      <div className="space-y-5">
        <p>Popup-блок — это всплывающее окно, которое появляется поверх контента страницы. Идеально для форм захвата лидов, специальных предложений, подтверждений и важных сообщений.</p>

        <h3 className="font-bold text-foreground">Варианты отображения</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { t: "Centered", d: "Окно в центре экрана с затемнённым фоном. Классический modal." },
            { t: "Image Left", d: "Изображение слева, текст и форма справа. Подходит для промо-предложений." },
            { t: "Fullscreen", d: "Занимает весь экран. Максимальное внимание пользователя." },
            { t: "Bottom Sheet", d: "Появляется снизу как «шторка». Популярный мобильный паттерн." },
          ].map(v => (
            <div key={v.t} className="glass border border-border rounded-xl p-3">
              <p className="text-foreground font-semibold text-sm">{v.t}</p>
              <p className="text-muted-foreground text-xs mt-0.5">{v.d}</p>
            </div>
          ))}
        </div>

        <h3 className="font-bold text-foreground">Три вкладки настроек</h3>
        {[
          { t: "Content (Контент)", d: "Заголовок, Rich Text тело попапа, изображение с выбором позиции (left/right/top/background), размер окна (sm/md/lg), анимация появления." },
          { t: "Form (Форма)", d: "Конструктор полей формы внутри попапа. Типы полей: text, email, tel, number, textarea, select, checkbox, radio. Перетаскивание для сортировки." },
          { t: "Trigger (Триггер)", d: "ID попапа для открытия по кнопке, закрытие по клику на оверлей, автозакрытие через N секунд, настройка фона оверлея." },
        ].map(tab => (
          <div key={tab.t} className="glass border border-border rounded-xl p-4">
            <p className="text-foreground font-semibold text-sm">{tab.t}</p>
            <p className="text-muted-foreground text-sm mt-1">{tab.d}</p>
          </div>
        ))}

        <h3 className="font-bold text-foreground">Как открыть попап по кнопке</h3>
        {[
          { n: "1", t: "Добавьте Popup-блок", d: "В левой панели выберите Popup. Блок отображается в редакторе как карточка-заглушка (он скрыт на странице до триггера)." },
          { n: "2", t: "Задайте ID попапа", d: "Во вкладке Trigger укажите уникальный ID, например «promo-popup»." },
          { n: "3", t: "Настройте кнопку Hero или CTA", d: "В настройках блока Hero или CTA выберите действие кнопки «Открыть попап» и выберите из списка ваш попап." },
          { n: "4", t: "Готово!", d: "При клике на кнопку в предпросмотре попап откроется с анимацией. Закрывается по кнопке ✕, нажатию Escape или клику на оверлей." },
        ].map(step => (
          <div key={step.n} className="flex gap-4 p-4 glass rounded-xl border border-border">
            <div className="gradient-purple w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">{step.n}</div>
            <div><p className="text-foreground font-semibold">{step.t}</p><p className="text-muted-foreground text-sm mt-0.5">{step.d}</p></div>
          </div>
        ))}
      </div>
    )
  },
  "undo-redo": {
    title: "Отмена и возврат действий",
    body: (
      <div className="space-y-4">
        <p>lilluucore имеет полноценную систему истории действий. Вы можете отменить до 30 последних изменений и вернуть их обратно — всё это мгновенно, без перезагрузки.</p>

        <div className="grid grid-cols-2 gap-3">
          <div className="glass border border-border rounded-xl p-4 text-center">
            <div className="text-3xl mb-2">↩</div>
            <p className="text-foreground font-bold">Отменить</p>
            <code className="text-primary font-mono text-sm">Ctrl+Z</code>
            <p className="text-muted-foreground text-xs mt-1">Кнопка в верхней панели редактора</p>
          </div>
          <div className="glass border border-border rounded-xl p-4 text-center">
            <div className="text-3xl mb-2">↪</div>
            <p className="text-foreground font-bold">Вернуть</p>
            <code className="text-primary font-mono text-sm">Ctrl+Y</code>
            <p className="text-muted-foreground text-xs mt-1">Или Ctrl+Shift+Z</p>
          </div>
        </div>

        <h3 className="font-bold text-foreground">Что фиксируется в истории</h3>
        <ul className="space-y-2">
          {[
            "Добавление нового блока на страницу",
            "Удаление блока",
            "Дублирование блока",
            "Перемещение блока (drag-and-drop)",
            "Сохранение изменений блока (кнопка «Сохранить» в правой панели)",
          ].map(a => (
            <li key={a} className="flex items-start gap-2 text-muted-foreground text-sm">
              <span className="text-primary mt-0.5">✓</span>{a}
            </li>
          ))}
        </ul>

        <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-4">
          <p className="text-amber-400 font-semibold text-sm mb-1">Важно</p>
          <p className="text-muted-foreground text-sm">История очищается при переходе на другую страницу сайта или закрытии редактора. История не синхронизируется между устройствами — это локальная сессия.</p>
        </div>
      </div>
    )
  },
  "image-upload": {
    title: "Загрузка изображений и видео",
    body: (
      <div className="space-y-5">
        <p>В lilluucore можно загружать как изображения, так и видеофайлы — они сохраняются в облачном хранилище и доступны по прямой ссылке для использования в блоках.</p>

        <h3 className="font-bold text-foreground">Как загрузить файл</h3>
        {[
          { n: "1", t: "Найдите поле с кнопкой загрузки", d: "В правой панели настроек блока рядом с полем URL изображения или видео есть кнопка с иконкой загрузки (фото или видео)." },
          { n: "2", t: "Нажмите иконку загрузки", d: "Откроется системный диалог выбора файла. Выберите нужный файл с диска." },
          { n: "3", t: "Выберите файл", d: "Изображения: JPG, PNG, WebP до 10 МБ. Видео: MP4, WebM до 50 МБ." },
          { n: "4", t: "Дождитесь загрузки", d: "Файл загружается в объектное хранилище. После завершения URL автоматически подставляется в поле — блок мгновенно обновляется." },
        ].map(step => (
          <div key={step.n} className="flex gap-4 p-4 glass rounded-xl border border-border">
            <div className="gradient-purple w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">{step.n}</div>
            <div><p className="text-foreground font-semibold">{step.t}</p><p className="text-muted-foreground text-sm mt-0.5">{step.d}</p></div>
          </div>
        ))}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-bold text-foreground mb-3">Изображения</h3>
            <div className="space-y-1.5">
              {["Hero — фоновое фото/видео", "Gallery — сетка фото", "Blog — обложка статьи", "Products — фото товара", "Team — аватар участника", "Coaches — фото тренера", "Testimonials — аватар клиента", "Popup — изображение", "Discography — обложка альбома", "Features — иконка элемента"].map(b => (
                <p key={b} className="text-muted-foreground text-xs flex gap-1.5"><span className="text-emerald-400">✓</span>{b}</p>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-bold text-foreground mb-3">Видео</h3>
            <div className="space-y-1.5">
              {["Video — блок с видеоплеером", "Shorts Slider — вертикальные видео", "Hero — фоновое видео (вместо фото)"].map(b => (
                <p key={b} className="text-muted-foreground text-xs flex gap-1.5"><span className="text-pink-400">▶</span>{b}</p>
              ))}
            </div>
            <div className="mt-4 bg-amber-500/8 border border-amber-500/20 rounded-xl p-3">
              <p className="text-amber-400 font-semibold text-xs mb-1">Форматы видео</p>
              <p className="text-muted-foreground text-xs">MP4 (H.264) — наилучшая совместимость. WebM — меньший размер. Максимум 50 МБ.</p>
            </div>
          </div>
        </div>

        <div className="bg-primary/6 border border-primary/20 rounded-xl p-4">
          <p className="text-primary font-semibold text-sm mb-1">Аватар профиля</p>
          <p className="text-muted-foreground text-sm">Загрузка аватара профиля поддерживает кадрирование (crop) прямо в браузере — перемещайте и масштабируйте рамку перед сохранением.</p>
        </div>
      </div>
    )
  },
  "block-templates": {
    title: "Шаблоны блоков",
    body: (
      <div className="space-y-5">
        <p>При добавлении большинства блоков сначала открывается окно выбора шаблона — визуального варианта блока. Вы выбираете стиль, подходящий для вашего сайта, и блок добавляется уже в этом варианте.</p>

        <h3 className="font-bold text-foreground">Варианты по блокам</h3>
        <div className="space-y-3">
          {[
            { block: "Hero", color: "text-violet-400", variants: [
              { name: "По центру (centered)", d: "Классический вариант: заголовок и кнопки по центру, фоновый цвет или изображение" },
              { name: "Разделённый (split)", d: "Текст слева, изображение справа — двухколоночная компоновка" },
              { name: "Минималистичный (minimal)", d: "Светлый фон, простая типографика без лишних элементов" },
              { name: "Тёмный (dark)", d: "Тёмный фон с глоу-эффектом акцентного цвета" },
            ]},
            { block: "Features", color: "text-blue-400", variants: [
              { name: "Карточки (cards)", d: "Сетка карточек с иконкой, заголовком и описанием" },
              { name: "Список (list)", d: "Вертикальный список с разделителями, иконкой слева" },
              { name: "Чередование (alternating)", d: "Элементы поочерёдно справа и слева, как в лендинге Apple" },
            ]},
            { block: "Testimonials", color: "text-pink-400", variants: [
              { name: "Сетка (grid)", d: "2-колоночная сетка карточек отзывов" },
              { name: "Цитата (quote)", d: "Одна большая центрированная цитата с аватаром" },
              { name: "Список (list)", d: "Вертикальный список отзывов с рейтингом" },
            ]},
            { block: "Pricing", color: "text-amber-400", variants: [
              { name: "Карточки (cards)", d: "Колонки тарифов рядом, выделенный тариф подсвечен" },
              { name: "Таблица (table)", d: "Таблица сравнения фич по тарифам" },
            ]},
            { block: "Stats", color: "text-emerald-400", variants: [
              { name: "Строка (row)", d: "Цифры в строку, подпись под каждой" },
              { name: "Карточки (cards)", d: "Каждая метрика в отдельной карточке с фоном" },
            ]},
            { block: "Header Menu", color: "text-cyan-400", variants: [
              { name: "Классический (classic)", d: "Лого слева, меню и кнопка справа" },
              { name: "Лого по центру (logo_center)", d: "Лого по центру, меню делится на две части" },
              { name: "Минимальный (minimal)", d: "Только лого и кнопка-гамбургер" },
            ]},
            { block: "Footer", color: "text-rose-400", variants: [
              { name: "Колонки (columns)", d: "Несколько колонок со ссылками и контактами" },
              { name: "Минимальный (minimal)", d: "Одна строка с лого и копирайтом" },
              { name: "По центру (centered)", d: "Всё по центру: лого, ссылки, копирайт" },
            ]},
          ].map(({ block, color, variants }) => (
            <div key={block} className="glass border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/6">
                <span className={`font-bold text-sm ${color}`}>{block}</span>
                <span className="text-muted-foreground text-xs ml-2">— {variants.length} варианта</span>
              </div>
              <div className="divide-y divide-white/5">
                {variants.map(v => (
                  <div key={v.name} className="px-4 py-2.5 flex gap-3">
                    <span className="text-primary text-xs mt-0.5 flex-shrink-0">◆</span>
                    <div>
                      <span className="text-foreground text-xs font-semibold">{v.name}</span>
                      <span className="text-muted-foreground text-xs ml-1.5">— {v.d}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-primary/6 border border-primary/20 rounded-xl p-4">
          <p className="text-primary font-semibold text-sm mb-1">Смена шаблона после добавления</p>
          <p className="text-muted-foreground text-sm">Вариант блока хранится в поле <code className="text-primary font-mono text-xs">styles.variant</code>. Его можно сменить в правой панели настроек блока → поле «Вариант» в разделе «Стиль».</p>
        </div>
      </div>
    )
  },
  "header-footer": {
    title: "Шапка и подвал сайта",
    body: (
      <div className="space-y-5">
        <p>Блоки <strong className="text-foreground">Header Menu</strong> и <strong className="text-foreground">Footer</strong> — специальные структурные блоки навигации. Они находятся в категории «Основные» в левой панели редактора.</p>

        <h3 className="font-bold text-foreground">Header Menu — Шапка сайта</h3>
        <div className="grid grid-cols-1 gap-3">
          {[
            { t: "Логотип", d: "Текстовый логотип с настройкой шрифта, цвета и размера. Поддерживает загрузку изображения-логотипа вместо текста." },
            { t: "Пункты меню", d: "Список ссылок навигации. Каждый пункт: текст + URL. Активный пункт подсвечивается акцентным цветом." },
            { t: "CTA-кнопка", d: "Кнопка действия в правой части шапки (например, «Связаться», «Купить»). Настройка текста, цвета и ссылки." },
            { t: "3 варианта", d: "Классический (лого слева + меню справа), Лого по центру (меню разделяется), Минимальный (только лого + бургер)." },
            { t: "Закрепление", d: "Шапка прикрепляется к верху страницы при прокрутке (sticky). Фон становится полупрозрачным с эффектом стекла." },
          ].map(f => (
            <div key={f.t} className="glass border border-border rounded-xl p-4">
              <p className="text-foreground font-semibold text-sm">{f.t}</p>
              <p className="text-muted-foreground text-sm mt-1">{f.d}</p>
            </div>
          ))}
        </div>

        <h3 className="font-bold text-foreground">Footer — Подвал сайта</h3>
        <div className="grid grid-cols-1 gap-3">
          {[
            { t: "Колонки ссылок", d: "Несколько колонок с заголовком и списком ссылок. Идеально для Продукт / Компания / Контакты." },
            { t: "Копирайт", d: "Строка с годом и правами. Автоматически подставляется название сайта." },
            { t: "Социальные сети", d: "Иконки соцсетей с ссылками: VK, Telegram, Instagram, YouTube." },
            { t: "3 варианта", d: "Колонки (многосекционный), Минимальный (одна строка), По центру (всё центрировано)." },
          ].map(f => (
            <div key={f.t} className="glass border border-border rounded-xl p-4">
              <p className="text-foreground font-semibold text-sm">{f.t}</p>
              <p className="text-muted-foreground text-sm mt-1">{f.d}</p>
            </div>
          ))}
        </div>

        <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-4">
          <p className="text-amber-400 font-semibold text-sm mb-1">Рекомендация</p>
          <p className="text-muted-foreground text-sm">Добавляйте Header Menu первым блоком и Footer последним. Шапка и подвал автоматически появляются на всех страницах сайта при публикации.</p>
        </div>
      </div>
    )
  },
  "shorts-slider": {
    title: "Shorts / Reels слайдер",
    body: (
      <div className="space-y-5">
        <p>Блок <strong className="text-foreground">Shorts Slider</strong> — вертикальный слайдер коротких видео в формате 9:16. Идеально воспроизводит опыт TikTok / Instagram Reels / YouTube Shorts прямо на вашем сайте.</p>

        <div className="bg-pink-500/8 border border-pink-500/20 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-16 bg-pink-500/20 border border-pink-500/30 rounded-lg flex items-center justify-center text-pink-400 text-xs font-bold flex-shrink-0">9:16</div>
          <div>
            <p className="text-pink-400 font-semibold text-sm">Формат 9:16 — вертикальное видео</p>
            <p className="text-muted-foreground text-xs mt-1">Соотношение сторон, оптимальное для мобильных устройств. Вертикальный скролл слайдов.</p>
          </div>
        </div>

        <h3 className="font-bold text-foreground">Возможности блока</h3>
        {[
          { t: "Загрузка видео", d: "Загружайте видеофайлы (MP4, WebM) напрямую в хранилище lilluucore. Поле URL позволяет также указать внешнюю ссылку на видео." },
          { t: "Обложка (poster)", d: "Для каждого видео задаётся изображение-постер, который показывается до начала воспроизведения." },
          { t: "Заголовок и подпись", d: "Каждый слайд имеет наложенный заголовок и подпись, которые отображаются поверх видео." },
          { t: "Навигация", d: "Стрелки вверх/вниз для переключения между видео. На мобильных устройствах — свайп." },
          { t: "3 варианта отображения", d: "Полноэкранный (full), Компактный (compact) с отступами, Плёнка (film) с несколькими видимыми слайдами." },
        ].map(f => (
          <div key={f.t} className="glass border border-border rounded-xl p-4">
            <p className="text-foreground font-semibold text-sm">{f.t}</p>
            <p className="text-muted-foreground text-sm mt-1">{f.d}</p>
          </div>
        ))}

        <div className="bg-primary/6 border border-primary/20 rounded-xl p-4">
          <p className="text-primary font-semibold text-sm mb-1">Идеально для музыкальных лейблов</p>
          <p className="text-muted-foreground text-sm">При выборе типа бизнеса «Музыкальный лейбл» блок Shorts Slider рекомендуется для размещения клипов, выступлений и бэкстейджа артистов.</p>
        </div>
      </div>
    )
  },
  "elem-animations": {
    title: "Анимации элементов",
    body: (
      <div className="space-y-5">
        <p>lilluucore поддерживает <strong className="text-foreground">два уровня анимаций</strong>: анимация всего блока целиком и анимация отдельных элементов внутри блока.</p>

        <h3 className="font-bold text-foreground">Уровень 1: Анимация блока</h3>
        <p className="text-muted-foreground text-sm">Настройка в правой панели → вкладка «Стиль» → раздел «Анимация появления». Применяется ко всему блоку при входе в область видимости.</p>
        <div className="grid grid-cols-2 gap-2">
          {["— Нет (без анимации)", "↑ Снизу (fade-up)", "↓ Сверху (fade-down)", "← Слева (fade-left)", "→ Справа (fade-right)", "⊕ Зум (zoom-in)"].map(a => (
            <div key={a} className="glass border border-border rounded-lg px-3 py-2 text-muted-foreground text-xs">{a}</div>
          ))}
        </div>

        <h3 className="font-bold text-foreground">Уровень 2: Анимации элементов</h3>
        <p className="text-muted-foreground text-sm">В правой панели → вкладка «Стиль» → раздел «Анимации элементов». Каждый значимый элемент блока можно анимировать независимо. Те же 5 вариантов анимации.</p>

        <div className="space-y-3">
          {[
            { block: "Hero", elems: ["Бейдж / Метка", "Заголовок", "Подзаголовок", "Кнопки (CTA)", "Изображение"] },
            { block: "CTA", elems: ["Заголовок", "Подзаголовок", "Кнопка"] },
            { block: "Features", elems: ["Заголовок секции", "Подзаголовок", "Карточки фич"] },
            { block: "Testimonials", elems: ["Заголовок", "Карточки отзывов"] },
            { block: "Header Menu", elems: ["Логотип", "Меню", "Активная ссылка"] },
          ].map(({ block, elems }) => (
            <div key={block} className="glass border border-border rounded-xl p-3">
              <p className="text-foreground font-semibold text-xs mb-2">{block}</p>
              <div className="flex flex-wrap gap-1.5">
                {elems.map(e => <span key={e} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">{e}</span>)}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-4">
          <p className="text-emerald-400 font-semibold text-sm mb-1">Совет по использованию</p>
          <p className="text-muted-foreground text-sm">Используйте последовательные анимации: бейдж fade-right → заголовок fade-up → кнопки zoom-in. Это создаёт эффект «рассказа», который привлекает внимание посетителя.</p>
        </div>
      </div>
    )
  },
  "rich-text": {
    title: "Редактор текста",
    body: (
      <div className="space-y-5">
        <p>Многие блоки (Hero, CTA, Text, Popup и другие) содержат поля с полноценным <strong className="text-foreground">Rich Text редактором</strong> вместо простого textarea. Он позволяет форматировать текст прямо в браузере.</p>

        <h3 className="font-bold text-foreground">Панель инструментов</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { group: "Начертание", tools: ["B — Жирный (Ctrl+B)", "I — Курсив (Ctrl+I)", "U — Подчёркнутый (Ctrl+U)", "S̶ — Зачёркнутый"] },
            { group: "Заголовки", tools: ["H1 — Крупный заголовок", "H2 — Средний заголовок", "¶ — Обычный абзац"] },
            { group: "Выравнивание", tools: ["По левому краю", "По центру", "По правому краю"] },
            { group: "Списки", tools: ["• Маркированный список", "1. Нумерованный список", "→ Увеличить отступ", "← Уменьшить отступ"] },
            { group: "Ссылки и цвет", tools: ["URL — Вставить ссылку", "Цвет текста (color picker)", "Tx — Убрать форматирование"] },
          ].map(({ group, tools }) => (
            <div key={group} className="glass border border-border rounded-xl p-4">
              <p className="text-foreground font-semibold text-xs uppercase tracking-widest mb-2">{group}</p>
              <ul className="space-y-1">
                {tools.map(t => <li key={t} className="text-muted-foreground text-xs flex gap-1.5"><span className="text-primary">•</span>{t}</li>)}
              </ul>
            </div>
          ))}
        </div>

        <h3 className="font-bold text-foreground">Где используется</h3>
        <div className="flex flex-wrap gap-2">
          {["Hero — подзаголовок", "CTA — подзаголовок", "Text — основное тело", "Popup — тело попапа", "Features — описания", "Blog — анонс статьи"].map(b => (
            <span key={b} className="text-xs bg-secondary/60 border border-border text-muted-foreground px-3 py-1 rounded-full">{b}</span>
          ))}
        </div>

        <div className="bg-primary/6 border border-primary/20 rounded-xl p-4">
          <p className="text-primary font-semibold text-sm mb-1">Горячие клавиши</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            {[["Ctrl+B", "Жирный"], ["Ctrl+I", "Курсив"], ["Ctrl+U", "Подчёркнутый"], ["Enter", "Новый абзац"]].map(([k, v]) => (
              <div key={k} className="flex gap-2 items-center">
                <code className="bg-black/30 text-primary px-1.5 py-0.5 rounded font-mono">{k}</code>
                <span>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  },
  "forms": {
    title: "Формы и заявки",
    body: (
      <div className="space-y-5">
        <p>lilluucore имеет встроенную систему форм для сбора заявок от посетителей вашего сайта. Все заявки сохраняются и доступны в дашборде.</p>

        <h3 className="font-bold text-foreground">Блоки с формами</h3>
        <div className="grid grid-cols-1 gap-3">
          {[
            { t: "Contacts (Форма обратной связи)", d: "Стандартная форма: имя, email, телефон, сообщение. Настройка заголовка, подзаголовка и текста кнопки." },
            { t: "Form (Конструктор форм)", d: "Полный конструктор форм: добавляйте произвольные поля с типами text, email, tel, number, textarea, select, checkbox, radio. Задайте название формы и текст кнопки." },
            { t: "Popup с формой", d: "Любой Popup-блок может содержать встроенную форму. Собирайте заявки во всплывающем окне по триггеру." },
          ].map(f => (
            <div key={f.t} className="glass border border-border rounded-xl p-4">
              <p className="text-foreground font-semibold text-sm">{f.t}</p>
              <p className="text-muted-foreground text-sm mt-1">{f.d}</p>
            </div>
          ))}
        </div>

        <h3 className="font-bold text-foreground">Просмотр заявок</h3>
        <p className="text-muted-foreground text-sm">На дашборде в карточке сайта кнопка «Заявки» появляется автоматически только для сайтов, на которых есть блоки с формами. Нажмите её, чтобы просмотреть все полученные заявки.</p>

        <h3 className="font-bold text-foreground">Типы полей</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { t: "text", d: "Однострочный текст" },
            { t: "email", d: "Email с валидацией" },
            { t: "tel", d: "Телефон" },
            { t: "number", d: "Число" },
            { t: "textarea", d: "Многострочный текст" },
            { t: "select", d: "Выпадающий список" },
            { t: "checkbox", d: "Флажок (да/нет)" },
            { t: "radio", d: "Выбор одного варианта" },
          ].map(f => (
            <div key={f.t} className="glass border border-border rounded-xl p-2 flex items-center gap-2">
              <code className="text-primary text-xs font-mono bg-black/20 px-1.5 py-0.5 rounded">{f.t}</code>
              <span className="text-muted-foreground text-xs">{f.d}</span>
            </div>
          ))}
        </div>
      </div>
    )
  },
  "ecommerce": {
    title: "Интернет-магазин и заказы",
    body: (
      <div className="space-y-5">
        <p>lilluucore позволяет создавать полноценные интернет-магазины с каталогом товаров, корзиной покупок и оформлением заказа — всё это без единой строки кода.</p>

        <h3 className="font-bold text-foreground">Блок Products (Каталог товаров)</h3>
        {[
          { t: "Карточки товаров", d: "Каждый товар: название, описание, цена, фото. Поддерживает загрузку изображения напрямую." },
          { t: "Кнопка «В корзину»", d: "На каждой карточке товара в предпросмотре есть кнопка добавления в корзину." },
          { t: "Скрытие карточек", d: "Отдельные товары можно скрыть через настройку — они не отображаются в предпросмотре." },
        ].map(f => (
          <div key={f.t} className="glass border border-border rounded-xl p-4">
            <p className="text-foreground font-semibold text-sm">{f.t}</p>
            <p className="text-muted-foreground text-sm mt-1">{f.d}</p>
          </div>
        ))}

        <h3 className="font-bold text-foreground">Корзина и оформление заказа</h3>
        <p className="text-muted-foreground text-sm">В предпросмотре сайтов с блоком Products автоматически появляются:</p>
        {[
          { Icon: ShoppingCart, color: "text-violet-400", t: "Плавающая кнопка корзины", d: "В правом нижнем углу предпросмотра. Показывает количество товаров в корзине." },
          { Icon: ClipboardText, color: "text-blue-400", t: "Боковая панель корзины", d: "Открывается по нажатию. Показывает список товаров, позволяет изменить количество или удалить позицию." },
          { Icon: CreditCard, color: "text-emerald-400", t: "Модал оформления заказа", d: "Форма с именем и контактами покупателя. После отправки заказ сохраняется в системе." },
        ].map(f => (
          <div key={f.t} className="glass border border-border rounded-xl p-4 flex gap-3">
            <f.Icon size={24} weight="light" className={`${f.color} flex-shrink-0 mt-0.5`} />
            <div>
              <p className="text-foreground font-semibold text-sm">{f.t}</p>
              <p className="text-muted-foreground text-sm mt-0.5">{f.d}</p>
            </div>
          </div>
        ))}

        <h3 className="font-bold text-foreground">Просмотр заказов</h3>
        <p className="text-muted-foreground text-sm">На дашборде в карточке сайта кнопка «Заказы» появляется автоматически только для сайтов с блоком Products. Все оформленные заказы сохраняются и доступны вам.</p>

        <div className="bg-primary/6 border border-primary/20 rounded-xl p-4">
          <p className="text-primary font-semibold text-sm mb-1">Шаблон «Интернет-магазин»</p>
          <p className="text-muted-foreground text-sm">При создании нового сайта выберите тип «E-commerce» — в него автоматически добавятся блоки Header, Hero, Products, CTA и Footer.</p>
        </div>
      </div>
    )
  },
  "freeze": {
    title: "Заморозка и удаление сайтов",
    body: (
      <div className="space-y-5">
        <p>Администраторы и модераторы платформы могут управлять статусом сайтов: замораживать их при нарушении правил или удалять в крайних случаях.</p>

        <h3 className="font-bold text-foreground">Заморозка сайта</h3>
        <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-4">
          <p className="text-blue-400 font-bold text-sm mb-2">❄ Что происходит при заморозке</p>
          <ul className="space-y-2 text-sm">
            {[
              "Публичный доступ к сайту закрывается — посетители видят страницу «Сайт заморожен»",
              "Все данные, блоки и настройки сайта полностью сохраняются в вашем аккаунте",
              "Вы получаете уведомление в приложении с причиной заморозки",
              "В редакторе можно продолжать работать над сайтом для устранения нарушений",
              "Для разморозки нужно устранить нарушение и написать в поддержку",
            ].map(i => <li key={i} className="flex items-start gap-2 text-muted-foreground"><span className="text-blue-400 mt-0.5">•</span>{i}</li>)}
          </ul>
        </div>

        <h3 className="font-bold text-foreground">Причины заморозки</h3>
        <ul className="space-y-2">
          {[
            "Нарушение Пользовательского соглашения",
            "Запрещённый контент (насилие, экстремизм, мошенничество)",
            "Вредоносный код, фишинг или спам",
            "Нарушение авторских прав",
            "Жалобы других пользователей, подтверждённые модератором",
          ].map(r => <li key={r} className="flex items-start gap-2 text-muted-foreground text-sm"><span className="text-red-400 mt-0.5">⚠</span>{r}</li>)}
        </ul>

        <h3 className="font-bold text-foreground">Что делать если сайт заморожен</h3>
        {[
          { n: "1", t: "Прочитайте причину", d: "Проверьте уведомления (колокольчик) — там указана конкретная причина заморозки." },
          { n: "2", t: "Устраните нарушение", d: "Откройте редактор и исправьте или удалите нарушающий контент. Изменения сохраняются даже при заморозке." },
          { n: "3", t: "Напишите в поддержку", d: "Отправьте сообщение на support@lilluucore.com или откройте чат с модератором прямо в приложении." },
          { n: "4", t: "Ожидайте проверки", d: "Модератор рассмотрит запрос в течение 1–2 рабочих дней и примет решение о разморозке." },
        ].map(step => (
          <div key={step.n} className="flex gap-4 p-4 glass rounded-xl border border-border">
            <div className="gradient-purple w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">{step.n}</div>
            <div><p className="text-foreground font-semibold">{step.t}</p><p className="text-muted-foreground text-sm mt-0.5">{step.d}</p></div>
          </div>
        ))}

        <h3 className="font-bold text-foreground">Удаление сайта</h3>
        <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-4">
          <p className="text-red-400 font-bold text-sm mb-2">⚠ Необратимое действие</p>
          <p className="text-muted-foreground text-sm">Администратор может полностью удалить сайт из системы при грубых нарушениях. В отличие от заморозки, удаление необратимо — все данные, блоки и медиафайлы удаляются безвозвратно. Пользователи могут самостоятельно удалять собственные сайты через дашборд.</p>
        </div>
      </div>
    )
  },
  "chat-support": {
    title: "Чат с поддержкой",
    body: (
      <div className="space-y-4">
        <p>lilluucore имеет встроенный двусторонний мессенджер для общения пользователей с командой поддержки и модераторами — прямо в интерфейсе платформы.</p>

        <h3 className="font-bold text-foreground">Как открыть чат</h3>
        {[
          { n: "1", t: "Зайдите в профиль", d: "Нажмите на аватар в правом верхнем углу → «Профиль»." },
          { n: "2", t: "Раздел «Поддержка»", d: "На странице профиля прокрутите вниз до раздела «Поддержка». Там есть ссылка на чат." },
          { n: "3", t: "Напишите сообщение", d: "Введите текст и нажмите «Отправить». Модераторы получат уведомление и ответят в кратчайшие сроки." },
        ].map(step => (
          <div key={step.n} className="flex gap-4 p-4 glass rounded-xl border border-border">
            <div className="gradient-purple w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">{step.n}</div>
            <div><p className="text-foreground font-semibold">{step.t}</p><p className="text-muted-foreground text-sm mt-0.5">{step.d}</p></div>
          </div>
        ))}

        <h3 className="font-bold text-foreground">Возможности чата</h3>
        {[
          { t: "История сообщений", d: "Все переписки сохраняются. Вы видите всю историю диалога при каждом открытии чата." },
          { t: "Статус прочтения", d: "Видите, прочитал ли модератор ваше сообщение." },
          { t: "Уведомления", d: "При ответе модератора вы получаете уведомление в колокольчике в шапке приложения." },
          { t: "Темы обращений", d: "Пишите о любой ситуации: технические вопросы, разморозка сайта, жалобы, предложения по улучшению." },
        ].map(f => (
          <div key={f.t} className="glass border border-border rounded-xl p-4">
            <p className="text-foreground font-semibold text-sm">{f.t}</p>
            <p className="text-muted-foreground text-sm mt-1">{f.d}</p>
          </div>
        ))}

        <div className="bg-primary/6 border border-primary/20 rounded-xl p-4">
          <p className="text-primary font-semibold text-sm mb-1">Время ответа</p>
          <p className="text-muted-foreground text-sm">Обычно отвечаем в рабочее время (МСК 10:00–19:00) в течение нескольких часов. При срочных вопросах также пишите на support@lilluucore.com.</p>
        </div>
      </div>
    )
  },
  "admin-roles": {
    title: "Роли и права доступа",
    body: (
      <div className="space-y-4">
        <p>В lilluucore есть три уровня доступа: обычный пользователь, модератор и администратор. Роли назначаются администратором платформы.</p>

        <div className="space-y-3">
          {[
            {
              role: "Пользователь",
              badge: "bg-gray-500/15 text-gray-300",
              Icon: User,
              iconColor: "text-gray-400",
              access: [
                "Создание и редактирование своих сайтов",
                "Просмотр аналитики своих сайтов",
                "Управление своим профилем и тарифом",
                "Чат с поддержкой",
                "Получение уведомлений",
              ],
              noaccess: ["Просмотр чужих сайтов", "Управление другими пользователями", "Отправка уведомлений другим"],
            },
            {
              role: "Модератор",
              badge: "bg-blue-500/15 text-blue-300",
              Icon: Shield,
              iconColor: "text-blue-400",
              access: [
                "Все права пользователя",
                "Просмотр списка всех сайтов платформы",
                "Заморозка и разморозка сайтов с указанием причины",
                "Чат с любым пользователем (поддержка)",
                "Отправка уведомлений отдельным пользователям",
                "Рассылка уведомлений всем пользователям (broadcast)",
              ],
              noaccess: ["Управление пользователями (роли, тарифы)", "Системная статистика", "Удаление пользователей"],
            },
            {
              role: "Администратор",
              badge: "bg-amber-500/15 text-amber-300",
              Icon: Crown,
              iconColor: "text-amber-400",
              access: [
                "Все права модератора",
                "Управление пользователями: смена роли, тарифа, блокировка",
                "Удаление пользователей из системы",
                "Удаление любых сайтов",
                "Просмотр системной статистики (CPU, RAM, БД)",
                "Блокировка дампа памяти для конкретного пользователя",
                "Полный доступ ко всем разделам админ-панели",
              ],
              noaccess: [],
            },
          ].map(r => (
            <div key={r.role} className="p-4 rounded-xl border glass border-white/8">
              <div className="flex items-center gap-2 mb-3">
                <r.Icon size={16} weight="light" className={r.iconColor} />
                <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${r.badge}`}>{r.role}</span>
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-2">Доступно</p>
              <ul className="space-y-1 mb-3">
                {r.access.map(a => <li key={a} className="text-muted-foreground text-xs flex gap-1.5"><span className="text-emerald-400 mt-0.5">✓</span>{a}</li>)}
              </ul>
              {r.noaccess.length > 0 && (
                <>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-2">Недоступно</p>
                  <ul className="space-y-1">
                    {r.noaccess.map(a => <li key={a} className="text-muted-foreground text-xs flex gap-1.5"><span className="text-red-400 mt-0.5">✕</span>{a}</li>)}
                  </ul>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  },
  "admin-users": {
    title: "Управление пользователями",
    body: (
      <div className="space-y-4">
        <p>Раздел «Пользователи» в админ-панели доступен только для администраторов. Здесь можно просматривать и управлять всеми аккаунтами платформы.</p>

        <h3 className="font-bold text-foreground">Доступные действия</h3>
        {[
          { t: "Просмотр пользователей", d: "Список всех зарегистрированных пользователей с информацией: email, имя, роль, тариф, дата регистрации, количество сайтов." },
          { t: "Смена роли", d: "Назначьте пользователю роль «Модератор» для доступа к панели модерации или верните в «Пользователь»." },
          { t: "Смена тарифа", d: "Вручную измените тариф пользователя на Free, Pro или Business. Изменения вступают в силу немедленно — при следующем обновлении страницы у пользователя." },
          { t: "Блокировка дампа памяти", d: "Заблокируйте экспорт данных для конкретного пользователя с указанием причины. Пользователь увидит предупреждение в профиле." },
          { t: "Отправка уведомления", d: "Отправьте персональное уведомление пользователю прямо из его карточки в панели." },
          { t: "Удаление аккаунта", d: "Необратимое удаление пользователя и всех его данных. Используется только в крайних случаях (мошенничество, грубые нарушения)." },
        ].map(a => (
          <div key={a.t} className="glass border border-border rounded-xl p-4">
            <p className="text-foreground font-semibold text-sm">{a.t}</p>
            <p className="text-muted-foreground text-sm mt-1">{a.d}</p>
          </div>
        ))}

        <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-4">
          <p className="text-amber-400 font-semibold text-sm mb-1">Важно об изменении тарифа</p>
          <p className="text-muted-foreground text-sm">После изменения тарифа администратором пользователю нужно обновить страницу — новый план применится автоматически через синхронизацию при загрузке приложения.</p>
        </div>
      </div>
    )
  },
  "api-overview": {
    title: "Обзор API",
    body: (
      <div className="space-y-5">
        <p>lilluucore имеет полноценный REST API, который используется фронтендом и доступен для интеграций. API работает по протоколу HTTPS и возвращает JSON.</p>

        <div className="bg-primary/6 border border-primary/20 rounded-xl p-4">
          <p className="text-primary font-bold text-sm mb-1">Base URL</p>
          <code className="text-emerald-400 font-mono text-sm">https://your-domain/api</code>
          <p className="text-muted-foreground text-xs mt-2">Все эндпоинты начинаются с <code className="text-primary">/api</code>. В локальной разработке — <code className="text-primary">http://localhost:8080/api</code></p>
        </div>

        <h3 className="font-bold text-foreground">Две реализации бэкенда</h3>
        <div className="grid grid-cols-1 gap-3">
          {[
            { t: "Node.js + Express 5", badge: "bg-emerald-500/15 text-emerald-400", d: "Основной бэкенд. Порт 8080. TypeScript, Drizzle ORM, JWT, OpenAI GPT-4o, объектное хранилище." },
            { t: "Spring Boot 3 (Java 21)", badge: "bg-blue-500/15 text-blue-400", d: "Альтернативный бэкенд. Порт 8090. Полная совместимость с теми же JWT-токенами и PostgreSQL-схемой." },
          ].map(b => (
            <div key={b.t} className="glass border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-foreground font-semibold text-sm">{b.t}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.badge}`}>Активен</span>
              </div>
              <p className="text-muted-foreground text-sm">{b.d}</p>
            </div>
          ))}
        </div>

        <h3 className="font-bold text-foreground">Формат ответов</h3>
        <div className="bg-black/30 rounded-xl p-4 font-mono text-sm">
          <div className="text-green-400">{"// Успех"}</div>
          <div className="text-white/80">{"{ \"id\": \"abc123\", \"name\": \"Мой сайт\", ... }"}</div>
          <div className="mt-3 text-red-400">{"// Ошибка"}</div>
          <div className="text-white/80">{"{ \"message\": \"Описание ошибки\" }"}</div>
        </div>

        <h3 className="font-bold text-foreground">HTTP-коды ответов</h3>
        <div className="space-y-2">
          {[
            { code: "200 OK", d: "Успешный запрос" },
            { code: "201 Created", d: "Ресурс создан" },
            { code: "204 No Content", d: "Успешное удаление" },
            { code: "400 Bad Request", d: "Ошибка валидации данных" },
            { code: "401 Unauthorized", d: "Отсутствует или неверный JWT-токен" },
            { code: "403 Forbidden", d: "Нет прав доступа (требуется admin/moderator)" },
            { code: "404 Not Found", d: "Ресурс не найден" },
            { code: "409 Conflict", d: "Конфликт данных (например, email уже занят)" },
          ].map(r => (
            <div key={r.code} className="flex items-center gap-3 text-sm">
              <code className={`font-mono text-xs px-2 py-0.5 rounded font-bold flex-shrink-0 ${r.code.startsWith("2") ? "bg-emerald-500/15 text-emerald-400" : r.code.startsWith("4") ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"}`}>{r.code}</code>
              <span className="text-muted-foreground">{r.d}</span>
            </div>
          ))}
        </div>
      </div>
    )
  },
  "api-auth": {
    title: "Авторизация (JWT)",
    body: (
      <div className="space-y-5">
        <p>API использует JWT (JSON Web Token) для аутентификации. Токен передаётся в заголовке <code className="bg-secondary px-1.5 py-0.5 rounded text-primary font-mono text-sm">Authorization</code> каждого запроса.</p>

        <h3 className="font-bold text-foreground">Получение токена</h3>
        <div className="bg-black/30 rounded-xl p-4 font-mono text-sm space-y-1">
          <div className="text-blue-400">POST /api/auth/login</div>
          <div className="text-white/40">{"// Body:"}</div>
          <div className="text-white/80">{"{"}</div>
          <div className="text-white/80 pl-4">{"\"email\": \"user@example.com\","}</div>
          <div className="text-white/80 pl-4">{"\"password\": \"secret123\""}</div>
          <div className="text-white/80">{"}"}</div>
          <div className="mt-3 text-white/40">{"// Response:"}</div>
          <div className="text-white/80">{"{ \"token\": \"eyJhbGci...\", \"userId\": \"abc\", ... }"}</div>
        </div>

        <h3 className="font-bold text-foreground">Использование токена</h3>
        <div className="bg-black/30 rounded-xl p-4 font-mono text-sm">
          <div className="text-blue-400">GET /api/auth/me</div>
          <div className="text-white/40">{"// Headers:"}</div>
          <div className="text-white/80">{"Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}</div>
        </div>

        <h3 className="font-bold text-foreground">Параметры токена</h3>
        {[
          { t: "Алгоритм", d: "HS256 (HMAC SHA-256)" },
          { t: "Claim", d: "userId — ID пользователя в базе данных" },
          { t: "Срок жизни", d: "7 дней с момента выдачи" },
          { t: "Секрет", d: "SESSION_SECRET переменная окружения" },
          { t: "Хранение (браузер)", d: "localStorage под ключом sb_token" },
        ].map(p => (
          <div key={p.t} className="flex justify-between items-center py-2 border-b border-white/6 last:border-0">
            <span className="text-foreground font-medium text-sm">{p.t}</span>
            <code className="text-muted-foreground text-xs font-mono">{p.d}</code>
          </div>
        ))}

        <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-4">
          <p className="text-emerald-400 font-semibold text-sm mb-1">Совместимость Node.js ↔ Spring Boot</p>
          <p className="text-muted-foreground text-sm">Оба бэкенда используют один и тот же <code className="text-primary">SESSION_SECRET</code> и формат JWT. Токен, полученный от Node.js, принимается Spring Boot и наоборот — вы можете переключить фронтенд на любой бэкенд без повторного входа.</p>
        </div>
      </div>
    )
  },
  "api-sites": {
    title: "API: Сайты и блоки",
    body: (
      <div className="space-y-5">
        <p>Основные операции с сайтами, страницами и блоками. Все запросы требуют JWT-токена в заголовке <code className="bg-secondary px-1.5 py-0.5 rounded text-primary font-mono text-xs">Authorization: Bearer TOKEN</code>.</p>

        <h3 className="font-bold text-foreground">Сайты</h3>
        <div className="space-y-2">
          {[
            { method: "GET", path: "/sites", d: "Список сайтов текущего пользователя (с блоками и страницами)" },
            { method: "POST", path: "/sites", d: "Создать новый сайт: name, businessType, subdomain" },
            { method: "GET", path: "/sites/:id", d: "Получить один сайт со всеми данными" },
            { method: "DELETE", path: "/sites/:id", d: "Удалить сайт и все его данные" },
            { method: "POST", path: "/sites/:id/publish", d: "Опубликовать сайт → статус PUBLISHED" },
            { method: "PUT", path: "/sites/:id/styles", d: "Обновить globalStyles (шрифт, акцентный цвет)" },
            { method: "GET", path: "/sites/:id/stats", d: "Статистика сайта: просмотры, клики, посетители" },
            { method: "GET", path: "/public/sites/:id", d: "Публичный просмотр сайта (без токена)" },
          ].map(e => (
            <div key={e.path} className="flex items-start gap-3 text-sm py-2 border-b border-white/5 last:border-0">
              <span className={`font-mono text-xs px-2 py-0.5 rounded font-bold flex-shrink-0 ${e.method === "GET" ? "bg-blue-500/15 text-blue-400" : e.method === "POST" ? "bg-emerald-500/15 text-emerald-400" : e.method === "DELETE" ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"}`}>{e.method}</span>
              <code className="text-primary font-mono text-xs flex-shrink-0">{e.path}</code>
              <span className="text-muted-foreground text-xs">{e.d}</span>
            </div>
          ))}
        </div>

        <h3 className="font-bold text-foreground">Страницы</h3>
        <div className="space-y-2">
          {[
            { method: "GET", path: "/sites/:id/pages", d: "Список страниц сайта" },
            { method: "POST", path: "/sites/:id/pages", d: "Создать страницу: name, slug" },
            { method: "PUT", path: "/sites/:id/pages/:pageId", d: "Обновить страницу: name, slug, meta" },
            { method: "DELETE", path: "/sites/:id/pages/:pageId", d: "Удалить страницу (нельзя удалить последнюю)" },
          ].map(e => (
            <div key={e.path} className="flex items-start gap-3 text-sm py-2 border-b border-white/5 last:border-0">
              <span className={`font-mono text-xs px-2 py-0.5 rounded font-bold flex-shrink-0 ${e.method === "GET" ? "bg-blue-500/15 text-blue-400" : e.method === "POST" ? "bg-emerald-500/15 text-emerald-400" : e.method === "DELETE" ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"}`}>{e.method}</span>
              <code className="text-primary font-mono text-xs flex-shrink-0">{e.path}</code>
              <span className="text-muted-foreground text-xs">{e.d}</span>
            </div>
          ))}
        </div>

        <h3 className="font-bold text-foreground">Блоки</h3>
        <div className="space-y-2">
          {[
            { method: "POST", path: "/sites/:id/blocks", d: "Добавить блок: type, pageId, position, content, styles" },
            { method: "PUT", path: "/sites/:id/blocks/:blockId", d: "Обновить блок: content, styles, visible, width, position" },
            { method: "DELETE", path: "/sites/:id/blocks/:blockId", d: "Удалить блок" },
            { method: "PUT", path: "/sites/:id/blocks/reorder", d: "Изменить порядок блоков: { ids: [\"id1\",\"id2\",...] }" },
          ].map(e => (
            <div key={e.path} className="flex items-start gap-3 text-sm py-2 border-b border-white/5 last:border-0">
              <span className={`font-mono text-xs px-2 py-0.5 rounded font-bold flex-shrink-0 ${e.method === "GET" ? "bg-blue-500/15 text-blue-400" : e.method === "POST" ? "bg-emerald-500/15 text-emerald-400" : e.method === "DELETE" ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"}`}>{e.method}</span>
              <code className="text-primary font-mono text-xs flex-shrink-0">{e.path}</code>
              <span className="text-muted-foreground text-xs">{e.d}</span>
            </div>
          ))}
        </div>

        <h3 className="font-bold text-foreground">Формы и заявки</h3>
        <div className="space-y-2">
          {[
            { method: "POST", path: "/sites/:id/form-submit", d: "Отправить заявку (без токена, публичный)" },
            { method: "GET", path: "/sites/:id/form-submissions", d: "Просмотр заявок сайта (только владелец)" },
          ].map(e => (
            <div key={e.path} className="flex items-start gap-3 text-sm py-2 border-b border-white/5 last:border-0">
              <span className={`font-mono text-xs px-2 py-0.5 rounded font-bold flex-shrink-0 ${e.method === "GET" ? "bg-blue-500/15 text-blue-400" : "bg-emerald-500/15 text-emerald-400"}`}>{e.method}</span>
              <code className="text-primary font-mono text-xs flex-shrink-0">{e.path}</code>
              <span className="text-muted-foreground text-xs">{e.d}</span>
            </div>
          ))}
        </div>
      </div>
    )
  },
  "api-spring": {
    title: "Spring Boot бэкенд",
    body: (
      <div className="space-y-5">
        <p>В дополнение к основному Node.js-серверу разработан полноценный альтернативный бэкенд на <strong className="text-foreground">Spring Boot 3.2.5 / Java 21</strong>. Оба бэкенда используют одну PostgreSQL-базу и совместимы на уровне токенов и JSON-ответов.</p>

        <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Cpu size={16} weight="light" className="text-blue-400" />
            <p className="text-blue-400 font-bold text-sm">Технический стек Spring Boot</p>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-xs text-muted-foreground">
            {[
              "Spring Boot 3.2.5",
              "Java 21 (LTS)",
              "Spring Security 6",
              "Spring Data JPA",
              "JJWT 0.12.5 (JWT)",
              "BCrypt (strength 10)",
              "PostgreSQL JDBC",
              "Hibernate 6",
              "Bean Validation",
              "Maven Build",
            ].map(t => <span key={t} className="flex gap-1.5"><span className="text-blue-400">▸</span>{t}</span>)}
          </div>
        </div>

        <h3 className="font-bold text-foreground">Архитектура (44 Java-файла)</h3>
        <div className="space-y-2">
          {[
            { layer: "entity/", desc: "8 JPA-сущностей: User, UserSettings, Site, Page, Block, Notification, ChatMessage, FormSubmission", color: "text-violet-400" },
            { layer: "repository/", desc: "8 Spring Data JPA репозиториев с кастомными JPQL-запросами (@Query)", color: "text-blue-400" },
            { layer: "service/", desc: "AuthService, SiteService, AdminService, ChatService, NotificationService, BillingService", color: "text-emerald-400" },
            { layer: "controller/", desc: "7 REST-контроллеров — все те же эндпоинты /api/...", color: "text-pink-400" },
            { layer: "security/", desc: "JwtUtil (генерация/валидация), JwtAuthFilter (OncePerRequestFilter)", color: "text-amber-400" },
            { layer: "config/", desc: "SecurityConfig, CorsConfig, GlobalExceptionHandler", color: "text-cyan-400" },
          ].map(l => (
            <div key={l.layer} className="glass border border-border rounded-xl p-3 flex gap-3">
              <code className={`font-mono text-sm font-bold flex-shrink-0 ${l.color}`}>{l.layer}</code>
              <span className="text-muted-foreground text-sm">{l.desc}</span>
            </div>
          ))}
        </div>

        <h3 className="font-bold text-foreground">Расположение в репозитории</h3>
        <div className="bg-black/30 rounded-xl p-4 font-mono text-sm space-y-1 text-white/70">
          <div>artifacts/api-server-spring/</div>
          <div className="pl-4">├── pom.xml</div>
          <div className="pl-4">├── README.md</div>
          <div className="pl-4">└── src/main/java/com/lilluucore/</div>
          <div className="pl-8 text-white/40">├── LilluucoreApplication.java</div>
          <div className="pl-8 text-blue-400">├── config/ (Security, CORS, Exceptions)</div>
          <div className="pl-8 text-violet-400">├── entity/ (8 JPA entities)</div>
          <div className="pl-8 text-emerald-400">├── repository/ (8 JPA repos)</div>
          <div className="pl-8 text-pink-400">├── service/ (6 services)</div>
          <div className="pl-8 text-amber-400">├── controller/ (7 controllers)</div>
          <div className="pl-8 text-cyan-400">└── security/ (JWT)</div>
        </div>

        <h3 className="font-bold text-foreground">Запуск Spring Boot бэкенда</h3>
        <div className="bg-black/30 rounded-xl p-4 font-mono text-sm space-y-2 text-white/80">
          <div className="text-white/40"># Требуется Java 21 и Maven</div>
          <div><span className="text-emerald-400">$</span> cd artifacts/api-server-spring</div>
          <div><span className="text-emerald-400">$</span> mvn spring-boot:run</div>
          <div className="mt-2 text-white/40"># Или собрать JAR:</div>
          <div><span className="text-emerald-400">$</span> mvn package -DskipTests</div>
          <div><span className="text-emerald-400">$</span> java -jar target/api-server-spring-1.0.0.jar</div>
        </div>

        <h3 className="font-bold text-foreground">Переменные окружения</h3>
        <div className="space-y-2">
          {[
            { name: "DATABASE_URL", d: "PostgreSQL connection string (та же, что у Node.js)" },
            { name: "SESSION_SECRET", d: "JWT-секрет (совместим с Node.js токенами)" },
            { name: "PORT", d: "Порт сервера (по умолчанию 8090, Node.js — 8080)" },
          ].map(v => (
            <div key={v.name} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
              <code className="text-primary font-mono text-sm flex-shrink-0">{v.name}</code>
              <span className="text-muted-foreground text-sm">{v.d}</span>
            </div>
          ))}
        </div>

        <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-4">
          <p className="text-emerald-400 font-semibold text-sm mb-1">Полная совместимость</p>
          <p className="text-muted-foreground text-sm">Spring Boot бэкенд <strong className="text-foreground">не изменяет</strong> схему БД (ddl-auto=validate). Оба сервера работают одновременно с одной базой данных. Переключение фронтенда — смена порта в VITE_API_URL.</p>
        </div>
      </div>
    )
  },
  "db-dump": {
    title: "Дамп базы данных",
    body: (
      <div className="space-y-5">
        <p>lilluucore поддерживает полный экспорт базы данных в формате SQL-дампа. Дамп содержит DDL (схему) и все данные — готов для восстановления в любой PostgreSQL-инстанс.</p>

        <div className="bg-primary/6 border border-primary/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileArrowDown size={16} weight="light" className="text-primary" />
            <p className="text-primary font-bold text-sm">Текущий дамп платформы</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            {[
              ["Таблиц", "9"],
              ["Файл", "lilluucore_db_dump.sql"],
              ["Размер", "~138 KB (сжатый: ~75 KB)"],
              ["Формат", "PostgreSQL SQL"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span>{k}:</span>
                <code className="text-primary font-mono text-xs">{v}</code>
              </div>
            ))}
          </div>
        </div>

        <h3 className="font-bold text-foreground">Что содержит дамп</h3>
        <div className="space-y-2">
          {[
            { t: "DDL: CREATE TABLE", d: "Полные определения всех 9 таблиц с типами колонок, NOT NULL, DEFAULT, PRIMARY KEY, FOREIGN KEY и UNIQUE." },
            { t: "Последовательности", d: "CREATE SEQUENCE для всех auto-increment колонок (notifications_id_seq, chat_messages_id_seq и др.)." },
            { t: "Данные: INSERT INTO", d: "Все строки из каждой таблицы с корректным экранированием специальных символов." },
            { t: "Сброс последовательностей", d: "setval() после вставки данных — чтобы следующие ID продолжались корректно." },
          ].map(s => (
            <div key={s.t} className="glass border border-border rounded-xl p-4">
              <p className="text-foreground font-semibold text-sm">{s.t}</p>
              <p className="text-muted-foreground text-sm mt-1">{s.d}</p>
            </div>
          ))}
        </div>

        <h3 className="font-bold text-foreground">Восстановление дампа</h3>
        <div className="bg-black/30 rounded-xl p-4 font-mono text-sm space-y-2">
          <div className="text-white/40"># Восстановить в новую БД</div>
          <div className="text-white/80"><span className="text-emerald-400">$</span> psql $DATABASE_URL {"<"} lilluucore_db_dump.sql</div>
          <div className="mt-2 text-white/40"># Или с распаковкой zip</div>
          <div className="text-white/80"><span className="text-emerald-400">$</span> unzip lilluucore_db_dump.zip</div>
          <div className="text-white/80"><span className="text-emerald-400">$</span> psql $DATABASE_URL {"<"} lilluucore_db_dump.sql</div>
        </div>

        <h3 className="font-bold text-foreground">Таблицы в дампе</h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { table: "users", rows: "4" },
            { table: "user_settings", rows: "4" },
            { table: "sites", rows: "5" },
            { table: "pages", rows: "8" },
            { table: "blocks", rows: "60" },
            { table: "notifications", rows: "9" },
            { table: "chat_messages", rows: "4" },
            { table: "form_submissions", rows: "4" },
            { table: "site_analytics", rows: "0" },
          ].map(r => (
            <div key={r.table} className="glass border border-border rounded-lg p-2.5 text-center">
              <code className="text-primary font-mono text-xs block">{r.table}</code>
              <span className="text-muted-foreground text-xs">{r.rows} строк</span>
            </div>
          ))}
        </div>

        <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-4">
          <p className="text-amber-400 font-semibold text-sm mb-1">Важно о паролях</p>
          <p className="text-muted-foreground text-sm">Пароли в дампе хранятся в виде BCrypt-хэшей (strength 10). Оригинальные пароли восстановить невозможно — это стандарт безопасности.</p>
        </div>
      </div>
    )
  },
  "db-schema": {
    title: "Схема базы данных",
    body: (
      <div className="space-y-5">
        <p>PostgreSQL-база данных lilluucore содержит 9 таблиц. Схема одинакова для Node.js и Spring Boot бэкендов — оба работают с одной базой.</p>

        <div className="space-y-4">
          {[
            {
              table: "users",
              color: "text-violet-400",
              desc: "Аккаунты пользователей",
              cols: [
                { n: "id", t: "varchar", note: "PK, nanoid" },
                { n: "email", t: "text", note: "UNIQUE, NOT NULL" },
                { n: "password_hash", t: "text", note: "BCrypt" },
                { n: "first_name, last_name", t: "text", note: "NOT NULL" },
                { n: "plan", t: "text", note: "free / pro / business" },
                { n: "role", t: "text", note: "user / moderator / admin" },
                { n: "created_at", t: "timestamp", note: "DEFAULT now()" },
              ]
            },
            {
              table: "sites",
              color: "text-blue-400",
              desc: "Сайты пользователей",
              cols: [
                { n: "id", t: "varchar", note: "PK" },
                { n: "user_id", t: "varchar", note: "FK → users(id)" },
                { n: "name, subdomain, business_type", t: "text", note: "NOT NULL" },
                { n: "status", t: "text", note: "DRAFT / PUBLISHED" },
                { n: "global_styles", t: "text", note: "JSON" },
                { n: "frozen, frozen_reason, frozen_by", t: "bool/text/varchar", note: "Модерация" },
                { n: "created_at, updated_at", t: "timestamp", note: "" },
              ]
            },
            {
              table: "pages",
              color: "text-emerald-400",
              desc: "Страницы сайтов",
              cols: [
                { n: "id", t: "varchar", note: "PK" },
                { n: "site_id", t: "varchar", note: "FK → sites(id) CASCADE" },
                { n: "name, slug", t: "text", note: "NOT NULL" },
                { n: "position", t: "integer", note: "Порядок" },
                { n: "meta", t: "text", note: "JSON (SEO)" },
              ]
            },
            {
              table: "blocks",
              color: "text-pink-400",
              desc: "Блоки страниц",
              cols: [
                { n: "id", t: "varchar", note: "PK" },
                { n: "site_id", t: "varchar", note: "FK → sites(id) CASCADE" },
                { n: "page_id", t: "varchar", note: "FK → pages(id) SET NULL" },
                { n: "type", t: "text", note: "HERO / FEATURES / ... (24+ типов)" },
                { n: "position, width", t: "integer", note: "Порядок и ширина %" },
                { n: "content, styles", t: "text", note: "JSON-строки" },
                { n: "visible", t: "boolean", note: "Видимость" },
              ]
            },
            {
              table: "notifications",
              color: "text-amber-400",
              desc: "Уведомления пользователей",
              cols: [
                { n: "id", t: "serial", note: "PK auto-increment" },
                { n: "user_id", t: "varchar", note: "FK → users(id)" },
                { n: "type", t: "text", note: "info / warning / error / success / moderation" },
                { n: "title, message", t: "text", note: "NOT NULL" },
                { n: "read", t: "boolean", note: "DEFAULT false" },
              ]
            },
          ].map(tbl => (
            <div key={tbl.table} className="glass border border-border rounded-xl overflow-hidden">
              <div className={`px-4 py-2.5 border-b border-white/6 flex items-center gap-2`}>
                <Database size={14} weight="light" className={tbl.color} />
                <code className={`font-mono font-bold text-sm ${tbl.color}`}>{tbl.table}</code>
                <span className="text-muted-foreground text-xs ml-1">— {tbl.desc}</span>
              </div>
              <div className="p-3 space-y-1.5">
                {tbl.cols.map(c => (
                  <div key={c.n} className="flex items-center gap-2 text-xs">
                    <code className="text-primary font-mono">{c.n}</code>
                    <span className="text-white/30">·</span>
                    <code className="text-muted-foreground font-mono">{c.t}</code>
                    {c.note && <span className="text-white/30 ml-auto">{c.note}</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-primary/6 border border-primary/20 rounded-xl p-4">
          <p className="text-primary font-semibold text-sm mb-1">Управление схемой</p>
          <p className="text-muted-foreground text-sm">В Node.js-проекте схема определена в <code className="text-primary font-mono">lib/db/src/schema/index.ts</code> через Drizzle ORM. Для применения изменений схемы: <code className="text-primary font-mono">pnpm --filter @workspace/db run push</code>. Spring Boot использует режим <code className="text-primary font-mono">validate</code> и не изменяет схему.</p>
        </div>
      </div>
    )
  },
  "admin-panel": {
    title: "Панель администратора",
    body: (
      <div className="space-y-5">
        <p>Администраторы и модераторы имеют доступ к специальной панели управления платформой по адресу <code className="bg-secondary px-2 py-0.5 rounded text-primary font-mono text-sm">/admin</code>. Ссылка появляется в меню профиля.</p>

        <h3 className="font-bold text-foreground">Вкладки панели</h3>
        <div className="space-y-3">
          {[
            { t: "Обзор", who: "Только Admin", badge: "bg-amber-500/15 text-amber-400", d: "Ключевые метрики платформы: всего пользователей, сайтов, опубликованных сайтов, активных за 30 дней. Графики роста по месяцам." },
            { t: "Пользователи", who: "Только Admin", badge: "bg-amber-500/15 text-amber-400", d: "Полный список пользователей. Смена роли, тарифа, блокировка дампа, удаление. Поиск по email и имени." },
            { t: "Сайты", who: "Admin + Moderator", badge: "bg-blue-500/15 text-blue-400", d: "Список всех сайтов платформы. Кнопки заморозки/разморозки с причиной, удаление сайта. Фильтр по статусу." },
            { t: "Уведомления", who: "Admin + Moderator", badge: "bg-blue-500/15 text-blue-400", d: "Отправка уведомлений отдельным пользователям или broadcast всем. Типы: Информация, Предупреждение, Модерация, Успех, Ошибка. Шаблоны для частых ситуаций." },
            { t: "Чат", who: "Admin + Moderator", badge: "bg-blue-500/15 text-blue-400", d: "Список всех диалогов с пользователями. Полноценный двусторонний мессенджер: история переписки, статус прочтения, ответы в реальном времени." },
            { t: "Система", who: "Только Admin", badge: "bg-amber-500/15 text-amber-400", d: "Системная информация: использование CPU, RAM, размер базы данных, версия Node.js, аптайм сервера. Управление блокировкой дампов для всех пользователей." },
          ].map(tab => (
            <div key={tab.t} className="glass border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-foreground font-semibold text-sm">{tab.t}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tab.badge}`}>{tab.who}</span>
              </div>
              <p className="text-muted-foreground text-sm">{tab.d}</p>
            </div>
          ))}
        </div>

        <h3 className="font-bold text-foreground">Broadcast уведомлений</h3>
        <p className="text-muted-foreground text-sm">Во вкладке «Уведомления» кнопка «Отправить всем» открывает форму broadcast. Введите заголовок и текст — уведомление получат все пользователи платформы одновременно. Используется для объявлений о техническом обслуживании, новых функциях или важных изменениях.</p>
      </div>
    )
  },
};

const DEFAULT_CONTENT = {
  title: "Документация",
  body: <p className="text-muted-foreground">Выберите раздел в левой панели.</p>
};

export default function DocsPage() {
  const [, nav] = useLocation();
  const [openSection, setOpenSection] = useState("start");
  const [activeArticle, setActiveArticle] = useState("what-is");

  const content = CONTENT[activeArticle] || DEFAULT_CONTENT;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <div className="max-w-6xl mx-auto px-6 py-10 flex gap-8">
        {/* Sidebar */}
        <div className="w-56 flex-shrink-0">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-4">Разделы</p>
          <div className="space-y-1">
            {SECTIONS.map((section) => {
              const isOpen = openSection === section.id;
              return (
                <div key={section.id}>
                  <button
                    onClick={() => setOpenSection(isOpen ? "" : section.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${isOpen ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}
                  >
                    <section.Icon size={15} weight="light" />
                    <span className="flex-1 text-left">{section.label}</span>
                    {isOpen ? <CaretDown size={13} /> : <CaretRight size={13} />}
                  </button>
                  {isOpen && (
                    <div className="pl-6 mt-0.5 space-y-0.5">
                      {section.articles.map(a => (
                        <button key={a.id} onClick={() => setActiveArticle(a.id)}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all ${activeArticle === a.id ? "text-primary bg-primary/10 font-medium" : "text-muted-foreground hover:text-foreground"}`}>
                          {a.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="glass border border-white/8 rounded-2xl p-8">
            <h1 className="text-2xl font-black text-foreground mb-6">{content.title}</h1>
            <div className="text-muted-foreground leading-relaxed space-y-3">
              {content.body}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
