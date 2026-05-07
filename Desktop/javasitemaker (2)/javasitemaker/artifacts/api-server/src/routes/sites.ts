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
  FEATURES: { content: JSON.stringify({ title: "Почему выбирают нас", subtitle: "Всё необходимое для успеха вашего бизнеса", items: [{ icon: "Zap", title: "Молниеносная скорость", desc: "Страницы загружаются мгновенно." }, { icon: "Shield", title: "Надёжная безопасность", desc: "SSL и ежедневное резервное копирование." }, { icon: "Palette", title: "Гибкий дизайн", desc: "Сотни блоков и неограниченная кастомизация." }] }), styles: JSON.stringify({ bg: "#0f0f23", textColor: "#e2e8f0", columns: 3 }) },
  PRICING: { content: JSON.stringify({ title: "Простые тарифы", subtitle: "Начните бесплатно", plans: [{ name: "Free", price: "$0", period: "мес", features: ["1 сайт", "5 блоков"], cta: "Начать", ctaUrl: "#" }, { name: "Pro", price: "$19", period: "мес", features: ["10 сайтов", "∞ блоков"], highlighted: true, cta: "Попробовать", ctaUrl: "#" }] }), styles: JSON.stringify({ bg: "#0a0a14", textColor: "#ffffff" }) },
  TESTIMONIALS: { content: JSON.stringify({ title: "Что говорят клиенты", items: [{ text: "Создал лендинг за 20 минут!", author: "Иван Петров", role: "CEO" }] }), styles: JSON.stringify({ bg: "#0f0f23", textColor: "#cbd5e1" }) },
  CTA: { content: JSON.stringify({ title: "Готовы создать сайт мечты?", subtitle: "Первый сайт — бесплатно.", cta: "Начать бесплатно", ctaUrl: "#" }), styles: JSON.stringify({ bg: "linear-gradient(135deg, #7C3AED, #4F46E5)", textColor: "#ffffff" }) },
  FOOTER: { content: JSON.stringify({ company: "Моя Компания", slogan: "Строим будущее вместе", links: [{ label: "О нас", url: "#" }], copyright: "© 2025 Моя Компания." }), styles: JSON.stringify({ bg: "#050510", textColor: "#475569" }) },
  PRODUCTS: { content: JSON.stringify({ title: "Каталог товаров", items: [{ name: "Товар 1", price: "1 200₽", image: "", badge: "Хит" }] }), styles: JSON.stringify({ bg: "#0f0f23", textColor: "#ffffff", columns: 3 }) },
  GALLERY: { content: JSON.stringify({ title: "Галерея", images: [] }), styles: JSON.stringify({ bg: "#0a0a14", textColor: "#ffffff", columns: 3 }) },
  VIDEO: { content: JSON.stringify({ title: "Смотрите как это работает", url: "" }), styles: JSON.stringify({ bg: "#0f0f23", textColor: "#ffffff" }) },
  TEXT: { content: JSON.stringify({ title: "Заголовок блока", body: "Здесь будет ваш текст." }), styles: JSON.stringify({ bg: "#0f0f23", textColor: "#e2e8f0", align: "left" }) },
  STATS: { content: JSON.stringify({ title: "В цифрах", items: [{ value: "10K+", label: "Клиентов" }, { value: "99.9%", label: "Uptime" }] }), styles: JSON.stringify({ bg: "#0a0a1a", textColor: "#ffffff" }) },
  TEAM: { content: JSON.stringify({ title: "Наша команда", members: [{ name: "Алексей Кузнецов", role: "CEO", avatar: "" }] }), styles: JSON.stringify({ bg: "#0f0f23", textColor: "#ffffff" }) },
  FAQ: { content: JSON.stringify({ title: "FAQ", items: [{ q: "Нужны знания кода?", a: "Нет!" }] }), styles: JSON.stringify({ bg: "#0f0f23", textColor: "#e2e8f0" }) },
  CONTACTS: { content: JSON.stringify({ title: "Контакты", email: "hello@company.com" }), styles: JSON.stringify({ bg: "#0a0a14", textColor: "#e2e8f0" }) },
  MUSIC_PLAYER: { content: JSON.stringify({ title: "Новый трек", artist: "Исполнитель", coverUrl: "", trackUrl: "" }), styles: JSON.stringify({ bg: "#0f172a", textColor: "#f1f5f9" }) },
  DISCOGRAPHY: { content: JSON.stringify({ title: "Дискография", albums: [] }), styles: JSON.stringify({ bg: "#1e293b", textColor: "#e2e8f0" }) },
  SCHEDULE: { content: JSON.stringify({ title: "Расписание", items: [] }), styles: JSON.stringify({ bg: "#1e293b", textColor: "#e2e8f0" }) },
  COACHES: { content: JSON.stringify({ title: "Наши тренеры", members: [] }), styles: JSON.stringify({ bg: "#1a1a2e", textColor: "#ffffff" }) },
  FORM: { content: JSON.stringify({ title: "Оставьте заявку", fields: [{ label: "Имя", type: "text", required: true }, { label: "Email", type: "email", required: true }], ctaLabel: "Отправить" }), styles: JSON.stringify({ bg: "#0f0f23", textColor: "#e2e8f0", ctaColor: "#7C3AED" }) },
  BLOG: { content: JSON.stringify({ title: "Блог", items: [] }), styles: JSON.stringify({ bg: "#0f0f23", textColor: "#e2e8f0" }) },
  HEADER_MENU: { content: JSON.stringify({ logo: "Компания", links: [{ label: "Главная", url: "#", active: true }], cta: "Связаться", ctaUrl: "#" }), styles: JSON.stringify({ bg: "#070711", textColor: "#e2e8f0", ctaColor: "#7C3AED" }) },
};

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
    const pageId = generateId();
    await db.insert(pagesTable).values({ id: pageId, siteId: id, name: "Главная", slug: "index", position: 0 });

    const TEMPLATES: Record<string, string[]> = {
      LANDING:     ["HEADER_MENU", "HERO", "FEATURES", "STATS", "TESTIMONIALS", "FAQ", "CTA", "FOOTER"],
      ECOMMERCE:   ["HEADER_MENU", "HERO", "PRODUCTS", "FEATURES", "STATS", "TESTIMONIALS", "FAQ", "FOOTER"],
      MUSIC_LABEL: ["HEADER_MENU", "HERO", "MUSIC_PLAYER", "DISCOGRAPHY", "TEAM", "GALLERY", "CONTACTS", "FOOTER"],
      FITNESS:     ["HEADER_MENU", "HERO", "STATS", "FEATURES", "SCHEDULE", "COACHES", "PRICING", "TESTIMONIALS", "FAQ", "FOOTER"],
    };

    const template = TEMPLATES[businessType] || TEMPLATES.LANDING;
    const blockInserts = template.map((type, i) => ({
      id: generateId(),
      siteId: id,
      pageId,
      type,
      position: i,
      content: BLOCK_DEFAULTS[type]?.content || "{}",
      styles: BLOCK_DEFAULTS[type]?.styles || "{}",
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
    const [site] = await db.select().from(sitesTable).where(and(eq(sitesTable.id, req.params.id), eq(sitesTable.userId, userId))).limit(1);
    if (!site) return res.status(404).json({ message: "Site not found" });
    await db.update(sitesTable).set({ globalStyles: req.body.styles || "{}", updatedAt: new Date() }).where(eq(sitesTable.id, site.id));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ message: "Server error" }); }
});

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
    const [site] = await db.select().from(sitesTable).where(and(eq(sitesTable.id, req.params.id), eq(sitesTable.userId, userId))).limit(1);
    if (!site) return res.status(404).json({ message: "Site not found" });
    const [page] = await db.select().from(pagesTable).where(and(eq(pagesTable.id, req.params.pageId), eq(pagesTable.siteId, site.id))).limit(1);
    if (!page) return res.status(404).json({ message: "Page not found" });
    const { name, slug, meta } = req.body;
    const updates: any = {};
    if (name) updates.name = name;
    if (slug) updates.slug = slug.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (meta !== undefined) updates.meta = meta;
    await db.update(pagesTable).set(updates).where(eq(pagesTable.id, page.id));
    const [updated] = await db.select().from(pagesTable).where(eq(pagesTable.id, page.id)).limit(1);
    res.json(updated);
  } catch (e) { res.status(500).json({ message: "Server error" }); }
});

