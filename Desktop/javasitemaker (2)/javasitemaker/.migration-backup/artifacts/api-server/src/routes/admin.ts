import { Router } from "express";
import { db, usersTable, sitesTable, blocksTable, userSettingsTable, notificationsTable, chatMessagesTable } from "@workspace/db";
import { eq, sql, desc, count, and, or, inArray, isNotNull } from "drizzle-orm";
import { authUser } from "./auth";

const router = Router();

async function requireAdmin(req: any, res: any): Promise<string | null> {
  const userId = authUser(req, res);
  if (!userId) return null;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user || user.role !== "admin") {
    res.status(403).json({ message: "Доступ запрещён. Требуются права администратора." });
    return null;
  }
  return userId;
}

async function requireStaff(req: any, res: any): Promise<string | null> {
  const userId = authUser(req, res);
  if (!userId) return null;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user || (user.role !== "admin" && user.role !== "moderator")) {
    res.status(403).json({ message: "Доступ запрещён. Требуются права модератора или администратора." });
    return null;
  }
  return userId;
}

// ─── Overview stats ────────────────────────────────────────────────
router.get("/admin/stats", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  try {
    const [usersRes] = await db.select({ count: count() }).from(usersTable);
    const [sitesRes] = await db.select({ count: count() }).from(sitesTable);
    const [blocksRes] = await db.select({ count: count() }).from(blocksTable);

    const allSites = await db.select({ status: sitesTable.status, businessType: sitesTable.businessType }).from(sitesTable);
    const publishedCount = allSites.filter(s => s.status === "PUBLISHED").length;
    const draftCount = allSites.filter(s => s.status === "DRAFT").length;

    const byType: Record<string, number> = {};
    for (const s of allSites) {
      byType[s.businessType] = (byType[s.businessType] || 0) + 1;
    }

    const allUsers = await db.select({ plan: usersTable.plan, createdAt: usersTable.createdAt, role: usersTable.role }).from(usersTable);
    const byPlan: Record<string, number> = {};
    for (const u of allUsers) {
      byPlan[u.plan] = (byPlan[u.plan] || 0) + 1;
    }
    const adminCount = allUsers.filter(u => u.role === "admin").length;

    const regChart = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split("T")[0];
      const count2 = allUsers.filter(u => u.createdAt.toISOString().split("T")[0] === dateStr).length;
      return { date: dateStr, registrations: count2 };
    });

    res.json({
      totalUsers: usersRes.count,
      totalSites: sitesRes.count,
      totalBlocks: blocksRes.count,
      publishedSites: publishedCount,
      draftSites: draftCount,
      adminUsers: adminCount,
      sitesByType: byType,
      usersByPlan: byPlan,
      registrationChart: regChart,
    });
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

// ─── All users ────────────────────────────────────────────────────
router.get("/admin/users", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  try {
    const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
    const sitesCounts = await db.select({ userId: sitesTable.userId, count: count() }).from(sitesTable).groupBy(sitesTable.userId);
    const scMap = Object.fromEntries(sitesCounts.map(r => [r.userId, Number(r.count)]));

    const avatars = await db.select({ userId: userSettingsTable.userId, avatarUrl: userSettingsTable.avatarUrl }).from(userSettingsTable);
    const avMap = Object.fromEntries(avatars.map(a => [a.userId, a.avatarUrl]));

    res.json(users.map(u => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      plan: u.plan,
      role: u.role,
      sitesCount: scMap[u.id] || 0,
      avatarUrl: avMap[u.id] || null,
      createdAt: u.createdAt,
    })));
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

