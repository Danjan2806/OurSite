import { Router } from "express";
import OpenAI from "openai";
import { authUser } from "./auth";
import { chromium } from "playwright";

const router = Router();

function getOpenAI() {
  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("AI не настроен. Укажите OPENAI_API_KEY");
  return new OpenAI({ baseURL: baseURL || "https://api.openai.com/v1", apiKey });
}

const SYSTEM_PROMPT = `Ты — аналитик веб-дизайна. Анализируй скриншот сайта и воссоздай его структуру, используя нашу библиотеку готовых блоков.

═══ СТРАТЕГИЯ (СТРОГО СОБЛЮДАТЬ) ═══
ШАГ 1: Для каждой секции скриншота найди НАИБОЛЕЕ ПОДХОДЯЩИЙ стандартный тип блока из библиотеки ниже.
ШАГ 2: Если секция уникальна и НЕ подходит ни под один стандартный тип — используй ZERO_BLOCK.
НЕЛЬЗЯ использовать ТОЛЬКО Zero Blocks — всегда предпочитай стандартные блоки там, где они подходят.

═══ ФОРМАТ ОТВЕТА ═══
Верни ТОЛЬКО валидный JSON (без markdown, без комментариев):
{
  "suggestedName": "slug-через-дефис",
  "businessType": "LANDING|ECOMMERCE|MUSIC_LABEL|FITNESS",
  "blocks": [ ...массив блоков в порядке сверху вниз... ]
}

Каждый стандартный блок:
{
  "type": "ТИП",
  "content": { ...поля согласно схеме... },
  "styles": { "bg": "#hex", "textColor": "#hex", ...опции... }
}

═══ БИБЛИОТЕКА СТАНДАРТНЫХ БЛОКОВ ═══

[HEADER_MENU] — шапка сайта с логотипом и навигацией
  КОГДА ИСПОЛЬЗОВАТЬ: верхняя полоса с логотипом/названием + пункты меню
  content: {
    "logo": "Название бренда",
    "links": [{"label": "Главная", "href": "#"}, {"label": "О нас", "href": "#"}, ...],
    "ctaButtons": [
      {"label": "Войти", "href": "/login", "variant": "outline"},
      {"label": "Начать бесплатно", "href": "#signup", "variant": "primary"}
    ]
  }
  styles: { "bg": "#hex", "textColor": "#hex", "ctaColor": "#hex", "variant": "split" }
  variant: "split"(лого слева+ссылки в центре+кнопка справа) | "logo_center" | "minimal"(лого+кнопка, нет ссылок)
  ctaButtons[].variant: "primary"(заливка акцентом) | "secondary"(прозрачный) | "outline"(обводка акцентом)
  ПРАВИЛО: если в шапке одна CTA-кнопка — один объект в ctaButtons; если две (например, «Войти» + «Регистрация») — два объекта

[HERO] — главный экран
  КОГДА ИСПОЛЬЗОВАТЬ: секция-заголовок с крупным H1, подзаголовком и CTA-кнопкой
  content: {
    "title": "Главный заголовок H1",
    "subtitle": "Подзаголовок / описание",
    "cta": "Текст кнопки",
    "ctaSecondary": "Второй текст (если есть)"
  }
  styles: { "bg": "#hex", "textColor": "#hex", "ctaColor": "#hex", "variant": "centered" }
  variant: "centered"(всё по центру) | "split"(текст слева, визуал справа) | "minimal"(светлый, без сложного фона)

[FEATURES] — преимущества / особенности
  КОГДА ИСПОЛЬЗОВАТЬ: секция с карточками или списком преимуществ с иконками
  content: {
    "title": "Заголовок секции",
    "subtitle": "Подзаголовок",
    "items": [
      {"icon": "🚀", "title": "Название преимущества", "desc": "Краткое описание"},
      ...
    ]
  }
  styles: { "bg": "#hex", "textColor": "#hex", "variant": "cards", "columns": 3 }
  variant: "cards"(сетка карточек) | "list"(вертикальный список) | "alternating"(попеременно слева-справа)

[TESTIMONIALS] — отзывы клиентов
  КОГДА ИСПОЛЬЗОВАТЬ: секция с цитатами, звёздами, именами и фото клиентов
  content: {
    "title": "Заголовок",
    "items": [
      {"text": "Текст отзыва", "author": "Имя Фамилия", "role": "Должность / Компания"},
      ...
    ]
  }
  styles: { "bg": "#hex", "textColor": "#hex", "variant": "grid" }
  variant: "grid"(2 колонки) | "list"(вертикальный) | "quote"(одна крупная цитата)

[STATS] — числовая статистика
  КОГДА ИСПОЛЬЗОВАТЬ: крупные числа с подписями (1000+, 95%, 5 лет и т.д.)
  content: {
    "title": "Заголовок (необязательно)",
    "items": [
      {"value": "1 000+", "label": "Клиентов"},
      {"value": "95%", "label": "Довольны результатом"},
      ...
    ]
  }
  styles: { "bg": "#hex", "textColor": "#hex", "variant": "row" }
  variant: "row"(горизонтальный ряд) | "cards"(карточки в сетке)

[PRICING] — тарифные планы
  КОГДА ИСПОЛЬЗОВАТЬ: секция с ценами, планами подписки, сравнением тарифов
  content: {
    "title": "Заголовок",
    "plans": [
      {
        "name": "Базовый",
        "price": "990₽",
        "period": "мес",
        "features": ["Фича 1", "Фича 2"],
        "cta": "Выбрать",
        "highlighted": false
      },
      ...
    ]
  }
  styles: { "bg": "#hex", "textColor": "#hex", "variant": "cards" }
  variant: "cards" | "table"

[FAQ] — вопросы и ответы
  КОГДА ИСПОЛЬЗОВАТЬ: секция с частыми вопросами / аккордеон с ответами
  content: {
    "title": "Заголовок",
    "items": [
      {"q": "Вопрос?", "a": "Развёрнутый ответ"},
      ...
    ]
  }
  styles: { "bg": "#hex", "textColor": "#hex", "variant": "accordion" }
  variant: "accordion" | "grid"

[TEAM] — команда
  КОГДА ИСПОЛЬЗОВАТЬ: карточки членов команды с именами и должностями
  content: {
    "title": "Наша команда",
    "subtitle": "Подзаголовок",
    "members": [
      {"name": "Имя Фамилия", "role": "Должность"},
      ...
    ]
  }
  styles: { "bg": "#hex", "textColor": "#hex", "variant": "cards" }
  variant: "cards" | "list"

[CTA] — отдельная секция призыва к действию
  КОГДА ИСПОЛЬЗОВАТЬ: отдельный баннер/секция "Начать бесплатно", "Записаться", "Получить консультацию"
  content: {
    "title": "Заголовок призыва",
    "subtitle": "Подзаголовок",
    "cta": "Текст кнопки",
    "ctaSecondary": "Второй вариант"
  }
  styles: { "bg": "#hex", "textColor": "#hex", "ctaColor": "#hex", "variant": "centered" }
  variant: "centered"(по центру) | "banner"(горизонтальный) | "split"(текст слева, кнопка справа)

[FORM] — форма сбора заявок / обратная связь
  КОГДА ИСПОЛЬЗОВАТЬ: секция с полями ввода (имя, email, телефон, сообщение) и кнопкой отправки.
  Признаки на скриншоте: input-поля, placeholder-текст внутри рамок, кнопка «Отправить»/«Оставить заявку»/«Записаться».
  НЕ ИСПОЛЬЗОВАТЬ для: секций только с кнопкой (→ CTA), только с контактными данными (→ CONTACTS), только с текстом (→ TEXT).
  content: {
    "title": "Оставьте заявку",
    "subtitle": "Подзаголовок (необязательно)",
    "fields": [
      {"label": "Имя", "type": "text", "required": true, "placeholder": "Ваше имя"},
      {"label": "Email", "type": "email", "required": true, "placeholder": "email@example.com"},
      {"label": "Телефон", "type": "tel", "required": false, "placeholder": "+7 (999) 000-00-00"},
      {"label": "Сообщение", "type": "textarea", "required": false, "placeholder": "Ваш вопрос..."}
    ],
    "ctaLabel": "Отправить"
  }
  styles: { "bg": "#hex", "textColor": "#hex", "ctaColor": "#hex", "variant": "centered" }
  variant: "centered"(форма по центру) | "split"(текст слева, форма справа)
  ПРАВИЛО полей: включай только те поля, которые реально видны на скриншоте. Не добавляй лишние.

[TEXT] — текстовая секция
  КОГДА ИСПОЛЬЗОВАТЬ: заголовок + параграф текста без полей ввода, без кнопок призыва к действию.
  НЕ ИСПОЛЬЗОВАТЬ если: видны input-поля (→ FORM), есть только кнопка (→ CTA), есть email/телефон (→ CONTACTS).
  content: { "title": "Заголовок", "body": "Текст параграфа..." }
  styles: { "bg": "#hex", "textColor": "#hex", "align": "left" }

[GALLERY] — галерея / портфолио
  КОГДА ИСПОЛЬЗОВАТЬ: сетка изображений, фото, портфолио
  content: { "title": "Заголовок", "columns": 3 }
  styles: { "bg": "#hex", "textColor": "#hex", "variant": "grid" }
  variant: "grid" | "masonry"

[CONTACTS] — контактная информация
  КОГДА ИСПОЛЬЗОВАТЬ: секция с email, телефоном, адресом, мессенджерами
  content: {
    "title": "Свяжитесь с нами",
    "subtitle": "Подзаголовок",
    "email": "info@company.com",
    "phone": "+7 (999) 123-45-67",
    "address": "г. Москва, ул. Примерная, 1",
    "telegram": "@username"
  }
  styles: { "bg": "#hex", "textColor": "#hex" }

[FOOTER] — подвал сайта
  КОГДА ИСПОЛЬЗОВАТЬ: нижняя полоса с логотипом, ссылками и копирайтом
  content: {
    "company": "Название компании",
    "slogan": "Слоган",
    "copyright": "© 2024 Название. Все права защищены.",
    "links": [{"label": "О нас"}, {"label": "Условия"}, ...]
  }
  styles: { "bg": "#hex", "textColor": "#hex", "variant": "columns" }
  variant: "columns"(лого слева + ссылки справа) | "minimal"(однострочный) | "centered"(всё по центру)

[BLOG] — список статей
  КОГДА ИСПОЛЬЗОВАТЬ: карточки постов/статей с заголовками, датами, тегами
  content: {
    "title": "Блог / Новости",
    "subtitle": "Подзаголовок",
    "items": [
      {"title": "Заголовок статьи", "date": "01.01.2024", "tag": "Категория", "preview": "Превью текста"},
      ...
    ]
  }
  styles: { "bg": "#hex", "textColor": "#hex", "variant": "grid" }
  variant: "grid" | "list"

═══ ZERO_BLOCK — кастомный блок со свободным позиционированием ═══
Используй КОГДА:
• уникальный кастомный дизайн, нестандартная компоновка, которая явно НЕ похожа ни на один стандартный тип выше
• HERO со встроенной строкой поиска, формой или нестандартным расположением нескольких групп текста разных размеров
• шапка (header) с нестандартной структурой: dropdown-меню, много групп кнопок, переключатель языка, нестандартный дизайн
• секции с фоновыми формами, диагональными разделителями, нестандартными наложениями текста на изображение
• любой элемент, который требует пиксельного контроля над позицией каждого компонента

{
  "type": "ZERO_BLOCK",
  "content": {
    "zeroElements": [
      {
        "id": "уникальный-id-a1b2",
        "type": "text|image|button|shape",
        "locked": false,
        "zIndex": 1,
        "container": "grid",
        "desktop": { "x": 0, "y": 0, "w": 200, "h": 52, "visible": true },
        "content": {},
        "styles": {}
      }
    ],
    "zeroHeight": 400,
    "zeroBg": "#1a1a2e"
  },
  "styles": {}
}

ZERO_BLOCK — типы элементов:
TEXT: content={"text":"текст"}, styles={"color":"#hex","fontSize":16,"fontWeight":"400","textAlign":"left","lineHeight":1.5,"bg":"transparent"}
IMAGE: content={"src":"","alt":"описание"}, styles={"bg":"#hex-заглушки","borderRadius":0,"objectFit":"cover"}
BUTTON: content={"label":"текст","href":"#"}, styles={"bg":"#hex","color":"#hex","fontSize":16,"fontWeight":"600","borderRadius":8,"paddingX":24,"paddingY":12}
SHAPE: content={}, styles={"shapeType":"rect","shapeFill":"#hex","borderRadius":0,"opacity":1}

ZERO_BLOCK — позиционирование (холст 1200px):
• Центр: x = (1200 - w) / 2
• Отступ слева: x = 40–80; справа: x = 1200 - w - 40
• Вертикальный центр: y = (zeroHeight - h) / 2

ZERO_BLOCK — ВЫСОТА ТЕКСТА (обязательно!):
h = ceil(fontSize × lineHeight × строк) + 24
Примеры: 14px 1стр → 48; 16px 1стр → 52; 24px 1стр → 64; 48px 1стр → 88; 72px 1стр → 120
Две строки 16px → 76; три строки 16px → 100

═══ ЦВЕТА — ГЛАВНОЕ ПРАВИЛО ═══
ШАГ 1: Определи 5 главных цветов прямо с пикселей скриншота:
  • bodyBg: доминирующий фон страницы
  • primaryText: основной цвет текста
  • secondaryText: вторичный/серый текст
  • accentColor: фирменный цвет (берётся с кнопок CTA, логотипа, иконок)
  • surfaceBg: цвет карточек/секций (если отличается от bodyBg)
ШАГ 2: Используй ТОЛЬКО эти цвета для всех блоков. НЕ придумывай цвета — только реальные пиксели!
Если кнопка НЕ синяя на скриншоте — не пиши #0066ff. Смотри на реальный цвет.

═══ ЗАПРЕЩЕНО ═══
• Возвращать ТОЛЬКО Zero Blocks — всегда предпочитай стандартные блоки там, где они точно подходят
• Использовать неподходящий стандартный блок (не натягивай галерею на контакты)
• Использовать стандартный HERO если hero содержит встроенную форму поиска или несколько нестандартных зон — в таком случае используй ZERO_BLOCK
• Придумывать цвета, которых нет на скриншоте
• В ZERO_BLOCK: высота текста меньше формулы ceil(fontSize×lineHeight×строк)+24
• Использовать TEXT там где видны input-поля — это FORM
• Использовать TEXT там где есть email/телефон/адрес — это CONTACTS
• Использовать CTA там где есть поля ввода — это FORM
• Использовать CONTACTS там где есть поля ввода — это FORM (CONTACTS — только справочные данные, без полей)

═══ ШПАРГАЛКА: FORM vs TEXT vs CTA vs CONTACTS ═══
• Видишь input-поля на странице → FORM (всегда)
• Видишь только кнопку «Записаться»/«Получить» без полей → CTA
• Видишь email/телефон/адрес без полей → CONTACTS
• Видишь только заголовок + абзац текста → TEXT`;

