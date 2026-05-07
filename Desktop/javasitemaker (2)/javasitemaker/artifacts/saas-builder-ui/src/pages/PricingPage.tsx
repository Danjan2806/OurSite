import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import AppHeader from "@/components/AppHeader";
import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/lib/store";
import { billingApi } from "@/lib/api";
import { X, CreditCard, Lock, CheckCircle, ArrowRight, Spinner } from "@phosphor-icons/react";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: { monthly: 0, yearly: 0 },
    desc: "Для старта и пробы",
    badge: null,
    color: "border-white/10",
    features: [
      "1 сайт",
      "5 блоков на сайт",
      "Домен *.lilluucore.com",
      "Базовая аналитика (7 дней)",
      "Поддержка по email",
      "512 МБ хранилища",
    ],
    disabled: ["Кастомный домен", "Приоритетная поддержка", "API доступ", "White Label"],
  },
  {
    id: "pro",
    name: "Pro",
    price: { monthly: 19, yearly: 15 },
    desc: "Для фрилансеров и малого бизнеса",
    badge: "Популярный",
    color: "border-primary/50",
    features: [
      "10 сайтов",
      "Неограниченно блоков",
      "Домен *.lilluucore.com",
      "Полная аналитика (90 дней)",
      "Приоритетная поддержка",
      "10 ГБ хранилища",
      "Загрузка изображений",
      "Экспорт данных",
    ],
    disabled: ["API доступ", "White Label"],
  },
  {
    id: "business",
    name: "Business",
    price: { monthly: 49, yearly: 39 },
    desc: "Для агентств и команд",
    badge: null,
    color: "border-white/10",
    features: [
      "Неограниченно сайтов",
      "Неограниченно блоков",
      "Кастомный домен",
      "Полная аналитика (1 год)",
      "Выделенная поддержка 24/7",
      "100 ГБ хранилища",
      "Загрузка изображений и видео",
      "API доступ",
      "White Label",
      "Командный доступ (до 5 чел.)",
    ],
    disabled: [],
  },
];

const FAQ = [
  { q: "Могу ли я сменить тариф?", a: "Да, смена тарифа возможна в любой момент из вашего личного кабинета. При переходе на более высокий тариф — доплата рассчитывается пропорционально оставшемуся времени. При понижении — разница переносится как баланс на следующие расчётные периоды." },
  { q: "Есть ли пробный период для платных тарифов?", a: "Да, для тарифов Pro и Business предусмотрен бесплатный пробный период 14 дней. В течение этого времени вы получаете полный доступ ко всем функциям выбранного тарифа без необходимости привязки банковской карты. После окончания пробного периода, если вы не оплатите подписку, аккаунт будет автоматически переведён на тариф Free." },
  { q: "Что будет с сайтами, если я отменю подписку?", a: "При отмене платной подписки ваш аккаунт автоматически переключится на тариф Free. Если у вас было больше одного сайта, вам будет предложено выбрать один сайт, который останется активным. Остальные сайты будут заархивированы и доступны в режиме только для чтения в течение 90 дней. После этого срока заархивированные сайты могут быть удалены." },
  { q: "Безопасны ли мои данные?", a: "Безопасность — наш приоритет. Все данные хранятся на серверах с шифрованием AES-256 в состоянии покоя. Передача данных защищена протоколом TLS 1.3. Автоматические бэкапы базы данных создаются каждые 24 часа и хранятся в трёх географически распределённых дата-центрах. Доступ к серверам ограничен двухфакторной аутентификацией и мониторингом в реальном времени." },
  { q: "Можно ли привязать свой домен?", a: "Да, подключение кастомного домена доступно на тарифах Pro и Business. Вам потребуется настроить CNAME-запись в DNS вашего домена, указав её на наш сервер. SSL-сертификат для вашего домена будет выпущен и установлен автоматически через Let's Encrypt в течение нескольких минут. Подробная инструкция доступна в документации." },
  { q: "Какие ограничения у бесплатного тарифа?", a: "Тариф Free включает 1 сайт, до 5 блоков на страницу, 3 страницы, 512 МБ хранилища и базовую аналитику за 7 дней. Этого достаточно, чтобы создать простой лендинг или визитку. Для более серьёзных проектов рекомендуем тарифы Pro или Business с расширенными возможностями и приоритетной поддержкой." },
  { q: "Как работает поддержка?", a: "На тарифе Free — поддержка по email с ответом в течение 48 часов. На тарифе Pro — приоритетная поддержка по email с ответом в течение 12 часов. На тарифе Business — выделенная линия поддержки 24/7 с гарантированным ответом в течение 1 часа, включая телефонную поддержку и персональный чат." },
  { q: "Можно ли экспортировать свой сайт?", a: "Да, на тарифах Pro и Business доступен полный экспорт данных сайта, включая HTML-код, изображения и контент. Экспорт можно выполнить из настроек сайта в редакторе. На тарифе Free экспорт недоступен." },
  { q: "Как вы обрабатываете платежи?", a: "Оплата принимается через защищённый платёжный шлюз. Мы принимаем банковские карты Visa, MasterCard, МИР, а также электронные кошельки. Данные карт не хранятся на наших серверах — вся обработка осуществляется сертифицированным PCI DSS провайдером." },
  { q: "Может ли lilluucore удалить мой сайт?", a: "Мы можем удалить или заблокировать сайт в случае нарушения Пользовательского соглашения: размещение запрещённого контента, по требованию правоохранительных органов или по решению суда. Модерация может направить вам уведомление с требованием удалить нежелательный контент. Подробнее — в разделе «Соглашение»." },
];

