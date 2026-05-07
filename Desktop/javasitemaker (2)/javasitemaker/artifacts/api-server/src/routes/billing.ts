import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authUser } from "./auth";

const router = Router();
const VALID_PLANS = ["free", "pro", "business"];

router.post("/billing/subscribe", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  try {
    const { plan, billing, cardNumber, cardExpiry, cardCvv, cardHolder } = req.body;
    if (!plan || !VALID_PLANS.includes(plan)) return res.status(400).json({ message: "Неверный тариф" });
    if (plan === "free") {
      await db.update(usersTable).set({ plan: "free" }).where(eq(usersTable.id, userId));
      return res.json({ plan: "free", message: "Тариф изменён на Free" });
    }
    const isTrial = req.body.trial === true;
    if (!isTrial && (!cardNumber || !cardExpiry || !cardCvv || !cardHolder))
      return res.status(400).json({ message: "Заполните все поля карты" });
    if (isTrial) {
      await db.update(usersTable).set({ plan }).where(eq(usersTable.id, userId));
      return res.json({ plan, billing, message: `Пробный период тарифа ${plan} активирован` });
    }
    const digits = (cardNumber as string).replace(/\D/g, "");
    if (digits.length < 13 || digits.length > 19)
      return res.status(400).json({ message: "Неверный номер карты" });
    const [expMonth, expYear] = (cardExpiry as string).split("/").map(s => parseInt(s.trim(), 10));
    const now = new Date();
    const fullYear = expYear < 100 ? 2000 + expYear : expYear;
    if (!expMonth || !expYear || expMonth < 1 || expMonth > 12 || fullYear < now.getFullYear() ||
      (fullYear === now.getFullYear() && expMonth < now.getMonth() + 1))
      return res.status(400).json({ message: "Срок действия карты истёк или неверен" });
    if ((cardCvv as string).replace(/\D/g, "").length < 3)
      return res.status(400).json({ message: "Неверный CVV" });
    await db.update(usersTable).set({ plan }).where(eq(usersTable.id, userId));
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    return res.json({ plan: user.plan, billing, message: `Тариф ${plan} успешно активирован` });
  } catch (err) {
    console.error("[billing/subscribe]", err);
    return res.status(500).json({ message: "Ошибка при обработке платежа" });
  }
});

router.post("/billing/cancel", async (req, res) => {
  const userId = authUser(req, res);
  if (!userId) return;
  try {
    await db.update(usersTable).set({ plan: "free" }).where(eq(usersTable.id, userId));
    return res.json({ plan: "free", message: "Подписка отменена, тариф сброшен на Free" });
  } catch (err) {
    console.error("[billing/cancel]", err);
    return res.status(500).json({ message: "Ошибка отмены подписки" });
  }
});

export default router;