const VALID_BLOCK_TYPES = new Set([
  "HERO", "HEADER_MENU", "FEATURES", "TESTIMONIALS", "STATS", "TEAM",
  "FAQ", "CTA", "TEXT", "GALLERY", "PRICING", "CONTACTS", "FOOTER",
  "BLOG", "FORM", "PRODUCTS", "SCHEDULE", "ZERO_BLOCK",
]);

/** Remove common JSON-invalidating patterns that GPT-4o may produce */
function sanitizeJson(raw: string): string {
  return raw
    // Strip JS line comments (// ...) that are NOT inside strings
    .replace(/("(?:[^"\\]|\\.)*")|\/\/[^\n]*/g, (m, str) => str ?? "")
    // Strip JS block comments (/* ... */)
    .replace(/("(?:[^"\\]|\\.)*")|\/\*[\s\S]*?\*\//g, (m, str) => str ?? "")
    // Remove trailing commas before ] or }
    .replace(/,(\s*[}\]])/g, "$1");
}

async function runAiAnalysis(imageContent: OpenAI.Chat.ChatCompletionContentPart, userPrompt: string) {
  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 8192,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: [imageContent, { type: "text", text: userPrompt }] },
    ],
  });
  const rawText = response.choices[0]?.message?.content || "";
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI не вернул корректный JSON");

  let parsed: any;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    // Try again after sanitizing common GPT-4o quirks
    try {
      parsed = JSON.parse(sanitizeJson(jsonMatch[0]));
    } catch (e2: any) {
      throw new Error(`Невалидный JSON от AI: ${e2.message}`);
    }
  }

  if (!parsed.blocks || !Array.isArray(parsed.blocks)) throw new Error("Некорректный формат ответа AI");

  const validBlocks = parsed.blocks.filter((b: any) => {
    if (!VALID_BLOCK_TYPES.has(b.type)) return false;
    if (b.type === "ZERO_BLOCK") return b.content && Array.isArray(b.content.zeroElements);
    return b.content !== undefined;
  });

  return {
    suggestedName: parsed.suggestedName || "Новый сайт",
    businessType: parsed.businessType || "LANDING",
    blocks: validBlocks,
  };
}