// ─── Update user (plan / role) ─────────────────────────────────────
router.put("/admin/users/:id", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  try {
    const { plan, role } = req.body;
    const updates: any = {};
    if (plan) updates.plan = plan;
    if (role) updates.role = role;
    await db.update(usersTable).set(updates).where(eq(usersTable.id, req.params.id));
    const [u] = await db.select().from(usersTable).where(eq(usersTable.id, req.params.id)).limit(1);
    res.json(u);
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

// ─── Delete user ───────────────────────────────────────────────────
router.delete("/admin/users/:id", async (req, res) => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;
  if (req.params.id === adminId) return res.status(400).json({ message: "Нельзя удалить себя" });
  try {
    await db.delete(usersTable).where(eq(usersTable.id, req.params.id));
    res.status(204).send();
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

// ─── All sites (staff) ────────────────────────────────────────────
router.get("/admin/sites", async (req, res) => {
  if (!await requireStaff(req, res)) return;
  try {
    const sites = await db.select({
      id: sitesTable.id, name: sitesTable.name, subdomain: sitesTable.subdomain,
      businessType: sitesTable.businessType, status: sitesTable.status,
      publishedUrl: sitesTable.publishedUrl, createdAt: sitesTable.createdAt,
      updatedAt: sitesTable.updatedAt, userId: sitesTable.userId,
      frozen: sitesTable.frozen, frozenReason: sitesTable.frozenReason,
      frozenBy: sitesTable.frozenBy, frozenAt: sitesTable.frozenAt,
    }).from(sitesTable).orderBy(desc(sitesTable.updatedAt));

    const blockCounts = await db.select({ siteId: blocksTable.siteId, count: count() }).from(blocksTable).groupBy(blocksTable.siteId);
    const bcMap = Object.fromEntries(blockCounts.map(b => [b.siteId, Number(b.count)]));

    const users = await db.select({ id: usersTable.id, email: usersTable.email, firstName: usersTable.firstName, lastName: usersTable.lastName }).from(usersTable);
    const uMap = Object.fromEntries(users.map(u => [u.id, u]));

    res.json(sites.map(s => ({
      ...s,
      blocksCount: bcMap[s.id] || 0,
      owner: uMap[s.userId] || null,
    })));
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

// ─── Delete site (admin) ───────────────────────────────────────────
router.delete("/admin/sites/:id", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  try {
    const reason = req.query.reason as string || "";
    const [site] = await db.select({ userId: sitesTable.userId, name: sitesTable.name }).from(sitesTable).where(eq(sitesTable.id, req.params.id)).limit(1);
    if (site && site.userId) {
      const notifMessage = reason
        ? `Ваш сайт «${site.name}» был удалён администратором. Причина: ${reason}`
        : `Ваш сайт «${site.name}» был удалён администратором.`;
      await db.insert(notificationsTable).values({
        userId: site.userId,
        title: "Сайт удалён",
        message: notifMessage,
        type: "error",
      });
    }
    await db.delete(sitesTable).where(eq(sitesTable.id, req.params.id));
    res.status(204).send();
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

// ─── Freeze / unfreeze site (staff) ───────────────────────────────
router.put("/admin/sites/:id/freeze", async (req, res) => {
  const staffId = await requireStaff(req, res);
  if (!staffId) return;
  try {
    const { frozen, reason } = req.body;
    await db.update(sitesTable).set({
      frozen: !!frozen,
      frozenReason: frozen ? (reason || "Нарушение пользовательского соглашения") : null,
      frozenBy: frozen ? staffId : null,
      frozenAt: frozen ? new Date() : null,
      updatedAt: new Date(),
    }).where(eq(sitesTable.id, req.params.id));

    const [site] = await db.select({ userId: sitesTable.userId, name: sitesTable.name }).from(sitesTable).where(eq(sitesTable.id, req.params.id)).limit(1);
    if (site?.userId) {
      await db.insert(notificationsTable).values({
        userId: site.userId,
        title: frozen ? "Сайт заморожен" : "Сайт разморожен",
        message: frozen
          ? `Ваш сайт «${site.name}» был заморожен модератором. Причина: ${reason || "Нарушение пользовательского соглашения"}. Сайт недоступен для посетителей до разморозки.`
          : `Ваш сайт «${site.name}» был разморожен. Сайт снова доступен.`,
        type: frozen ? "moderation" : "success",
      });
    }
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

// ─── Lock/unlock user DB access ────────────────────────────────────
router.put("/admin/users/:id/db-lock", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  try {
    const { locked, reason } = req.body;
    const lockReason = reason || (locked ? "Временные технические работы" : null);
    await db.update(userSettingsTable).set({
      dbAccessLocked: !!locked,
      dbLockReason: locked ? lockReason : null,
      updatedAt: new Date(),
    }).where(eq(userSettingsTable.userId, req.params.id));
    if (locked) {
      await db.insert(notificationsTable).values({
        userId: req.params.id,
        title: "Дамп памяти временно недоступен",
        message: lockReason,
        type: "warning",
      });
    } else {
      await db.insert(notificationsTable).values({
        userId: req.params.id,
        title: "Дамп памяти снова доступен",
        message: "Доступ к вашему дампу памяти восстановлен.",
        type: "success",
      });
    }
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

// ─── Lock/unlock ALL users DB access ───────────────────────────────
router.put("/admin/db-lock-all", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  try {
    const { locked, reason } = req.body;
    const lockReason = reason || (locked ? "Временные технические работы" : null);
    await db.update(userSettingsTable).set({
      dbAccessLocked: !!locked,
      dbLockReason: locked ? lockReason : null,
      updatedAt: new Date(),
    });
    const allUsers = await db.select({ id: usersTable.id }).from(usersTable);
    const notifValues = allUsers.map(u => ({
      userId: u.id,
      title: locked ? "Дамп памяти временно недоступен" : "Дамп памяти снова доступен",
      message: locked ? lockReason! : "Доступ к вашему дампу памяти восстановлен.",
      type: locked ? "warning" : "success",
    }));
    if (notifValues.length > 0) await db.insert(notificationsTable).values(notifValues);
    res.json({ ok: true, affected: allUsers.length });
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

// ─── System info ────────────────────────────────────────────────────
router.get("/admin/system", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  try {
    const dbSize = await db.execute(sql`SELECT pg_size_pretty(pg_database_size(current_database())) as size, pg_database_size(current_database()) as bytes`);
    const row = (dbSize.rows as any[])[0];
    res.json({
      dbSizePretty: row?.size || "N/A",
      dbSizeBytes: row?.bytes || 0,
      nodeVersion: process.version,
      platform: process.platform,
      uptime: Math.floor(process.uptime()),
      memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      env: process.env.NODE_ENV || "development",
    });
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

// ─── Notifications (for any authenticated user) ──────────────────
router.get("/notifications", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  try {
    const notifs = await db.select().from(notificationsTable)
      .where(eq(notificationsTable.userId, userId))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(50);
    res.json(notifs);
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

router.get("/notifications/unread-count", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  try {
    const [result] = await db.select({ count: count() }).from(notificationsTable)
      .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.read, false)));
    res.json({ count: result.count });
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

router.put("/notifications/read-all", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  try {
    await db.update(notificationsTable).set({ read: true })
      .where(eq(notificationsTable.userId, userId));
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

router.put("/notifications/:id/read", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  try {
    await db.update(notificationsTable).set({ read: true })
      .where(and(eq(notificationsTable.id, parseInt(req.params.id)), eq(notificationsTable.userId, userId)));
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

// ─── Admin: Send notification to user ─────────────────────────────
router.post("/admin/notifications", async (req, res) => {
  if (!await requireStaff(req, res)) return;
  try {
    const { userId, title, message, type } = req.body;
    if (!userId || !title || !message) return res.status(400).json({ message: "userId, title, message обязательны" });
    const [notif] = await db.insert(notificationsTable).values({
      userId, title, message, type: type || "warning",
    }).returning();
    res.json(notif);
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

// ─── Admin: Send notification to all users ────────────────────────
router.post("/admin/notifications/broadcast", async (req, res) => {
  if (!await requireStaff(req, res)) return;
  try {
    const { title, message, type } = req.body;
    if (!title || !message) return res.status(400).json({ message: "title, message обязательны" });
    const allUsers = await db.select({ id: usersTable.id }).from(usersTable);
    const values = allUsers.map(u => ({ userId: u.id, title, message, type: type || "info" }));
    if (values.length > 0) await db.insert(notificationsTable).values(values);
    res.json({ sent: values.length });
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

// ─── Chat messages (moderator ↔ user) ────────────────────────────
// IMPORTANT: exact routes must be declared BEFORE dynamic /:param routes

// Get unread chat count for current user
router.get("/chat/unread-count", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  try {
    const [result] = await db.select({ count: count() }).from(chatMessagesTable)
      .where(and(eq(chatMessagesTable.toUserId, userId), eq(chatMessagesTable.read, false)));
    res.json({ count: result.count });
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

// Get all messages between current user and any staff member (admin/moderator)
router.get("/chat/support-thread", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  try {
    const staff = await db.select({ id: usersTable.id, firstName: usersTable.firstName, lastName: usersTable.lastName, role: usersTable.role })
      .from(usersTable).where(or(eq(usersTable.role, "admin"), eq(usersTable.role, "moderator")));
    if (staff.length === 0) return res.json({ messages: [], staffIds: [] });

    const staffIds = staff.map(s => s.id);

    const messages = await db.select().from(chatMessagesTable)
      .where(
        or(
          and(eq(chatMessagesTable.fromUserId, userId), inArray(chatMessagesTable.toUserId, staffIds)),
          and(eq(chatMessagesTable.toUserId, userId), inArray(chatMessagesTable.fromUserId, staffIds))
        )
      )
      .orderBy(chatMessagesTable.createdAt)
      .limit(200);

    // Mark incoming staff messages as read
    await db.update(chatMessagesTable).set({ read: true })
      .where(and(eq(chatMessagesTable.toUserId, userId), inArray(chatMessagesTable.fromUserId, staffIds)));

    // Enrich messages with sender info
    const allUserIds = [...new Set(messages.flatMap(m => [m.fromUserId, m.toUserId]))];
    const users = allUserIds.length > 0
      ? await db.select({ id: usersTable.id, firstName: usersTable.firstName, lastName: usersTable.lastName, role: usersTable.role })
          .from(usersTable).where(inArray(usersTable.id, allUserIds))
      : [];
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));

    const enriched = messages.map(m => ({
      ...m,
      fromUser: userMap[m.fromUserId] || null,
    }));

    res.json({ messages: enriched, staffIds });
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

// Send message to support (auto-picks existing staff contact or first available moderator)
router.post("/chat/to-support", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  try {
    const { message, imageUrl } = req.body;
    if (!message?.trim() && !imageUrl) return res.status(400).json({ message: "Сообщение не может быть пустым" });

    const staff = await db.select({ id: usersTable.id, role: usersTable.role })
      .from(usersTable).where(or(eq(usersTable.role, "admin"), eq(usersTable.role, "moderator")));
    if (staff.length === 0) return res.status(503).json({ message: "Сотрудники поддержки недоступны" });

    const staffIds = staff.map(s => s.id);

    // Try to find existing staff contact first
    const [existing] = await db.select({ toUserId: chatMessagesTable.toUserId })
      .from(chatMessagesTable)
      .where(and(eq(chatMessagesTable.fromUserId, userId), inArray(chatMessagesTable.toUserId, staffIds)))
      .limit(1);

    const targetStaffId = existing?.toUserId
      || staff.find(s => s.role === "moderator")?.id
      || staff[0].id;

    const [msg] = await db.insert(chatMessagesTable).values({
      fromUserId: userId,
      toUserId: targetStaffId,
      message: message?.trim() || "",
      imageUrl: imageUrl || null,
    }).returning();

    // Notify staff member about new message from user
    const [senderInfo] = await db.select({ firstName: usersTable.firstName, lastName: usersTable.lastName })
      .from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    const senderName = [senderInfo?.firstName, senderInfo?.lastName].filter(Boolean).join(" ") || "Пользователь";
    await db.insert(notificationsTable).values({
      userId: targetStaffId,
      type: "info",
      title: "Новое сообщение в поддержке",
      message: `${senderName}: ${message?.trim().slice(0, 120) || "[изображение]"}`,
    });

    res.json(msg);
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

// Get conversation between current user and another specific user (dynamic — must stay AFTER exact routes above)
router.get("/chat/:withUserId", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  try {
    const other = req.params.withUserId;

    // If current user is staff — show ALL messages between the other user and ANY staff member (shared inbox)
    const [currentUser] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    const isStaff = currentUser?.role === "admin" || currentUser?.role === "moderator";

    let messages;
    if (isStaff) {
      const allStaff = await db.select({ id: usersTable.id })
        .from(usersTable).where(or(eq(usersTable.role, "admin"), eq(usersTable.role, "moderator")));
      const allStaffIds = allStaff.map(s => s.id);
      messages = await db.select().from(chatMessagesTable)
        .where(or(
          and(inArray(chatMessagesTable.fromUserId, allStaffIds), eq(chatMessagesTable.toUserId, other)),
          and(eq(chatMessagesTable.fromUserId, other), inArray(chatMessagesTable.toUserId, allStaffIds))
        ))
        .orderBy(chatMessagesTable.createdAt)
        .limit(200);
      // Mark messages sent to this specific staff member as read
      await db.update(chatMessagesTable).set({ read: true })
        .where(and(eq(chatMessagesTable.toUserId, userId), eq(chatMessagesTable.fromUserId, other)));
    } else {
      messages = await db.select().from(chatMessagesTable)
        .where(or(
          and(eq(chatMessagesTable.fromUserId, userId), eq(chatMessagesTable.toUserId, other)),
          and(eq(chatMessagesTable.fromUserId, other), eq(chatMessagesTable.toUserId, userId))
        ))
        .orderBy(chatMessagesTable.createdAt)
        .limit(200);
      await db.update(chatMessagesTable).set({ read: true })
        .where(and(eq(chatMessagesTable.toUserId, userId), eq(chatMessagesTable.fromUserId, other)));
    }

    res.json(messages);
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

// Send a chat message to a specific user (dynamic — must stay AFTER exact routes above)
router.post("/chat/:toUserId", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  try {
    const { message, imageUrl } = req.body;
    if (!message?.trim() && !imageUrl) return res.status(400).json({ message: "Сообщение не может быть пустым" });
    const toUserId = req.params.toUserId;

    const [target] = await db.select({ id: usersTable.id, role: usersTable.role }).from(usersTable).where(eq(usersTable.id, toUserId)).limit(1);
    if (!target) return res.status(404).json({ message: "Пользователь не найден" });

    const [msg] = await db.insert(chatMessagesTable).values({
      fromUserId: userId,
      toUserId,
      message: message?.trim() || "",
      imageUrl: imageUrl || null,
    }).returning();

    // If sender is staff (admin/moderator), notify the recipient user
    const [senderInfo] = await db.select({ role: usersTable.role, firstName: usersTable.firstName, lastName: usersTable.lastName })
      .from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (senderInfo && (senderInfo.role === "admin" || senderInfo.role === "moderator")) {
      const staffName = [senderInfo.firstName, senderInfo.lastName].filter(Boolean).join(" ") || "Поддержка";
      await db.insert(notificationsTable).values({
        userId: toUserId,
        type: "info",
        title: "Ответ от поддержки",
        message: `${staffName}: ${message?.trim().slice(0, 120) || "[изображение]"}`,
      });
    }

    res.json(msg);
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

// Get list of conversations for moderator/admin (shared inbox — shows ALL staff conversations)
router.get("/admin/chat/conversations", async (req, res) => {
  const staffId = await requireStaff(req, res);
  if (!staffId) return;
  try {
    // Collect ALL staff IDs for shared inbox
    const allStaff = await db.select({ id: usersTable.id })
      .from(usersTable).where(or(eq(usersTable.role, "admin"), eq(usersTable.role, "moderator")));
    const allStaffIds = allStaff.map(s => s.id);

    // Get all unique non-staff users who have chatted with ANY staff member
    const sent = await db.select({ userId: chatMessagesTable.toUserId })
      .from(chatMessagesTable).where(inArray(chatMessagesTable.fromUserId, allStaffIds));
    const received = await db.select({ userId: chatMessagesTable.fromUserId })
      .from(chatMessagesTable).where(inArray(chatMessagesTable.toUserId, allStaffIds));

    const userIds = [...new Set([...sent.map(m => m.userId), ...received.map(m => m.userId)])]
      .filter(id => !allStaffIds.includes(id));

    const users = userIds.length > 0
      ? await db.select({ id: usersTable.id, firstName: usersTable.firstName, lastName: usersTable.lastName, email: usersTable.email, role: usersTable.role })
          .from(usersTable).where(inArray(usersTable.id, userIds))
      : [];

    // Unread = messages from users to ANY staff member not yet read
    const unreadCounts = await db.select({ fromUserId: chatMessagesTable.fromUserId, count: count() })
      .from(chatMessagesTable)
      .where(and(inArray(chatMessagesTable.toUserId, allStaffIds), eq(chatMessagesTable.read, false)))
      .groupBy(chatMessagesTable.fromUserId);
    const unreadMap = Object.fromEntries(unreadCounts.map(u => [u.fromUserId, Number(u.count)]));

    // Get latest ticketId per user conversation
    const ticketRows = userIds.length > 0
      ? await db.select({ fromUserId: chatMessagesTable.fromUserId, ticketId: chatMessagesTable.ticketId })
          .from(chatMessagesTable)
          .where(and(inArray(chatMessagesTable.fromUserId, userIds), isNotNull(chatMessagesTable.ticketId)))
          .orderBy(desc(chatMessagesTable.createdAt))
      : [];

    const ticketMap: Record<string, string> = {};
    for (const row of ticketRows) {
      if (row.ticketId && !ticketMap[row.fromUserId]) ticketMap[row.fromUserId] = row.ticketId;
    }

    res.json(users.map(u => ({
      ...u,
      unread: unreadMap[u.id] || 0,
      ticketId: ticketMap[u.id] || null,
      shortUserId: `USR-${u.id.slice(0, 8).toUpperCase()}`,
    })));
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

export default router;