type CheckoutStep = "form" | "processing" | "success" | "error";

interface CheckoutModal {
  plan: (typeof PLANS)[0];
  billing: "monthly" | "yearly";
}

function formatCardNumber(val: string) {
  return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(val: string) {
  const digits = val.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
  return digits;
}

export default function PricingPage() {
  const [, nav] = useLocation();
  const { user, updateUser } = useAuthStore();
  const [yearly, setYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const [checkout, setCheckout] = useState<CheckoutModal | null>(null);
  const [step, setStep] = useState<CheckoutStep>("form");
  const [error, setError] = useState("");
  const [isTrial, setIsTrial] = useState(false);

  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const modalRef = useRef<HTMLDivElement>(null);

  function openCheckout(plan: (typeof PLANS)[0]) {
    setStep("form");
    setError("");
    setIsTrial(false);
    setCardHolder("");
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");
    setCheckout({ plan, billing: yearly ? "yearly" : "monthly" });
  }

  function closeCheckout() {
    if (step === "processing") return;
    setCheckout(null);
    setStep("form");
    setError("");
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeCheckout();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function handleTrial(plan: (typeof PLANS)[0]) {
    setStep("form");
    setError("");
    setIsTrial(true);
    setCardHolder("");
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");
    setCheckout({ plan, billing: yearly ? "yearly" : "monthly" });
  }

  async function handlePay() {
    if (!checkout) return;
    setError("");
    setStep("processing");
    try {
      const result = await billingApi.subscribe({
        plan: checkout.plan.id,
        billing: checkout.billing,
        trial: isTrial,
        cardNumber,
        cardExpiry,
        cardCvv,
        cardHolder,
      });
      updateUser({ plan: result.plan });
      setStep("success");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Ошибка оплаты. Проверьте данные карты.";
      setError(msg);
      setStep("form");
    }
  }

  function getButtonProps(plan: (typeof PLANS)[0]) {
    const price = yearly ? plan.price.yearly : plan.price.monthly;

    if (!user) {
      return {
        label: plan.id === "free" ? "Начать бесплатно" : "Попробовать 14 дней",
        onClick: () => nav("/auth"),
        variant: plan.badge ? "primary" : "secondary",
        disabled: false,
      };
    }

    const currentPlan = user.plan || "free";

    if (currentPlan === plan.id) {
      return {
        label: "Текущий тариф",
        onClick: () => {},
        variant: "current",
        disabled: true,
      };
    }

    if (plan.id === "free") {
      return {
        label: "Перейти на Free",
        onClick: async () => {
          if (!confirm("Вы уверены? Вы потеряете доступ к платным функциям.")) return;
          try {
            const r = await billingApi.cancel();
            updateUser({ plan: r.plan });
          } catch {}
        },
        variant: "secondary",
        disabled: false,
      };
    }

    const planOrder: Record<string, number> = { free: 0, pro: 1, business: 2 };
    const isUpgrade = planOrder[plan.id] > planOrder[currentPlan];

    return {
      label: isUpgrade ? `Купить за $${price}/мес` : `Перейти на ${plan.name}`,
      onClick: () => openCheckout(plan),
      variant: plan.badge ? "primary" : "secondary",
      disabled: false,
    };
  }

  const totalPrice = checkout
    ? checkout.billing === "yearly"
      ? checkout.plan.price.yearly * 12
      : checkout.plan.price.monthly
    : 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-5xl font-black mb-4">
            Простые тарифы,<br />
            <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">без сюрпризов</span>
          </motion.h1>
          <p className="text-muted-foreground text-lg mb-8">Начните бесплатно, масштабируйтесь по мере роста</p>
          <div className="inline-flex items-center gap-3 bg-secondary/50 border border-border rounded-xl p-1.5">
            <button
              onClick={() => setYearly(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${!yearly ? "bg-primary text-white shadow-sm" : "text-muted-foreground"}`}
            >
              Ежемесячно
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${yearly ? "bg-primary text-white shadow-sm" : "text-muted-foreground"}`}
            >
              Ежегодно
              <span className="bg-green-500/20 text-green-400 text-xs px-1.5 py-0.5 rounded-full">-20%</span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {PLANS.map((plan, i) => {
            const btn = getButtonProps(plan);
            const price = yearly ? plan.price.yearly : plan.price.monthly;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className={`relative glass rounded-2xl p-7 border ${plan.color} ${plan.badge ? "shadow-xl shadow-primary/10" : ""}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="gradient-purple text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                      {plan.badge}
                    </span>
                  </div>
                )}
                <div className="mb-5">
                  <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm">{plan.desc}</p>
                </div>
                <div className="mb-6">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-black text-white">${price}</span>
                    <span className="text-muted-foreground text-sm">/мес</span>
                    {yearly && plan.price.monthly > 0 && (
                      <span className="text-xs text-white/40 ml-1">= ${plan.price.yearly * 12}/год</span>
                    )}
                  </div>
                  {yearly && plan.price.monthly > 0 && (
                    <p className="text-green-400 text-xs mt-1">Экономия ${(plan.price.monthly - plan.price.yearly) * 12}/год</p>
                  )}
                </div>
                {/* Buttons */}
                {plan.id === "free" || btn.variant === "current" ? (
                  <button
                    onClick={btn.onClick}
                    disabled={btn.disabled}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition mb-6 ${
                      btn.variant === "current"
                        ? "border border-primary/30 text-primary/60 cursor-default bg-primary/5"
                        : "border border-white/12 hover:bg-white/5 text-foreground"
                    }`}
                  >
                    {btn.label}
                  </button>
                ) : (
                  <div className="flex flex-col gap-2 mb-6">
                    <button
                      onClick={() => {
                        if (!user) { nav("/auth"); return; }
                        handleTrial(plan);
                      }}
                      className={`w-full py-3 rounded-xl font-semibold text-sm transition ${
                        plan.badge
                          ? "gradient-purple text-white hover:opacity-90 shadow-lg"
                          : "border border-white/12 hover:bg-white/5 text-foreground"
                      }`}
                    >
                      Попробовать 14 дней бесплатно
                    </button>
                    <button
                      onClick={() => {
                        if (!user) { nav("/auth"); return; }
                        openCheckout(plan);
                      }}
                      className="w-full py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground transition flex items-center justify-center gap-1 hover:bg-white/4"
                    >
                      Или купить сразу
                      <ArrowRight size={13} weight="bold" />
                    </button>
                  </div>
                )}
                <div className="space-y-2.5">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-start gap-2">
                      <span className="text-green-400 text-sm flex-shrink-0 mt-0.5">✓</span>
                      <span className="text-foreground text-sm">{f}</span>
                    </div>
                  ))}
                  {plan.disabled.map((f) => (
                    <div key={f} className="flex items-start gap-2 opacity-35">
                      <span className="text-sm flex-shrink-0 mt-0.5">✕</span>
                      <span className="text-muted-foreground text-sm line-through">{f}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-8">Часто задаваемые вопросы</h2>
          <div className="space-y-2">
            {FAQ.map((item, i) => (
              <div key={i} className="glass border border-white/6 rounded-xl overflow-hidden">
                <button
                  className="w-full text-left px-5 py-4 flex items-center justify-between font-medium text-foreground hover:bg-white/3 transition"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {item.q}
                  <span className={`text-muted-foreground transition-transform ${openFaq === i ? "rotate-180" : ""}`}>▼</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-muted-foreground text-sm border-t border-white/6 pt-3">{item.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Checkout Modal ─── */}
      <AnimatePresence>
        {checkout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) closeCheckout(); }}
          >
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="w-full max-w-md glass border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/8">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-0.5">
                    {isTrial ? "Пробный период · 14 дней" : "Оформление подписки"}
                  </p>
                  <h2 className="text-lg font-bold text-white">{checkout.plan.name}</h2>
                </div>
                <button
                  onClick={closeCheckout}
                  disabled={step === "processing"}
                  className="text-muted-foreground hover:text-foreground transition p-1 rounded-lg hover:bg-white/6"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-6 py-5">
                {/* Success state */}
                {step === "success" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-6"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 16, delay: 0.1 }}
                      className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-4"
                    >
                      <CheckCircle size={32} weight="fill" className="text-green-400" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {isTrial ? "Пробный период активирован!" : "Оплата прошла успешно!"}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-2">
                      Тариф <span className="text-white font-semibold">{checkout.plan.name}</span> активирован на вашем аккаунте.
                    </p>
                    {isTrial && (
                      <p className="text-xs text-amber-400/80 mb-4">
                        Через 14 дней подписка продолжится за ${checkout.billing === "yearly" ? checkout.plan.price.yearly : checkout.plan.price.monthly}/мес.
                      </p>
                    )}
                    <button
                      onClick={() => { closeCheckout(); nav("/dashboard"); }}
                      className="gradient-purple text-white px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 mx-auto hover:opacity-90 transition"
                    >
                      Перейти в личный кабинет
                      <ArrowRight size={16} weight="bold" />
                    </button>
                  </motion.div>
                )}

                {/* Processing state */}
                {step === "processing" && (
                  <div className="text-center py-8">
                    <Spinner size={40} className="text-primary animate-spin mx-auto mb-4" />
                    <p className="text-foreground font-medium mb-1">
                      {isTrial ? "Привязываем карту..." : "Обрабатываем платёж..."}
                    </p>
                    <p className="text-muted-foreground text-sm">Не закрывайте это окно</p>
                  </div>
                )}

                {/* Form state */}
                {(step === "form" || step === "error") && (
                  <>
                    {/* Plan summary */}
                    <div className={`border rounded-xl p-4 mb-4 ${isTrial ? "bg-green-500/5 border-green-500/20" : "bg-white/4 border-white/8"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-foreground font-semibold">{checkout.plan.name}</span>
                        <span className="text-white font-bold">
                          {isTrial
                            ? <span className="text-green-400">Бесплатно</span>
                            : <>
                                ${checkout.billing === "yearly" ? checkout.plan.price.yearly : checkout.plan.price.monthly}
                                <span className="text-muted-foreground font-normal text-sm">/мес</span>
                              </>
                          }
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        {isTrial ? (
                          <span className="text-green-400/80">
                            14 дней бесплатно, затем ${checkout.billing === "yearly" ? checkout.plan.price.yearly : checkout.plan.price.monthly}/мес
                          </span>
                        ) : (
                          <>
                            <span>{checkout.billing === "yearly" ? "Ежегодная оплата" : "Ежемесячная оплата"}</span>
                            {checkout.billing === "yearly" && (
                              <span className="text-green-400">Итого: ${totalPrice}/год</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Trial notice */}
                    {isTrial && (
                      <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl px-4 py-3 mb-4 flex gap-2.5">
                        <Lock size={14} weight="light" className="text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-300/80 leading-relaxed">
                          Карта привязывается для подтверждения. <strong className="text-amber-300">Списание произойдёт только после окончания 14-дневного пробного периода.</strong> Вы можете отменить в любой момент.
                        </p>
                      </div>
                    )}

                    {/* Card form */}
                    <div className="space-y-3 mb-5">
                      <div>
                        <label className="text-xs text-muted-foreground font-medium block mb-1.5">Имя держателя карты</label>
                        <input
                          type="text"
                          placeholder="IVAN PETROV"
                          value={cardHolder}
                          onChange={e => setCardHolder(e.target.value.toUpperCase())}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition"
                          autoComplete="cc-name"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground font-medium block mb-1.5 flex items-center gap-1.5">
                          <CreditCard size={13} weight="light" />
                          Номер карты
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="0000 0000 0000 0000"
                          value={cardNumber}
                          onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition font-mono tracking-widest"
                          autoComplete="cc-number"
                          maxLength={19}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground font-medium block mb-1.5">Срок действия</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="MM/YY"
                            value={cardExpiry}
                            onChange={e => setCardExpiry(formatExpiry(e.target.value))}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition font-mono"
                            autoComplete="cc-exp"
                            maxLength={5}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground font-medium block mb-1.5">CVV</label>
                          <input
                            type="password"
                            inputMode="numeric"
                            placeholder="•••"
                            value={cardCvv}
                            onChange={e => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition font-mono"
                            autoComplete="cc-csc"
                            maxLength={4}
                          />
                        </div>
                      </div>
                    </div>

                    {error && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm mb-4">
                        {error}
                      </div>
                    )}

                    <button
                      onClick={handlePay}
                      disabled={!cardHolder || cardNumber.replace(/\s/g, "").length < 13 || cardExpiry.length < 5 || cardCvv.length < 3}
                      className="w-full gradient-purple text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
                    >
                      <Lock size={15} weight="bold" />
                      {isTrial
                        ? "Привязать карту · Начать 14 дней бесплатно"
                        : <>Оплатить ${checkout.billing === "yearly" ? totalPrice : (yearly ? checkout.plan.price.yearly : checkout.plan.price.monthly)}{checkout.billing === "yearly" ? "/год" : "/мес"}</>
                      }
                    </button>

                    <p className="text-center text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1.5">
                      <Lock size={11} weight="light" />
                      Защищённое соединение TLS 1.3 · PCI DSS
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