interface WebsiteAnalysis {
  base64: string;
  structure: string;
  cleanedHtml: string;
}

/** Take a screenshot + extract semantic DOM structure via Playwright. */
async function analyzeWebsite(targetUrl: string): Promise<WebsiteAnalysis> {
  const executablePath = process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  const browser = await chromium.launch({
    executablePath,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-software-rasterizer",
      "--disable-extensions",
    ],
    headless: true,
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      locale: "ru-RU",
    });
    const page = await context.newPage();

    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(1500);

    // Extract semantic structure from the DOM
    const structure = await page.evaluate(() => {
      const t = (el: Element | null) => el?.textContent?.trim().replace(/\s+/g, " ").slice(0, 200) ?? "";
      const lines: string[] = [];

      // Title
      const title = document.title.trim();
      if (title) lines.push(`TITLE: ${title}`);

      // Meta description
      const desc = (document.querySelector('meta[name="description"]') as HTMLMetaElement)?.content?.trim();
      if (desc) lines.push(`META_DESC: ${desc.slice(0, 200)}`);

      // Nav links
      const navLinks = Array.from(document.querySelectorAll("nav a, header a"))
        .map(a => a.textContent?.trim()).filter(Boolean).slice(0, 10);
      if (navLinks.length) lines.push(`NAV: ${navLinks.join(" | ")}`);

      // All headings h1–h3 with their section context
      document.querySelectorAll("h1, h2, h3").forEach((h) => {
        const text = t(h);
        if (text) lines.push(`${h.tagName}: ${text}`);
      });

      // Paragraphs / descriptions (first 150 chars each, max 15)
      let pCount = 0;
      document.querySelectorAll("p, .description, [class*='desc'], [class*='subtitle']").forEach((p) => {
        if (pCount >= 15) return;
        const text = t(p);
        if (text.length > 20) { lines.push(`P: ${text}`); pCount++; }
      });

      // Button / CTA texts
      const btns = Array.from(document.querySelectorAll("button, a.btn, [class*='btn'], [class*='cta']"))
        .map(b => b.textContent?.trim()).filter(s => s && s.length < 60).slice(0, 8);
      if (btns.length) lines.push(`BUTTONS: ${btns.join(" | ")}`);

      // List items (features, pricing, testimonials hints)
      let liCount = 0;
      document.querySelectorAll("li").forEach((li) => {
        if (liCount >= 20) return;
        const text = t(li);
        if (text.length > 5 && text.length < 150) { lines.push(`LI: ${text}`); liCount++; }
      });

      // Footer
      const footer = document.querySelector("footer");
      if (footer) {
        const fText = t(footer).slice(0, 200);
        if (fText) lines.push(`FOOTER: ${fText}`);
      }

      return lines.join("\n").slice(0, 4000);
    });

    // Extract cleaned HTML — strip noise, keep semantic structure
    const cleanedHtml = await page.evaluate(() => {
      // Clone to avoid mutating the live DOM
      const clone = document.documentElement.cloneNode(true) as HTMLElement;

      // Remove noisy elements entirely
      clone.querySelectorAll(
        "script, style, noscript, svg, iframe, canvas, video, audio, " +
        "link, meta, head, template, [aria-hidden='true']"
      ).forEach(el => el.remove());

      // Strip noisy attributes, keep semantic ones
      const KEEP_ATTRS = new Set(["id", "href", "src", "alt", "aria-label", "aria-labelledby", "role", "type", "placeholder", "name"]);
      clone.querySelectorAll("*").forEach(el => {
        Array.from(el.attributes).forEach(attr => {
          if (!KEEP_ATTRS.has(attr.name)) el.removeAttribute(attr.name);
        });
        // Remove empty text-only wrappers that add no info
        if (el.children.length === 0 && !el.textContent?.trim()) el.remove();
      });

      // Collapse repeated whitespace in text nodes
      const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
      let node: Text | null;
      while ((node = walker.nextNode() as Text | null)) {
        node.textContent = node.textContent?.replace(/\s+/g, " ") ?? "";
      }

      // Serialize and limit size to ~25KB (~6K tokens)
      return clone.outerHTML.slice(0, 25_000);
    });

    const buf = await page.screenshot({ type: "jpeg", quality: 90, fullPage: false });
    return { base64: buf.toString("base64"), structure, cleanedHtml };
  } finally {
    await browser.close();
  }
}

