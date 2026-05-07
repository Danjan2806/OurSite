import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db, usersTable, userSettingsTable, chatMessagesTable, notificationsTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";

const router = Router();
export const JWT_SECRET = process.env.SESSION_SECRET || "saas-builder-dev-secret-key-2024";

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function authUser(req: any, res: any): string | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) { res.status(401).json({ message: "Unauthorized" }); return null; }
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET) as { userId: string };
    return payload.userId;
  } catch { res.status(401).json({ message: "Invalid token" }); return null; }
}

router.post("/auth/register", async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password || !firstName || !lastName)
      return res.status(400).json({ message: "Все поля обязательны" });

    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length) return res.status(409).json({ message: "Email уже зарегистрирован" });

    const passwordHash = await bcrypt.hash(password, 10);
    const id = generateId();
    await db.insert(usersTable).values({ id, email, passwordHash, firstName, lastName, plan: "free" });
    await db.insert(userSettingsTable).values({ userId: id, theme: "dark", notifications: true });

    const token = jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, userId: id, email, firstName, lastName, plan: "free" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      return res.status(401).json({ message: "Неверный email или пароль" });

    const [settings] = await db.select().from(userSettingsTable).where(eq(userSettingsTable.userId, user.id)).limit(1);
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, userId: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, plan: user.plan, role: user.role, avatarUrl: settings?.avatarUrl || null });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/auth/me", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) return res.status(404).json({ message: "User not found" });
    const [settings] = await db.select().from(userSettingsTable).where(eq(userSettingsTable.userId, userId)).limit(1);
    res.json({ userId: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, plan: user.plan, role: user.role, avatarUrl: settings?.avatarUrl || null });
  } catch (e) { res.status(500).json({ message: "Server error" }); }
});

router.get("/auth/settings", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  try {
    const [s] = await db.select().from(userSettingsTable).where(eq(userSettingsTable.userId, userId)).limit(1);
    res.json(s || { theme: "dark", notifications: true, avatarUrl: null, dbAccessLocked: false, dbLockReason: null });
  } catch (e) { res.status(500).json({ message: "Server error" }); }
});

router.put("/auth/settings", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  try {
    const { theme, notifications, emailNotifications } = req.body;
    const updates: Record<string, any> = { updatedAt: new Date() };
    if (theme !== undefined) updates.theme = theme;
    if (notifications !== undefined) updates.notifications = notifications;
    if (emailNotifications !== undefined) updates.emailNotifications = emailNotifications;
    await db.update(userSettingsTable).set(updates).where(eq(userSettingsTable.userId, userId));
    const [s] = await db.select().from(userSettingsTable).where(eq(userSettingsTable.userId, userId)).limit(1);
    res.json(s);
  } catch (e) { res.status(500).json({ message: "Server error" }); }
});

// Global SEO settings (GTM, GA4, defaults)
router.get("/auth/seo-settings", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  try {
    const [s] = await db.select().from(userSettingsTable).where(eq(userSettingsTable.userId, userId)).limit(1);
    const settings = (() => { try { return JSON.parse(s?.seoSettings || "{}"); } catch { return {}; } })();
    res.json(settings);
  } catch (e) { res.status(500).json({ message: "Server error" }); }
});

router.put("/auth/seo-settings", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  try {
    const { gtmId, ga4Id, defaultAuthor, defaultOgImage, robotsPolicy, organizationName, organizationLogo } = req.body;
    const [s] = await db.select().from(userSettingsTable).where(eq(userSettingsTable.userId, userId)).limit(1);
    const existing = (() => { try { return JSON.parse(s?.seoSettings || "{}"); } catch { return {}; } })();
    const updated = { ...existing };
    if (gtmId !== undefined) updated.gtmId = gtmId;
    if (ga4Id !== undefined) updated.ga4Id = ga4Id;
    if (defaultAuthor !== undefined) updated.defaultAuthor = defaultAuthor;
    if (defaultOgImage !== undefined) updated.defaultOgImage = defaultOgImage;
    if (robotsPolicy !== undefined) updated.robotsPolicy = robotsPolicy;
    if (organizationName !== undefined) updated.organizationName = organizationName;
    if (organizationLogo !== undefined) updated.organizationLogo = organizationLogo;
    await db.update(userSettingsTable)
      .set({ seoSettings: JSON.stringify(updated), updatedAt: new Date() })
      .where(eq(userSettingsTable.userId, userId));
    res.json(updated);
  } catch (e) { res.status(500).json({ message: "Server error" }); }
});

router.put("/auth/avatar", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  try {
    const { avatarUrl } = req.body;
    if (avatarUrl && avatarUrl.length > 5 * 1024 * 1024) return res.status(400).json({ message: "Изображение слишком большое (максимум 5 МБ)" });
    await db.update(userSettingsTable)
      .set({ avatarUrl: avatarUrl || null, updatedAt: new Date() })
      .where(eq(userSettingsTable.userId, userId));
    res.json({ avatarUrl: avatarUrl || null });
  } catch (e) { res.status(500).json({ message: "Server error" }); }
});

