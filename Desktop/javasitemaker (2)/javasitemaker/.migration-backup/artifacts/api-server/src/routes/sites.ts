import { Router } from "express";
import { db, sitesTable, blocksTable, siteAnalyticsTable, pagesTable, formSubmissionsTable } from "@workspace/db";
import { eq, and, desc, asc } from "drizzle-orm";
import { authUser } from "./auth";

const router = Router();

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function makeStats(days: number) {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.now() - (days - 1 - i) * 86400000);
    const label = d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
    const views = Math.floor(Math.random() * 500) + 50;
    const visitors = Math.floor(views * 0.7);
    return {
      date: label, views,
      clicks: Math.floor(views * 0.3),
      visitors, newRegistrations: Math.floor(Math.random() * 20),
      avgSessionSec: Math.floor(Math.random() * 180) + 60,
    };
  });
}

const BLOCK_DEFAULTS: Record<string, { content: string; styles: string }> = {
  HERO: { content: JSON.stringify({ title: "Создайте что-то великое", subtitle: "Профессиональный лендинг за минуты — без кода", cta: "Начать бесплатно", ctaUrl: "#", ctaSecondary: "Узнать больше", ctaSecondaryUrl: "#", bgImage: "" }), styles: JSON.stringify({ bg: "#0a0a1a", textColor: "#ffffff", ctaColor: "#7C3AED", align: "center", minHeight: "90vh" }) },
  FEATURES: { content: JSON.stringify({ title: "Почему выбирают нас", subtitle: "Всё необходимое для успеха вашего бизнеса", items: [{ icon: "Zap", title: "Молниеносная скорость", desc: "Страницы загружаются мгновенно. Core Web Vitals 100/100." }, { icon: "Shield", title: "Надёжная безопасность", desc: "SSL, DDoS-защита и ежедневное резервное копирование." }, { icon: "Palette", title: "Гибкий дизайн", desc: "Сотни блоков и неограниченная кастомизация." }, { icon: "BarChart2", title: "Встроенная аналитика", desc: "Следите за посещаемостью в реальном времени." }, { icon: "Globe", title: "Кастомный домен", desc: "Подключите свой домен за 2 минуты." }, { icon: "Headphones", title: "Поддержка 24/7", desc: "Команда готова помочь в любое время." }] }), styles: JSON.stringify({ bg: "#0f0f23", textColor: "#e2e8f0", columns: 3 }) },
  PRICING: { content: JSON.stringify({ title: "Простые тарифы", subtitle: "Начните бесплатно, масштабируйтесь по мере роста", plans: [{ name: "Free", price: "$0", period: "мес", features: ["1 сайт", "5 блоков", "Домен .lilluucore.com"], cta: "Начать", ctaUrl: "#" }, { name: "Pro", price: "$19", period: "мес", features: ["10 сайтов", "∞ блоков", "Кастомный домен", "Аналитика", "Приоритетная поддержка"], highlighted: true, cta: "Попробовать 14 дней", ctaUrl: "#" }, { name: "Business", price: "$49", period: "мес", features: ["∞ сайтов", "∞ блоков", "White Label", "API доступ", "Команда"], cta: "Обсудить", ctaUrl: "#" }] }), styles: JSON.stringify({ bg: "#0a0a14", textColor: "#ffffff" }) },
  TESTIMONIALS: { content: JSON.stringify({ title: "Что говорят клиенты", subtitle: "Тысячи предпринимателей уже используют наш сервис", items: [{ text: "Создал лендинг за 20 минут. Конверсия выросла на 40%!", author: "Иван Петров", role: "CEO, Startup.ru", avatar: "" }, { text: "Наконец-то конструктор, который не нужно изучать неделями.", author: "Мария Смирнова", role: "Фрилансер", avatar: "" }, { text: "Клиенты думают, что это ручная разработка. Я не говорю иначе.", author: "Алексей Новиков", role: "Digital-маркетолог", avatar: "" }] }), styles: JSON.stringify({ bg: "#0f0f23", textColor: "#cbd5e1" }) },
  CTA: { content: JSON.stringify({ title: "Готовы создать сайт мечты?", subtitle: "Присоединяйтесь к 10 000+ пользователей. Первый сайт — бесплатно.", cta: "Начать бесплатно", ctaUrl: "#", ctaSecondary: "Посмотреть демо", ctaSecondaryUrl: "#" }), styles: JSON.stringify({ bg: "linear-gradient(135deg, #7C3AED, #4F46E5)", textColor: "#ffffff" }) },
  FOOTER: { content: JSON.stringify({ company: "Моя Компания", slogan: "Строим будущее вместе", links: [{ label: "О нас", url: "#" }, { label: "Блог", url: "#" }, { label: "Документация", url: "#" }, { label: "Контакты", url: "#" }, { label: "Политика", url: "#" }], socials: ["twitter", "instagram", "linkedin"], copyright: "© 2025 Моя Компания. Все права защищены." }), styles: JSON.stringify({ bg: "#050510", textColor: "#475569" }) },
  PRODUCTS: { content: JSON.stringify({ title: "Каталог товаров", subtitle: "Лучшее из нашей коллекции", items: [{ name: "Товар 1", price: "1 200₽", image: "", badge: "Хит", description: "Описание товара" }, { name: "Товар 2", price: "2 800₽", image: "", badge: "Новинка", description: "Описание товара" }, { name: "Товар 3", price: "950₽", image: "", badge: "", description: "Описание товара" }] }), styles: JSON.stringify({ bg: "#0f0f23", textColor: "#ffffff", columns: 3 }) },
  GALLERY: { content: JSON.stringify({ title: "Галерея", subtitle: "Наши работы", images: [] }), styles: JSON.stringify({ bg: "#0a0a14", textColor: "#ffffff", columns: 3 }) },
  VIDEO: { content: JSON.stringify({ title: "Смотрите как это работает", url: "", description: "Короткое демо нашего продукта" }), styles: JSON.stringify({ bg: "#0f0f23", textColor: "#ffffff" }) },
  TEXT: { content: JSON.stringify({ title: "Заголовок блока", body: "Здесь будет ваш текст. Расскажите о себе, своей компании или продукте. Описание может быть достаточно подробным — посетители оценят это.", link: "", linkLabel: "" }), styles: JSON.stringify({ bg: "#0f0f23", textColor: "#e2e8f0", align: "left" }) },
  STATS: { content: JSON.stringify({ title: "В цифрах", subtitle: "Результаты, которыми мы гордимся", items: [{ value: "10K+", label: "Довольных клиентов", icon: "Users" }, { value: "99.9%", label: "Uptime", icon: "Server" }, { value: "24/7", label: "Поддержка", icon: "Headphones" }, { value: "150+", label: "Стран мира", icon: "Globe" }] }), styles: JSON.stringify({ bg: "#0a0a1a", textColor: "#ffffff" }) },
  TEAM: { content: JSON.stringify({ title: "Наша команда", subtitle: "Профессионалы своего дела", members: [{ name: "Алексей Кузнецов", role: "CEO & Founder", bio: "10+ лет в tech-стартапах", avatar: "", linkedin: "" }, { name: "Светлана Морозова", role: "CTO", bio: "Эксперт в облачных технологиях", avatar: "", linkedin: "" }, { name: "Дмитрий Волков", role: "Head of Design", bio: "Дизайн думает за пользователя", avatar: "", linkedin: "" }] }), styles: JSON.stringify({ bg: "#0f0f23", textColor: "#ffffff" }) },
  FAQ: { content: JSON.stringify({ title: "Часто задаваемые вопросы", subtitle: "Не нашли ответ? Напишите нам.", items: [{ q: "Нужны ли знания программирования?", a: "Нет. lilluucore создан для всех — от новичков до профессионалов." }, { q: "Можно ли подключить свой домен?", a: "Да, на тарифах Pro и Business вы можете подключить любой домен." }, { q: "Как работает бесплатный план?", a: "Бесплатный план включает 1 сайт с 5 блоками. Никаких скрытых платежей." }, { q: "Можно ли отменить подписку?", a: "Конечно. Отмена происходит в один клик в настройках профиля." }] }), styles: JSON.stringify({ bg: "#0f0f23", textColor: "#e2e8f0" }) },
  CONTACTS: { content: JSON.stringify({ title: "Свяжитесь с нами", subtitle: "Мы отвечаем в течение 24 часов", email: "hello@company.com", phone: "+7 (999) 123-45-67", address: "Москва, ул. Примерная, 1", telegram: "@company", whatsapp: "+79991234567", formTitle: "Напишите нам", fields: ["Имя", "Email", "Сообщение"], ctaLabel: "Отправить", ctaUrl: "" }), styles: JSON.stringify({ bg: "#0a0a14", textColor: "#e2e8f0" }) },
  MUSIC_PLAYER: { content: JSON.stringify({ title: "Новый трек", artist: "Исполнитель", album: "Альбом 2025", coverUrl: "", trackUrl: "", spotifyUrl: "", appleUrl: "", youtubeUrl: "" }), styles: JSON.stringify({ bg: "#0f172a", textColor: "#f1f5f9" }) },
  DISCOGRAPHY: { content: JSON.stringify({ title: "Дискография", albums: [{ title: "Альбом 1", year: "2024", cover: "", spotifyUrl: "", tracks: 12 }, { title: "Синглы", year: "2023", cover: "", spotifyUrl: "", tracks: 5 }] }), styles: JSON.stringify({ bg: "#1e293b", textColor: "#e2e8f0" }) },
  SCHEDULE: { content: JSON.stringify({ title: "Расписание занятий", subtitle: "Запишитесь онлайн", items: [{ day: "Пн, Ср, Пт", time: "07:00–09:00", type: "Утренняя йога", trainer: "Анна В.", ctaUrl: "#" }, { day: "Вт, Чт", time: "18:00–20:00", type: "Силовые тренировки", trainer: "Дмитрий С.", ctaUrl: "#" }, { day: "Сб", time: "10:00–12:00", type: "Кроссфит", trainer: "Михаил П.", ctaUrl: "#" }] }), styles: JSON.stringify({ bg: "#1e293b", textColor: "#e2e8f0" }) },
  COACHES: { content: JSON.stringify({ title: "Наши тренеры", subtitle: "Сертифицированные профессионалы", members: [{ name: "Дмитрий Соколов", role: "Силовые тренировки", bio: "КМС по пауэрлифтингу, 8 лет опыта", avatar: "", instagram: "" }, { name: "Анна Власова", role: "Йога и пилатес", bio: "Сертификат RYT-500, 6 лет практики", avatar: "", instagram: "" }] }), styles: JSON.stringify({ bg: "#1a1a2e", textColor: "#ffffff" }) },
  FORM: { content: JSON.stringify({ title: "Оставьте заявку", subtitle: "Мы перезвоним в течение часа", fields: [{ label: "Ваше имя", type: "text", placeholder: "Иван Иванов", required: true }, { label: "Email", type: "email", placeholder: "you@example.com", required: true }, { label: "Телефон", type: "tel", placeholder: "+7 (999) 000-00-00", required: false }, { label: "Сообщение", type: "textarea", placeholder: "Расскажите о вашем проекте...", required: false }], ctaLabel: "Отправить заявку", successText: "Спасибо! Мы свяжемся с вами скоро." }), styles: JSON.stringify({ bg: "#0f0f23", textColor: "#e2e8f0", ctaColor: "#7C3AED" }) },
  BLOG: { content: JSON.stringify({ title: "Блог", subtitle: "Последние статьи и новости", items: [{ title: "Как создать продающий лендинг за час", date: "12 марта 2025", tag: "Маркетинг", preview: "Рассказываем о ключевых блоках, которые конвертируют посетителей в клиентов...", url: "#" }, { title: "5 ошибок при запуске интернет-магазина", date: "5 марта 2025", tag: "E-commerce", preview: "Разбираем типичные ошибки и как их избежать...", url: "#" }] }), styles: JSON.stringify({ bg: "#0f0f23", textColor: "#e2e8f0" }) },
  HEADER_MENU: { content: JSON.stringify({ logo: "Компания", links: [{ label: "Главная", url: "#", active: true }, { label: "О нас", url: "#" }, { label: "Услуги", url: "#" }, { label: "Цены", url: "#" }, { label: "Контакты", url: "#" }], cta: "Связаться", ctaUrl: "#" }), styles: JSON.stringify({ bg: "#070711", textColor: "#e2e8f0", ctaColor: "#7C3AED" }) },
};