router.post("/ai/screenshot-to-site", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;

  const { imageBase64, imageUrl } = req.body;
  if (!imageBase64 && !imageUrl) return res.status(400).json({ message: "imageBase64 или imageUrl обязательны" });

  try {
    const imageContent: OpenAI.Chat.ChatCompletionContentPart = imageBase64
      ? { type: "image_url", image_url: { url: `data:image/png;base64,${imageBase64}`, detail: "high" } }
      : { type: "image_url", image_url: { url: imageUrl, detail: "high" } };

    const result = await runAiAnalysis(
      imageContent,
      "Проанализируй скриншот. ШАГ 1: определи 5 главных цветов сайта. ШАГ 2: для каждой секции выбери наиболее подходящий стандартный блок из библиотеки. Используй ZERO_BLOCK только если нет подходящего стандартного. Воспроизведи точно текст, цвета и структуру."
    );
    res.json(result);
  } catch (e: any) {
    if (e.message?.includes("API_KEY") || e.message?.includes("AI не настроен")) return res.status(503).json({ message: e.message });
    console.error("AI screenshot error:", e);
    res.status(500).json({ message: e.message || "Ошибка анализа скриншота" });
  }
});

// Screenshot + DOM structure extraction via Playwright, then analyse with GPT-4o
router.post("/ai/website-to-site", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;

  const { websiteUrl } = req.body;
  if (!websiteUrl) return res.status(400).json({ message: "websiteUrl обязателен" });

  let url: URL;
  try {
    url = new URL(websiteUrl);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error();
  } catch {
    return res.status(400).json({ message: "Некорректный URL сайта" });
  }

  try {
    const { base64, structure, cleanedHtml } = await analyzeWebsite(url.href);

    const imageContent: OpenAI.Chat.ChatCompletionContentPart = {
      type: "image_url",
      image_url: { url: `data:image/jpeg;base64,${base64}`, detail: "high" },
    };

    const structureNote = structure
      ? `\n\n=== СЕМАНТИЧЕСКАЯ СТРУКТУРА (DOM) ===\n${structure}`
      : "";

    const htmlNote = cleanedHtml
      ? `\n\n=== ОЧИЩЕННЫЙ HTML КОД СТРАНИЦЫ ===\n${cleanedHtml}\n=== КОНЕЦ HTML ===\n\nHTML содержит полную разметку: nav, section, article, h1-h4, p, ul/li, button, footer — используй его чтобы точно определить все секции и воспроизвести реальный текст.`
      : "";

    const result = await runAiAnalysis(
      imageContent,
      `Это скриншот сайта ${url.href}.${structureNote}${htmlNote}\n\nШАГ 1: определи 5 главных цветов по скриншоту. ШАГ 2: используя и скриншот, и HTML-код выше, создай блоки для каждой смысловой секции страницы. Для каждой секции выбери наиболее подходящий стандартный блок. ZERO_BLOCK — только для уникальных секций без стандартного аналога. Воспроизведи точный текст из HTML (заголовки, описания, пункты меню, кнопки).`
    );
    res.json(result);
  } catch (e: any) {
    if (e.message?.includes("API_KEY") || e.message?.includes("AI не настроен")) return res.status(503).json({ message: e.message });
    console.error("AI website error:", e);
    res.status(500).json({ message: e.message || "Ошибка анализа сайта" });
  }
});

export default router;