// Update personal data (firstName, lastName)
router.put("/auth/profile", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  try {
    const { firstName, lastName } = req.body;
    if (!firstName || !lastName) return res.status(400).json({ message: "Имя и фамилия обязательны" });
    await db.update(usersTable).set({ firstName, lastName }).where(eq(usersTable.id, userId));
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    res.json({ userId: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, plan: user.plan });
  } catch (e) { res.status(500).json({ message: "Server error" }); }
});

// Update email
router.put("/auth/email", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  try {
    const { newEmail, password } = req.body;
    if (!newEmail || !password) return res.status(400).json({ message: "Email и пароль обязательны" });
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) return res.status(404).json({ message: "User not found" });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: "Неверный пароль" });
    const exists = await db.select().from(usersTable).where(eq(usersTable.email, newEmail)).limit(1);
    if (exists.length && exists[0].id !== userId) return res.status(409).json({ message: "Email уже занят" });
    await db.update(usersTable).set({ email: newEmail }).where(eq(usersTable.id, userId));
    res.json({ email: newEmail });
  } catch (e) { res.status(500).json({ message: "Server error" }); }
});

// Change password
router.put("/auth/password", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: "Все поля обязательны" });
    if (newPassword.length < 6) return res.status(400).json({ message: "Минимум 6 символов" });
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) return res.status(404).json({ message: "User not found" });
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(401).json({ message: "Неверный текущий пароль" });
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, userId));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ message: "Server error" }); }
});

// Send 2FA code to email (stub - in prod would send email)
router.post("/auth/2fa/send", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  // In production: send actual email. Here we return a mock code.
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  // Store in memory for demo (in prod use Redis with TTL)
  (global as any).__2faCodes = (global as any).__2faCodes || {};
  (global as any).__2faCodes[userId] = { code, expires: Date.now() + 5 * 60 * 1000 };
  res.json({ sent: true, codeForDemo: code }); // Remove codeForDemo in prod
});

// Verify 2FA code
router.post("/auth/2fa/verify", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  const { code } = req.body;
  const stored = (global as any).__2faCodes?.[userId];
  if (!stored || stored.code !== code || Date.now() > stored.expires)
    return res.status(400).json({ message: "Неверный или истёкший код" });
  delete (global as any).__2faCodes[userId];
  res.json({ verified: true });
});

// Support ticket — creates chat conversation + auto-reply
router.post("/auth/support", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  try {
    const { subject, message, category, imageUrl } = req.body;
    if (!message && !imageUrl) return res.status(400).json({ message: "Сообщение обязательно" });

    const ticketId = "TICK-" + Math.random().toString(36).slice(2, 8).toUpperCase();

    // Find a staff member to handle the ticket
    const staff = await db.select({ id: usersTable.id, role: usersTable.role })
      .from(usersTable).where(or(eq(usersTable.role, "admin"), eq(usersTable.role, "moderator")));

    if (staff.length === 0) {
      // No staff yet — still return ticketId, but without creating chat
      return res.json({ ticketId, userId: `USR-${userId.slice(0, 8).toUpperCase()}`, status: "open", createdAt: new Date().toISOString() });
    }

    const staffId = staff.find(s => s.role === "moderator")?.id || staff[0].id;

    // Build ticket label prefix
    const prefix = `[${ticketId}]${category ? ` [${category}]` : ""}${subject ? ` ${subject}` : ""}\n\n`;

    // First message: user → staff (ticket content)
    await db.insert(chatMessagesTable).values({
      fromUserId: userId,
      toUserId: staffId,
      message: prefix + (message || ""),
      imageUrl: imageUrl || null,
      ticketId,
    });

    // Auto-reply: staff → user
    await db.insert(chatMessagesTable).values({
      fromUserId: staffId,
      toUserId: userId,
      message: `Ваша заявка **${ticketId}** принята и находится в обработке. Специалист свяжется с вами в ближайшее время. Спасибо за обращение!`,
      ticketId,
    });

    // Notify staff member about new ticket
    const [sender] = await db.select({ firstName: usersTable.firstName, lastName: usersTable.lastName })
      .from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    const senderName = [sender?.firstName, sender?.lastName].filter(Boolean).join(" ") || "Пользователь";
    await db.insert(notificationsTable).values({
      userId: staffId,
      type: "moderation",
      title: "Новое обращение в поддержку",
      message: `${senderName} создал(а) заявку ${ticketId}${subject ? `: ${subject}` : ""}`,
    });

    res.json({ ticketId, userId: `USR-${userId.slice(0, 8).toUpperCase()}`, status: "open", createdAt: new Date().toISOString() });
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

export default router;