// ─── Sites ────────────────────────────────────

router.get("/sites", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  try {
    const userSites = await db.select().from(sitesTable).where(eq(sitesTable.userId, userId)).orderBy(desc(sitesTable.createdAt));
    const sitesWithData = await Promise.all(userSites.map(async (site) => {
      const blocks = await db.select().from(blocksTable).where(eq(blocksTable.siteId, site.id)).orderBy(asc(blocksTable.position));
      const pages = await db.select().from(pagesTable).where(eq(pagesTable.siteId, site.id)).orderBy(asc(pagesTable.position));
      return { ...site, blocks, pages };
    }));
    res.json(sitesWithData);
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

router.get("/sites/stats/all", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  const days = req.query.period === "30d" ? 30 : req.query.period === "90d" ? 90 : 7;
  const chart = makeStats(days);
  const totals = chart.reduce((a, d) => ({ views: a.views + d.views, clicks: a.clicks + d.clicks, visitors: a.visitors + d.visitors, newReg: a.newReg + d.newRegistrations }), { views: 0, clicks: 0, visitors: 0, newReg: 0 });
  res.json({ views: totals.views, uniqueVisitors: totals.visitors, clicks: totals.clicks, newRegistrations: totals.newReg, avgSessionSec: 142, bounceRate: 38, period: `${days}d`, dbUsedMb: 18, dbTotalMb: 512, chartData: chart });
});

router.post("/sites", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  try {
    const { name, subdomain, businessType } = req.body;
    if (!name || !businessType) return res.status(400).json({ message: "name и businessType обязательны" });
    const id = generateId();
    const sub = (subdomain || name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")) + ".lilluucore.com";
    await db.insert(sitesTable).values({ id, userId, name, subdomain: sub, businessType, status: "DRAFT", globalStyles: JSON.stringify({ fontFamily: "Inter", primaryColor: "#7C3AED" }) });
    // Create default page
    const pageId = generateId();
    await db.insert(pagesTable).values({ id: pageId, siteId: id, name: "Главная", slug: "index", position: 0 });

    // Business-type starter templates
    const TEMPLATES: Record<string, string[]> = {
      LANDING:     ["HEADER_MENU", "HERO", "FEATURES", "STATS", "TESTIMONIALS", "FAQ", "CTA", "FOOTER"],
      ECOMMERCE:   ["HEADER_MENU", "HERO", "PRODUCTS", "FEATURES", "STATS", "TESTIMONIALS", "FAQ", "FOOTER"],
      MUSIC_LABEL: ["HEADER_MENU", "HERO", "MUSIC_PLAYER", "DISCOGRAPHY", "TEAM", "GALLERY", "CONTACTS", "FOOTER"],
      FITNESS:     ["HEADER_MENU", "HERO", "STATS", "FEATURES", "SCHEDULE", "COACHES", "PRICING", "TESTIMONIALS", "FAQ", "FOOTER"],
    };

    // Business-type specific content overrides
    const BUSINESS_OVERRIDES: Record<string, Record<string, { content?: string; styles?: string }>> = {
      ECOMMERCE: {
        HERO: { content: JSON.stringify({ title: "Откройте для себя лучшее", subtitle: "Уникальные товары по лучшим ценам — доставка по всей России", cta: "Смотреть каталог", ctaUrl: "#", ctaSecondary: "Акции", ctaSecondaryUrl: "#" }), styles: JSON.stringify({ bg: "linear-gradient(135deg, #0a0a1a, #1a0a2e)", textColor: "#ffffff", ctaColor: "#7C3AED" }) },
        FEATURES: { content: JSON.stringify({ title: "Почему покупают у нас", subtitle: "Миллионы довольных покупателей по всей стране", items: [{ icon: "🚚", title: "Быстрая доставка", desc: "Доставим ваш заказ уже завтра. Бесплатно от 3 000₽." }, { icon: "🔒", title: "Безопасные платежи", desc: "Оплата картой, наличными или через СБП. 100% защита." }, { icon: "↩️", title: "Лёгкий возврат", desc: "30 дней на возврат без вопросов. Деньги вернём сразу." }, { icon: "💎", title: "Гарантия качества", desc: "Работаем только с проверенными брендами и поставщиками." }, { icon: "📦", title: "Широкий ассортимент", desc: "Более 50 000 товаров в наличии на складе." }, { icon: "🎁", title: "Программа лояльности", desc: "Накапливайте баллы и обменивайте на скидки." }] }) },
        STATS: { content: JSON.stringify({ title: "Наши достижения", items: [{ value: "50K+", label: "Товаров в каталоге" }, { value: "2M+", label: "Довольных покупателей" }, { value: "98%", label: "Положительных отзывов" }, { value: "24ч", label: "Среднее время доставки" }] }) },
      },
      MUSIC_LABEL: {
        HERO: { content: JSON.stringify({ title: "Музыка, которая меняет мир", subtitle: "Независимый лейбл. Подлинное звучание. Мы создаём будущее музыкальной индустрии.", cta: "Слушать сейчас", ctaUrl: "#", ctaSecondary: "О лейбле", ctaSecondaryUrl: "#" }), styles: JSON.stringify({ bg: "linear-gradient(135deg, #0f172a, #1e1b4b)", textColor: "#ffffff", ctaColor: "#8B5CF6" }) },
        HEADER_MENU: { content: JSON.stringify({ logo: name || "Music Label", links: [{ label: "Главная", url: "#", active: true }, { label: "Артисты", url: "#" }, { label: "Релизы", url: "#" }, { label: "Тур", url: "#" }, { label: "Контакты", url: "#" }], cta: "Стать артистом", ctaUrl: "#" }), styles: JSON.stringify({ bg: "#0f172a", textColor: "#e2e8f0", ctaColor: "#8B5CF6" }) },
        GALLERY: { content: JSON.stringify({ title: "Фотографии", subtitle: "Наши артисты и события", images: [] }), styles: JSON.stringify({ bg: "#0f172a", textColor: "#e2e8f0", columns: 3 }) },
        CONTACTS: { content: JSON.stringify({ title: "Свяжитесь с нами", subtitle: "Для сотрудничества и пресс-запросов", email: "booking@label.com", phone: "+7 (999) 000-00-00", address: "Москва, Россия", telegram: "@music_label" }), styles: JSON.stringify({ bg: "#0a0a14", textColor: "#e2e8f0" }) },
      },
      FITNESS: {
        HERO: { content: JSON.stringify({ title: "Измени себя. Начни сегодня.", subtitle: "Профессиональные тренеры, современное оборудование, результат уже через месяц.", cta: "Первое занятие бесплатно", ctaUrl: "#", ctaSecondary: "Смотреть расписание", ctaSecondaryUrl: "#" }), styles: JSON.stringify({ bg: "linear-gradient(135deg, #0a0a1a, #1a2000)", textColor: "#ffffff", ctaColor: "#16a34a" }) },
        FEATURES: { content: JSON.stringify({ title: "Почему выбирают нас", subtitle: "Мы создаём среду, в которой хочется тренироваться", items: [{ icon: "💪", title: "Опытные тренеры", desc: "КМС и мастера спорта. Персональные программы для каждого." }, { icon: "🏋️", title: "Современный зал", desc: "Новейшее оборудование. Полная замена воздуха каждый час." }, { icon: "📱", title: "Приложение", desc: "Отслеживайте прогресс, бронируйте занятия, связывайтесь с тренером." }, { icon: "🥗", title: "Нутрициолог", desc: "Индивидуальное питание. Анализ состава тела каждый месяц." }, { icon: "🛁", title: "SPA-зона", desc: "Сауна, джакузи и зона отдыха включены в абонемент." }, { icon: "⏰", title: "Работаем 24/7", desc: "Открыты в любое время — тренируйтесь когда удобно." }] }) },
        STATS: { content: JSON.stringify({ title: "Наши результаты в цифрах", items: [{ value: "2 000+", label: "Активных членов" }, { value: "50+", label: "Тренеров и инструкторов" }, { value: "15 лет", label: "На рынке фитнеса" }, { value: "93%", label: "Достигают цели" }] }) },
        PRICING: { content: JSON.stringify({ title: "Выберите свой абонемент", subtitle: "Первое пробное занятие — бесплатно для всех", plans: [{ name: "Базовый", price: "3 900₽", period: "мес", features: ["Доступ в зал 7:00–22:00", "Групповые тренировки", "Раздевалка и душ", "Онлайн-расписание"], cta: "Выбрать" }, { name: "Стандарт", price: "6 900₽", period: "мес", features: ["Доступ 24/7", "Все групповые тренировки", "Консультация нутрициолога", "SPA-зона", "1 персональная тренировка"], highlighted: true, cta: "Лучший выбор" }, { name: "VIP", price: "14 900₽", period: "мес", features: ["Безлимитный доступ 24/7", "Персональный тренер 4×/нед", "SPA-зона без ограничений", "Нутрициолог + диетолог", "Гостевые визиты"], cta: "VIP опыт" }] }) },
      },
    };

    const template = TEMPLATES[businessType] || TEMPLATES.LANDING;
    const overrides = BUSINESS_OVERRIDES[businessType] || {};
    const blockInserts = template.map((type, i) => ({
      id: generateId(),
      siteId: id,
      pageId,
      type,
      position: i,
      content: overrides[type]?.content || BLOCK_DEFAULTS[type]?.content || "{}",
      styles: overrides[type]?.styles || BLOCK_DEFAULTS[type]?.styles || "{}",
      visible: true,
      width: 100,
    }));
    if (blockInserts.length) await db.insert(blocksTable).values(blockInserts);

    const [site] = await db.select().from(sitesTable).where(eq(sitesTable.id, id)).limit(1);
    const pages = await db.select().from(pagesTable).where(eq(pagesTable.siteId, id));
    const blocks = await db.select().from(blocksTable).where(eq(blocksTable.siteId, id)).orderBy(asc(blocksTable.position));
    res.status(201).json({ ...site, blocks, pages });
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

router.get("/sites/:id", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  try {
    const [site] = await db.select().from(sitesTable).where(and(eq(sitesTable.id, req.params.id), eq(sitesTable.userId, userId))).limit(1);
    if (!site) return res.status(404).json({ message: "Site not found" });
    const blocks = await db.select().from(blocksTable).where(eq(blocksTable.siteId, site.id)).orderBy(asc(blocksTable.position));
    const pages = await db.select().from(pagesTable).where(eq(pagesTable.siteId, site.id)).orderBy(asc(pagesTable.position));
    res.json({ ...site, blocks, pages });
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

router.get("/sites/:id/stats", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  const [site] = await db.select().from(sitesTable).where(and(eq(sitesTable.id, req.params.id), eq(sitesTable.userId, userId))).limit(1);
  if (!site) return res.status(404).json({ message: "Site not found" });
  const days = req.query.period === "30d" ? 30 : req.query.period === "90d" ? 90 : 7;
  const chart = makeStats(days);
  const totals = chart.reduce((a, d) => ({ views: a.views + d.views, clicks: a.clicks + d.clicks, visitors: a.visitors + d.visitors, newReg: a.newReg + d.newRegistrations }), { views: 0, clicks: 0, visitors: 0, newReg: 0 });
  res.json({ views: totals.views, uniqueVisitors: totals.visitors, clicks: totals.clicks, newRegistrations: totals.newReg, avgSessionSec: 142, bounceRate: 38, period: `${days}d`, dbUsedMb: 18, dbTotalMb: 512, chartData: chart });
});

router.delete("/sites/:id", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  try {
    await db.delete(sitesTable).where(and(eq(sitesTable.id, req.params.id), eq(sitesTable.userId, userId)));
    res.status(204).send();
  } catch (e) { res.status(500).json({ message: "Server error" }); }
});

router.post("/sites/:id/publish", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  try {
    const [site] = await db.select().from(sitesTable).where(and(eq(sitesTable.id, req.params.id), eq(sitesTable.userId, userId))).limit(1);
    if (!site) return res.status(404).json({ message: "Site not found" });
    const publishedUrl = `https://${site.subdomain}`;
    await db.update(sitesTable).set({ status: "PUBLISHED", publishedUrl, updatedAt: new Date() }).where(eq(sitesTable.id, site.id));
    res.json({ url: publishedUrl, site: { ...site, status: "PUBLISHED", publishedUrl } });
  } catch (e) { res.status(500).json({ message: "Server error" }); }
});

router.put("/sites/:id/styles", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  try {
    await db.update(sitesTable).set({ globalStyles: req.body.styles || "{}", updatedAt: new Date() }).where(eq(sitesTable.id, req.params.id));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ message: "Server error" }); }
});

