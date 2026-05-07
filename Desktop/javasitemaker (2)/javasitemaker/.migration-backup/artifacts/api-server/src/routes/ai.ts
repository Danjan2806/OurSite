import { Router } from "express";
import OpenAI from "openai";
import { authUser } from "./auth";

const router = Router();

function getOpenAI() {
  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("AI не настроен. Укажите OPENAI_API_KEY в .env");
  }

  return new OpenAI({
    baseURL: baseURL || "https://api.openai.com/v1",
    apiKey,
  });
}

const BLOCK_TYPES = [
  "HEADER_MENU", "HERO", "FEATURES", "STATS", "TESTIMONIALS",
  "FAQ", "CTA", "FOOTER", "GALLERY", "PRICING", "CONTACTS",
  "PRODUCTS", "TEAM", "SCHEDULE",
];

const SYSTEM_PROMPT = `Ты — эксперт по веб-дизайну. Анализируешь скриншот сайта и возвращаешь ТОЛЬКО валидный JSON без комментариев.

Доступные типы блоков: ${BLOCK_TYPES.join(", ")}.

Описание блоков:
- HEADER_MENU: верхняя навигация с логотипом и меню
- HERO: главный баннер с заголовком, подзаголовком и кнопками
- FEATURES: список преимуществ/функций (обычно 3-6 карточек)
- STATS: цифровая статистика (кол-во клиентов, проектов и т.д.)
- PRICING: тарифные планы
- TESTIMONIALS: отзывы клиентов
- FAQ: часто задаваемые вопросы
- CTA: призыв к действию (большая кнопка / баннер)
- GALLERY: галерея изображений
- TEAM: команда / сотрудники
- SCHEDULE: расписание (для фитнеса, мероприятий)
- PRODUCTS: каталог товаров
- CONTACTS: контактная информация и форма
- FOOTER: нижняя часть сайта с ссылками и копирайтом

Верни JSON строго в формате:
{
  "suggestedName": "название сайта из заголовка",
  "businessType": "LANDING|ECOMMERCE|MUSIC_LABEL|FITNESS",
  "blocks": [
    {
      "type": "ТИП_БЛОКА",
      "content": { ...поля специфичные для блока... },
      "styles": { "bg": "#ТОЧНЫЙ_ЦВЕТ_ИЗ_СКРИНШОТА", "textColor": "#ТОЧНЫЙ_ЦВЕТ_ИЗ_СКРИНШОТА", "ctaColor": "#ТОЧНЫЙ_ЦВЕТ_КНОПКИ" }
    }
  ]
}

КРИТИЧЕСКИ ВАЖНО — ЦВЕТА:
- Извлекай ТОЧНЫЕ hex-коды цветов из скриншота. Смотри на реальный цвет фона, текста и кнопок на изображении.
- НЕ используй шаблонные цвета. Если фон тёмно-синий — пиши "#0d1b2a", если белый — "#ffffff", если серый — "#f5f5f5".
- Для каждого блока "bg" — это точный цвет фона этого раздела, "textColor" — цвет текста в нём.
- "ctaColor" — точный цвет кнопки CTA (если видна).
- Если цвет сложно определить точно — пиши наиболее близкий hex. НЕ оставляй null.

Правила:
- Всегда начинай с HEADER_MENU и заканчивай FOOTER
- Определи businessType по тематике: магазин→ECOMMERCE, музыка/артисты→MUSIC_LABEL, спорт/фитнес→FITNESS, остальное→LANDING
- В content пиши реальный текст с сайта (если виден), иначе — осмысленный placeholder
- Для HEADER_MENU: { logo:"Название", links:[{label:"Страница",url:"#"}], cta:"Кнопка" } — cta СТРОКА, links МАССИВ объектов
- Для HERO: { title:"строка", subtitle:"строка", cta:"строка", ctaUrl:"#" } — все поля СТРОКИ
- Для FEATURES: { title:"строка", items:[{icon:"💡",title:"строка",desc:"строка"}] }
- Для STATS: { items:[{value:"1000+",label:"клиентов"}] }
- Для PRICING: { title:"строка", plans:[{name:"строка",price:"строка",period:"мес",features:["строка"],cta:"Выбрать"}] }
- Для FAQ: { title:"строка", items:[{q:"строка",a:"строка"}] }
- Для TESTIMONIALS: { title:"строка", items:[{name:"строка",text:"строка",rating:5}] }
- Для CTA: { title:"строка", subtitle:"строка", cta:"строка" } — cta СТРОКА
- Для FOOTER: { company:"строка", links:[{label:"строка",url:"#"}], copyright:"строка" }
- НИКОГДА не возвращай cta как массив или объект — только строку!`;

router.post("/ai/screenshot-to-site", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;

  const { imageBase64, imageUrl } = req.body;
  if (!imageBase64 && !imageUrl) {
    return res.status(400).json({ message: "imageBase64 или imageUrl обязательны" });
  }

  try {
    const openai = getOpenAI();

    const imageContent: OpenAI.Chat.ChatCompletionContentPart = imageBase64
      ? {
          type: "image_url",
          image_url: {
            url: `data:image/png;base64,${imageBase64}`,
            detail: "high",
          },
        }
      : {
          type: "image_url",
          image_url: { url: imageUrl, detail: "high" },
        };

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 4096,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            imageContent,
            {
              type: "text",
              text: "Проанализируй этот скриншот сайта и верни JSON с блоками для его воспроизведения.",
            },
          ],
        },
      ],
    });

    const rawText = response.choices[0]?.message?.content || "";

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ message: "AI не вернул корректный JSON" });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.blocks || !Array.isArray(parsed.blocks)) {
      return res.status(500).json({ message: "Некорректный формат ответа AI" });
    }

    const validBlocks = parsed.blocks.filter((b: any) =>
      BLOCK_TYPES.includes(b.type)
    );

    res.json({
      suggestedName: parsed.suggestedName || "Новый сайт",
      businessType: parsed.businessType || "LANDING",
      blocks: validBlocks,
    });
  } catch (e: any) {
    if (e.message?.includes("OPENAI_API_KEY")) {
      return res.status(503).json({ message: e.message });
    }
    console.error("AI screenshot error:", e);
    res.status(500).json({ message: "Ошибка анализа скриншота" });
  }
});

export default router;