router.delete("/sites/:id/pages/:pageId", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  try {
    const [site] = await db.select().from(sitesTable).where(and(eq(sitesTable.id, req.params.id), eq(sitesTable.userId, userId))).limit(1);
    if (!site) return res.status(404).json({ message: "Site not found" });
    const remaining = await db.select().from(pagesTable).where(eq(pagesTable.siteId, site.id));
    if (remaining.length <= 1) return res.status(400).json({ message: "Нельзя удалить последнюю страницу" });
    const target = remaining.find(p => p.id === req.params.pageId);
    if (!target) return res.status(404).json({ message: "Page not found" });
    await db.delete(blocksTable).where(eq(blocksTable.pageId, target.id));
    await db.delete(pagesTable).where(eq(pagesTable.id, target.id));
    res.status(204).send();
  } catch (e) { res.status(500).json({ message: "Server error" }); }
});

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
    const [site] = await db.select().from(sitesTable).where(and(eq(sitesTable.id, req.params.id), eq(sitesTable.userId, userId))).limit(1);
    if (!site) return res.status(404).json({ message: "Site not found" });
    const [block] = await db.select().from(blocksTable).where(and(eq(blocksTable.id, req.params.blockId), eq(blocksTable.siteId, site.id))).limit(1);
    if (!block) return res.status(404).json({ message: "Block not found" });
    const { content, styles, visible, width, rowId, pageId, position } = req.body;
    const updates: any = {};
    if (content !== undefined) updates.content = content;
    if (styles !== undefined) updates.styles = styles;
    if (visible !== undefined) updates.visible = visible;
    if (width !== undefined) updates.width = width;
    if (rowId !== undefined) updates.rowId = rowId;
    if (pageId !== undefined) updates.pageId = pageId;
    if (position !== undefined) updates.position = position;
    await db.update(blocksTable).set(updates).where(eq(blocksTable.id, block.id));
    const [updated] = await db.select().from(blocksTable).where(eq(blocksTable.id, block.id)).limit(1);
    res.json(updated);
  } catch (e) { res.status(500).json({ message: "Server error" }); }
});