// ─── Pages ────────────────────────────────────

router.get("/sites/:id/pages", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  try {
    const [site] = await db.select().from(sitesTable).where(and(eq(sitesTable.id, req.params.id), eq(sitesTable.userId, userId))).limit(1);
    if (!site) return res.status(404).json({ message: "Site not found" });
    const pages = await db.select().from(pagesTable).where(eq(pagesTable.siteId, site.id)).orderBy(asc(pagesTable.position));
    res.json(pages);
  } catch (e) { res.status(500).json({ message: "Server error" }); }
});

router.post("/sites/:id/pages", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  try {
    const [site] = await db.select().from(sitesTable).where(and(eq(sitesTable.id, req.params.id), eq(sitesTable.userId, userId))).limit(1);
    if (!site) return res.status(404).json({ message: "Site not found" });
    const { name, slug } = req.body;
    const existing = await db.select().from(pagesTable).where(eq(pagesTable.siteId, site.id));
    const id = generateId();
    const cleanSlug = (slug || name || "page").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    await db.insert(pagesTable).values({ id, siteId: site.id, name: name || "Новая страница", slug: cleanSlug, position: existing.length });
    const [page] = await db.select().from(pagesTable).where(eq(pagesTable.id, id)).limit(1);
    res.status(201).json(page);
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

router.put("/sites/:id/pages/:pageId", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  try {
    const { name, slug, meta } = req.body;
    const updates: any = {};
    if (name) updates.name = name;
    if (slug) updates.slug = slug.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (meta !== undefined) updates.meta = meta;
    await db.update(pagesTable).set(updates).where(eq(pagesTable.id, req.params.pageId));
    const [page] = await db.select().from(pagesTable).where(eq(pagesTable.id, req.params.pageId)).limit(1);
    res.json(page);
  } catch (e) { res.status(500).json({ message: "Server error" }); }
});

router.delete("/sites/:id/pages/:pageId", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  try {
    const remaining = await db.select().from(pagesTable).where(eq(pagesTable.siteId, req.params.id));
    if (remaining.length <= 1) return res.status(400).json({ message: "Нельзя удалить последнюю страницу" });
    await db.delete(blocksTable).where(eq(blocksTable.pageId, req.params.pageId));
    await db.delete(pagesTable).where(eq(pagesTable.id, req.params.pageId));
    res.status(204).send();
  } catch (e) { res.status(500).json({ message: "Server error" }); }
});

// ─── Blocks ────────────────────────────────────

router.post("/sites/:id/blocks", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  try {
    const [site] = await db.select().from(sitesTable).where(and(eq(sitesTable.id, req.params.id), eq(sitesTable.userId, userId))).limit(1);
    if (!site) return res.status(404).json({ message: "Site not found" });
    const { type, position, width, pageId, rowId } = req.body;
    const defaults = BLOCK_DEFAULTS[type] || { content: "{}", styles: "{}" };
    const id = generateId();
    await db.insert(blocksTable).values({ id, siteId: site.id, pageId: pageId || null, type, position: position ?? 0, rowId: rowId || null, content: defaults.content, styles: defaults.styles, visible: true, width: width ?? 100 });
    const [block] = await db.select().from(blocksTable).where(eq(blocksTable.id, id)).limit(1);
    res.status(201).json(block);
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

router.put("/sites/:id/blocks/:blockId", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  try {
    const { content, styles, visible, width, rowId, pageId, position } = req.body;
    const updates: any = {};
    if (content !== undefined) updates.content = content;
    if (styles !== undefined) updates.styles = styles;
    if (visible !== undefined) updates.visible = visible;
    if (width !== undefined) updates.width = width;
    if (rowId !== undefined) updates.rowId = rowId;
    if (pageId !== undefined) updates.pageId = pageId;
    if (position !== undefined) updates.position = position;
    await db.update(blocksTable).set(updates).where(eq(blocksTable.id, req.params.blockId));
    const [block] = await db.select().from(blocksTable).where(eq(blocksTable.id, req.params.blockId)).limit(1);
    res.json(block);
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

router.delete("/sites/:id/blocks/:blockId", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  try {
    await db.delete(blocksTable).where(eq(blocksTable.id, req.params.blockId));
    res.status(204).send();
  } catch (e) { res.status(500).json({ message: "Server error" }); }
});

router.put("/sites/:id/blocks/reorder", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  try {
    const { ids } = req.body as { ids: string[] };
    await Promise.all(ids.map((id, idx) => db.update(blocksTable).set({ position: idx }).where(eq(blocksTable.id, id))));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ message: "Server error" }); }
});