router.delete("/sites/:id/blocks/:blockId", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  try {
    const [site] = await db.select().from(sitesTable).where(and(eq(sitesTable.id, req.params.id), eq(sitesTable.userId, userId))).limit(1);
    if (!site) return res.status(404).json({ message: "Site not found" });
    const [block] = await db.select().from(blocksTable).where(and(eq(blocksTable.id, req.params.blockId), eq(blocksTable.siteId, site.id))).limit(1);
    if (!block) return res.status(404).json({ message: "Block not found" });
    await db.delete(blocksTable).where(eq(blocksTable.id, block.id));
    res.status(204).send();
  } catch (e) { res.status(500).json({ message: "Server error" }); }
});

router.put("/sites/:id/blocks/reorder", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  try {
    const [site] = await db.select().from(sitesTable).where(and(eq(sitesTable.id, req.params.id), eq(sitesTable.userId, userId))).limit(1);
    if (!site) return res.status(404).json({ message: "Site not found" });
    const { ids } = req.body as { ids: string[] };
    const siteBlocks = await db.select({ id: blocksTable.id }).from(blocksTable).where(eq(blocksTable.siteId, site.id));
    const ownedIds = new Set(siteBlocks.map(b => b.id));
    const safeIds = ids.filter(id => ownedIds.has(id));
    await Promise.all(safeIds.map((id, idx) => db.update(blocksTable).set({ position: idx }).where(eq(blocksTable.id, id))));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ message: "Server error" }); }
});

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