// ─── Form Submissions ──────────────────────────

router.post("/sites/:id/form-submit", async (req, res) => {
  try {
    const { blockId, formTitle, data } = req.body;
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "";
    await db.insert(formSubmissionsTable).values({
      siteId: req.params.id,
      blockId: blockId || null,
      formTitle: formTitle || "Заявка",
      data: typeof data === "string" ? data : JSON.stringify(data),
      submitterIp: ip,
    });
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

router.get("/sites/:id/form-submissions", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  try {
    const [site] = await db.select().from(sitesTable).where(and(eq(sitesTable.id, req.params.id), eq(sitesTable.userId, userId))).limit(1);
    if (!site) return res.status(404).json({ message: "Not found" });
    const submissions = await db.select().from(formSubmissionsTable).where(eq(formSubmissionsTable.siteId, req.params.id)).orderBy(desc(formSubmissionsTable.createdAt));
    res.json(submissions);
  } catch (e) { res.status(500).json({ message: "Server error" }); }
});

// ─── Public preview ────────────────────────────

router.get("/public/sites/:id", async (req, res) => {
  try {
    const [site] = await db.select().from(sitesTable).where(eq(sitesTable.id, req.params.id)).limit(1);
    if (!site) return res.status(404).json({ message: "Site not found" });
    if (site.frozen) return res.status(403).json({ message: "frozen", frozenReason: site.frozenReason || "Нарушение пользовательского соглашения" });
    if (site.status !== "PUBLISHED") return res.status(404).json({ message: "draft" });
    const blocks = await db.select().from(blocksTable).where(eq(blocksTable.siteId, site.id)).orderBy(asc(blocksTable.position));
    const pages = await db.select().from(pagesTable).where(eq(pagesTable.siteId, site.id)).orderBy(asc(pagesTable.createdAt));
    res.json({ site: { id: site.id, name: site.name, subdomain: site.subdomain, businessType: site.businessType, globalStyles: site.globalStyles }, blocks, pages });
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

export default router;
