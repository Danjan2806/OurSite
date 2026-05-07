import { useState, useEffect, useRef, createContext, useContext } from "react";
import { useParams, useLocation } from "wouter";
import { sitesApi, Block, Site, Page } from "@/lib/api";
import ZeroBlockRenderer from "@/components/ZeroBlockRenderer";
import {
  ArrowLeft, Globe, Eye, Monitor, Tablet, Smartphone,
  Image, Video, Music, ShoppingBag, FileText, Phone,
  MapPin, Code2
} from "@/lib/icons";

// ─── Cart ────────────────────────────────────────────────────────────────────
type CartItem = { id: string; name: string; price: string; priceNum: number; image?: string; qty: number };

const CartContext = createContext<{
  items: CartItem[];
  add: (p: { id: string; name: string; price: string; image?: string }) => void;
  remove: (id: string) => void;
  change: (id: string, delta: number) => void;
  clear: () => void;
  openCart: () => void;
} | null>(null);

function parsePrice(raw: string): number {
  const n = parseFloat(raw.replace(/[^\d.,]/g, "").replace(",", "."));
  return isNaN(n) ? 0 : n;
}

function genOrderId() {
  return "#" + Math.random().toString(36).slice(2, 7).toUpperCase();
}

function CheckoutModal({ siteId, items, total, currency, onClose, onDone }: {
  siteId: string; items: CartItem[]; total: number; currency: string; onClose: () => void; onDone: () => void;
}) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });
  const [delivery, setDelivery] = useState<"pickup" | "courier" | "post">("courier");
  const [payment, setPayment] = useState<"cash" | "card" | "online">("card");
  const [sending, setSending] = useState(false);
  const [step, setStep] = useState<"form" | "payment" | "success">("form");
  const [orderId] = useState(() => genOrderId());

  // Payment card state
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "", holder: "" });
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});
  const [paymentSending, setPaymentSending] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const deliveryLabels = { pickup: "Самовывоз", courier: "Курьер", post: "Почта / СДЭК" };
  const paymentLabels = { cash: "Наличными", card: "Картой", online: "Онлайн" };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const orderText = items.map(i => `${i.name} ×${i.qty} = ${i.price}`).join("\n");
      await sitesApi.formSubmit(siteId, {
        blockId: "order",
        formTitle: "Заказ товаров",
        data: {
          "№ заказа": orderId,
          "Имя": form.name,
          "Телефон": form.phone,
          "Email": form.email || "—",
          "Доставка": deliveryLabels[delivery],
          "Оплата": paymentLabels[payment],
          "Адрес": form.address || "—",
          "Состав заказа": orderText,
          "Итого": `${total.toLocaleString("ru-RU")} ${currency}`,
        },
      });
      if (payment === "cash") {
        setStep("success");
        setTimeout(onDone, 3000);
      } else {
        setStep("payment");
      }
    } catch {
      setSending(false);
    }
  };

  // Format card number as XXXX XXXX XXXX XXXX
  const formatCardNumber = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };
  // Format expiry as MM/YY
  const formatExpiry = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  };

  const validateCard = () => {
    const errs: Record<string, string> = {};
    const digits = card.number.replace(/\s/g, "");
    if (digits.length !== 16) errs.number = "Введите 16 цифр номера карты";
    if (!/^\d{2}\/\d{2}$/.test(card.expiry)) errs.expiry = "Формат ММ/ГГ";
    else {
      const [mm, yy] = card.expiry.split("/").map(Number);
      const now = new Date();
      const expYear = 2000 + yy;
      const expMonth = mm;
      if (mm < 1 || mm > 12) errs.expiry = "Неверный месяц";
      else if (expYear < now.getFullYear() || (expYear === now.getFullYear() && expMonth < now.getMonth() + 1))
        errs.expiry = "Срок действия истёк";
    }
    if (card.cvv.replace(/\D/g, "").length < 3) errs.cvv = "3 цифры";
    if (!card.holder.trim()) errs.holder = "Введите имя как на карте";
    return errs;
  };

  const submitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateCard();
    if (Object.keys(errs).length > 0) { setCardErrors(errs); return; }
    setCardErrors({});
    setPaymentSending(true);
    // Simulate payment processing
    setTimeout(() => {
      setPaymentSending(false);
      setStep("success");
      setTimeout(onDone, 3500);
    }, 1800);
  };

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-purple-500/60 transition";
  const errInputCls = "w-full bg-red-500/5 border border-red-500/40 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-red-400/60 transition";

  const headerTitle = step === "form" ? "Оформление заказа" : step === "payment" ? "Оплата" : "Готово";

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-0 sm:px-4" onClick={e => { if (e.target === e.currentTarget && step !== "success") onClose(); }}>
      <div className="bg-[#111121] border border-white/10 rounded-t-3xl sm:rounded-2xl w-full max-w-md shadow-2xl relative flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/8 flex-shrink-0">
          <div>
            <h2 className="text-white font-bold text-lg">{headerTitle}</h2>
            <p className="text-purple-400 text-sm font-semibold mt-0.5">{orderId} · {total.toLocaleString("ru-RU")} {currency}</p>
          </div>
          {step !== "success" && (
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 text-white/50 hover:text-white transition flex items-center justify-center text-base">✕</button>
          )}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* ── SUCCESS ── */}
          {step === "success" && (
            <div className="text-center py-10">
              <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <p className="text-white font-bold text-xl mb-1">
                {payment === "cash" ? "Заказ принят!" : "Оплата прошла!"}
              </p>
              <p className="text-purple-400 font-mono text-sm mb-3">{orderId}</p>
              <p className="text-white/40 text-sm">
                {payment === "cash" ? "Мы свяжемся с вами для подтверждения" : "Спасибо за покупку! Заказ передан в обработку"}
              </p>
            </div>
          )}

          {/* ── CHECKOUT FORM ── */}
          {step === "form" && (
            <form id="checkout-form" onSubmit={submit} className="space-y-4">
              {/* Order summary */}
              <div className="bg-white/4 rounded-xl border border-white/8 p-4 space-y-2">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-white/60">{item.name} <span className="text-white/30">×{item.qty}</span></span>
                    <span className="text-white font-medium">{item.price}</span>
                  </div>
                ))}
                <div className="border-t border-white/8 pt-2 flex justify-between">
                  <span className="text-sm text-white/40">Итого</span>
                  <span className="text-purple-400 font-bold">{total.toLocaleString("ru-RU")} {currency}</span>
                </div>
              </div>

              {/* Delivery type */}
              <div>
                <label className="text-xs text-white/40 block mb-2">Способ доставки</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["pickup", "courier", "post"] as const).map(d => (
                    <button type="button" key={d} onClick={() => setDelivery(d)}
                      className={`py-2 rounded-xl text-xs font-medium border transition ${delivery === d ? "border-purple-500/60 bg-purple-500/15 text-purple-300" : "border-white/10 text-white/40 hover:text-white/70"}`}>
                      {deliveryLabels[d]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact fields */}
              <div>
                <label className="text-xs text-white/40 block mb-1">Имя и фамилия <span className="text-red-400">*</span></label>
                <input value={form.name} onChange={set("name")} required placeholder="Иван Иванов" className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-white/40 block mb-1">Телефон <span className="text-red-400">*</span></label>
                <input value={form.phone} onChange={set("phone")} required type="tel" placeholder="+7 (999) 000-00-00" className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-white/40 block mb-1">Email</label>
                <input value={form.email} onChange={set("email")} type="email" placeholder="ivan@example.com" className={inputCls} />
              </div>
              {delivery !== "pickup" && (
                <div>
                  <label className="text-xs text-white/40 block mb-1">
                    {delivery === "courier" ? "Адрес доставки" : "Индекс и адрес для почты"}
                  </label>
                  <textarea value={form.address} onChange={set("address")} rows={2} placeholder="Ваш адрес..." className={inputCls + " resize-none"} />
                </div>
              )}

              {/* Payment type */}
              <div>
                <label className="text-xs text-white/40 block mb-2">Способ оплаты</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["cash", "card", "online"] as const).map(p => (
                    <button type="button" key={p} onClick={() => setPayment(p)}
                      className={`py-2 rounded-xl text-xs font-medium border transition ${payment === p ? "border-purple-500/60 bg-purple-500/15 text-purple-300" : "border-white/10 text-white/40 hover:text-white/70"}`}>
                      {paymentLabels[p]}
                    </button>
                  ))}
                </div>
                {(payment === "card" || payment === "online") && (
                  <p className="text-xs text-white/25 mt-2 text-center">После подтверждения откроется форма оплаты</p>
                )}
              </div>
            </form>
          )}

          {/* ── PAYMENT STEP ── */}
          {step === "payment" && (
            <form id="payment-form" onSubmit={submitPayment} className="space-y-5">
              {/* Amount reminder */}
              <div className="bg-purple-500/8 border border-purple-500/20 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-white/40 text-xs">Сумма к оплате</p>
                  <p className="text-purple-300 font-bold text-xl">{total.toLocaleString("ru-RU")} {currency}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-500/15 flex items-center justify-center">
                  <span className="text-lg">💳</span>
                </div>
              </div>

              {/* Card visual */}
              <div className="relative h-[130px] rounded-2xl overflow-hidden bg-gradient-to-br from-purple-900/60 via-purple-800/40 to-indigo-900/60 border border-purple-500/20 p-5 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="flex gap-1">
                    <div className="w-7 h-5 rounded bg-yellow-400/80" />
                    <div className="w-7 h-5 rounded bg-yellow-500/50 -ml-2" />
                  </div>
                  <span className="text-white/30 text-xs font-mono uppercase">
                    {payment === "online" ? "Online Pay" : "Bank Card"}
                  </span>
                </div>
                <div>
                  <p className="text-white/80 font-mono text-base tracking-[0.18em] mb-1">
                    {card.number || "•••• •••• •••• ••••"}
                  </p>
                  <div className="flex gap-6">
                    <div>
                      <p className="text-white/25 text-[9px] uppercase tracking-wider">Держатель</p>
                      <p className="text-white/60 text-xs font-mono uppercase">{card.holder || "CARD HOLDER"}</p>
                    </div>
                    <div>
                      <p className="text-white/25 text-[9px] uppercase tracking-wider">Срок</p>
                      <p className="text-white/60 text-xs font-mono">{card.expiry || "MM/YY"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card number */}
              <div>
                <label className="text-xs text-white/40 block mb-1">Номер карты <span className="text-red-400">*</span></label>
                <input
                  value={card.number}
                  onChange={e => {
                    setCard(c => ({ ...c, number: formatCardNumber(e.target.value) }));
                    setCardErrors(er => ({ ...er, number: "" }));
                  }}
                  placeholder="0000 0000 0000 0000"
                  inputMode="numeric"
                  maxLength={19}
                  className={cardErrors.number ? errInputCls : inputCls}
                />
                {cardErrors.number && <p className="text-red-400 text-xs mt-1">{cardErrors.number}</p>}
              </div>

              {/* Expiry + CVV */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/40 block mb-1">Срок действия <span className="text-red-400">*</span></label>
                  <input
                    value={card.expiry}
                    onChange={e => {
                      setCard(c => ({ ...c, expiry: formatExpiry(e.target.value) }));
                      setCardErrors(er => ({ ...er, expiry: "" }));
                    }}
                    placeholder="ММ/ГГ"
                    inputMode="numeric"
                    maxLength={5}
                    className={cardErrors.expiry ? errInputCls : inputCls}
                  />
                  {cardErrors.expiry && <p className="text-red-400 text-xs mt-1">{cardErrors.expiry}</p>}
                </div>
                <div>
                  <label className="text-xs text-white/40 block mb-1">CVV / CVC <span className="text-red-400">*</span></label>
                  <input
                    value={card.cvv}
                    onChange={e => {
                      setCard(c => ({ ...c, cvv: e.target.value.replace(/\D/g, "").slice(0, 3) }));
                      setCardErrors(er => ({ ...er, cvv: "" }));
                    }}
                    placeholder="•••"
                    type="password"
                    inputMode="numeric"
                    maxLength={3}
                    className={cardErrors.cvv ? errInputCls : inputCls}
                  />
                  {cardErrors.cvv && <p className="text-red-400 text-xs mt-1">{cardErrors.cvv}</p>}
                </div>
              </div>

              {/* Cardholder */}
              <div>
                <label className="text-xs text-white/40 block mb-1">Имя держателя карты <span className="text-red-400">*</span></label>
                <input
                  value={card.holder}
                  onChange={e => {
                    setCard(c => ({ ...c, holder: e.target.value.toUpperCase() }));
                    setCardErrors(er => ({ ...er, holder: "" }));
                  }}
                  placeholder="IVAN IVANOV"
                  className={cardErrors.holder ? errInputCls : inputCls}
                />
                {cardErrors.holder && <p className="text-red-400 text-xs mt-1">{cardErrors.holder}</p>}
              </div>

              <p className="text-white/20 text-xs text-center">🔒 Защищённое соединение · Данные не сохраняются</p>
            </form>
          )}
        </div>

        {/* Footer */}
        {step === "form" && (
          <div className="px-6 pb-6 pt-4 border-t border-white/8 flex-shrink-0">
            <button form="checkout-form" type="submit" disabled={sending}
              className="w-full py-3.5 rounded-xl text-white font-bold text-sm bg-purple-600 hover:bg-purple-500 transition disabled:opacity-60 flex items-center justify-center gap-2">
              {sending && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {sending
                ? "Оформляем..."
                : payment === "cash"
                  ? `Подтвердить заказ · ${total.toLocaleString("ru-RU")} ${currency}`
                  : `Перейти к оплате · ${total.toLocaleString("ru-RU")} ${currency}`}
            </button>
          </div>
        )}
        {step === "payment" && (
          <div className="px-6 pb-6 pt-4 border-t border-white/8 flex-shrink-0 space-y-2">
            <button form="payment-form" type="submit" disabled={paymentSending}
              className="w-full py-3.5 rounded-xl text-white font-bold text-sm bg-purple-600 hover:bg-purple-500 transition disabled:opacity-60 flex items-center justify-center gap-2">
              {paymentSending && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {paymentSending ? "Обрабатываем..." : `Оплатить ${total.toLocaleString("ru-RU")} ${currency}`}
            </button>
            <button type="button" onClick={() => { setStep("form"); setSending(false); }}
              className="w-full py-2 text-xs text-white/25 hover:text-white/50 transition">
              ← Вернуться к заказу
            </button>
          </div>
        )}
        {step === "success" && (
          <div className="px-6 pb-6 pt-4 border-t border-white/8 flex-shrink-0">
            <button onClick={onDone}
              className="w-full py-3.5 rounded-xl text-white font-bold text-sm bg-white/8 hover:bg-white/14 transition">
              Вернуться на главную
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CartDrawer({ siteId, currency, onClose }: { siteId: string; currency: string; onClose: () => void }) {
  const cart = useContext(CartContext)!;
  const [checkout, setCheckout] = useState(false);
  const total = cart.items.reduce((s, i) => s + i.priceNum * i.qty, 0);
  const count = cart.items.reduce((s, i) => s + i.qty, 0);
  const pluralQty = (n: number) => n === 1 ? "товар" : n < 5 ? "товара" : "товаров";

  return (
    <>
      <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 z-[160] w-full max-w-sm bg-[#111121] border-l border-white/10 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 flex items-center justify-center">
              <ShoppingBag size={17} className="text-purple-400" />
            </div>
            <div>
              <p className="text-white font-bold leading-tight">Корзина</p>
              <p className="text-white/40 text-xs">{count} {pluralQty(count)}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 text-white/50 hover:text-white transition flex items-center justify-center text-base">✕</button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {cart.items.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                <ShoppingBag size={28} className="text-white/20" />
              </div>
              <p className="text-white/30 text-sm font-medium">Корзина пуста</p>
              <p className="text-white/20 text-xs">Добавьте товары из каталога</p>
            </div>
          ) : cart.items.map(item => (
            <div key={item.id} className="flex gap-3 items-start bg-white/4 rounded-xl p-3 border border-white/6">
              <div className="w-14 h-14 rounded-xl bg-white/5 flex-shrink-0 overflow-hidden flex items-center justify-center">
                {item.image
                  ? <img src={item.image} className="w-full h-full object-cover" />
                  : <ShoppingBag size={18} className="text-white/15" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium leading-tight truncate">{item.name}</p>
                <p className="text-purple-400 text-sm font-bold mt-0.5">{item.price}</p>
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => cart.change(item.id, -1)}
                    className="w-7 h-7 rounded-lg bg-white/8 text-white/60 hover:bg-white/15 transition text-base font-bold flex items-center justify-center">−</button>
                  <span className="text-white text-sm w-5 text-center font-semibold">{item.qty}</span>
                  <button onClick={() => cart.change(item.id, 1)}
                    className="w-7 h-7 rounded-lg bg-white/8 text-white/60 hover:bg-white/15 transition text-base font-bold flex items-center justify-center">+</button>
                </div>
              </div>
              <button onClick={() => cart.remove(item.id)} className="text-white/15 hover:text-red-400 transition text-lg flex-shrink-0 mt-0.5 w-6 h-6 flex items-center justify-center">✕</button>
            </div>
          ))}
        </div>

        {/* Footer */}
        {cart.items.length > 0 && (
          <div className="px-5 py-4 border-t border-white/8 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/40">Итого ({count} {pluralQty(count)})</span>
              <span className="font-bold text-lg text-white">{total.toLocaleString("ru-RU")} {currency}</span>
            </div>
            <button
              onClick={() => setCheckout(true)}
              className="w-full py-3.5 rounded-xl text-white font-bold text-sm bg-purple-600 hover:bg-purple-500 transition shadow-lg shadow-purple-600/25">
              Оформить заказ →
            </button>
            <button onClick={cart.clear} className="w-full py-2 text-xs text-white/25 hover:text-white/50 transition">
              Очистить корзину
            </button>
          </div>
        )}
      </div>

      {checkout && (
        <CheckoutModal
          siteId={siteId}
          items={cart.items}
          total={total}
          currency={currency}
          onClose={() => setCheckout(false)}
          onDone={() => { setCheckout(false); cart.clear(); onClose(); }}
        />
      )}
    </>
  );
}

function CartNavIcon() {
  const cart = useContext(CartContext);
  if (!cart) return null;
  const count = cart.items.reduce((s, i) => s + i.qty, 0);
  return (
    <button onClick={cart.openCart}
      className="relative flex items-center justify-center w-9 h-9 rounded-xl hover:bg-current/10 transition flex-shrink-0"
      title={`Корзина${count > 0 ? ` (${count})` : ""}`}>
      <ShoppingBag size={18} />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-pink-500 text-white text-[9px] font-bold flex items-center justify-center min-w-[18px] px-0.5">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}

// ─── Popup ───────────────────────────────────────────────────────────────────
const PopupContext = createContext<{
  openPopup: (id: string) => void;
  closePopup: () => void;
  activePopupId: string | null;
} | null>(null);

function usePopup() { return useContext(PopupContext); }

function parseContent(block: Block) { try { return JSON.parse(block.content); } catch { return {}; } }
function parseStyles(block: Block) { try { return JSON.parse(block.styles); } catch { return {}; } }

function ctaStyle(s: Record<string, any>, extra?: React.CSSProperties): React.CSSProperties {
  const color = s.ctaColor || "var(--site-primary)";
  const textColor = s.ctaTextColor || "#fff";
  const variant = s.ctaVariant || "filled";
  const radius = s.ctaBorderRadius !== undefined ? `${s.ctaBorderRadius}px` : "12px";
  const shadowMap: Record<string, string> = {
    none: "none", sm: "0 2px 8px rgba(0,0,0,.3)",
    lg: "0 6px 24px rgba(0,0,0,.4)", glow: `0 0 20px 4px ${color}80`,
  };
  const shadow = shadowMap[s.ctaShadow || "none"] || "none";
  let base: React.CSSProperties;
  if (variant === "outline") base = { backgroundColor: "transparent", color, borderRadius: radius, boxShadow: shadow, border: `2px solid ${color}` };
  else if (variant === "ghost") base = { backgroundColor: "transparent", color, borderRadius: radius, boxShadow: shadow, border: "none" };
  else base = { backgroundColor: color, color: textColor, borderRadius: radius, boxShadow: shadow, border: "none" };
  return { ...base, ...extra };
}

const TITLE_SIZE_MAP: Record<string, string> = {
  sm: "clamp(1.25rem, 2.5vw, 1.75rem)", md: "clamp(1.75rem, 3.5vw, 2.5rem)",
  lg: "clamp(2rem, 4vw, 3rem)",         xl: "clamp(2.5rem, 5vw, 3.5rem)",
  "2xl": "clamp(3rem, 6vw, 5rem)",      "3xl": "clamp(4rem, 8vw, 7rem)",
};

function AnimWrap({ animation, delay, duration, children }: { animation?: string; delay?: number; duration?: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(!animation);
  useEffect(() => {
    if (!animation || !ref.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [animation]);
  const animStyle: React.CSSProperties = {};
  if (delay) animStyle.animationDelay = `${delay}s`;
  if (duration) animStyle.animationDuration = `${duration}s`;
  if (!animation) return <>{children}</>;
  return <div ref={ref} data-anim={animation} style={animStyle} className={`block-anim${visible ? " block-anim-visible" : ""}`}>{children}</div>;
}

function FormBlock({ block }: { block: Block }) {
  const c = parseContent(block);
  const s = parseStyles(block);
  const bgStyle: React.CSSProperties = s.bgImage
    ? { backgroundImage: `url(${s.bgImage})`, backgroundSize: "cover", backgroundPosition: "center" }
    : s.bg
      ? s.bg.startsWith("linear") ? { background: s.bg } : { backgroundColor: s.bg }
      : { backgroundColor: "#0f0f23" };
  const [values, setValues] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const siteId = window.location.pathname.split("/").find((s, i, arr) => arr[i-1] === "preview");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteId) return;
    setSubmitting(true);
    try {
      await sitesApi.formSubmit(siteId, { blockId: block.id, formTitle: c.title || "Заявка", data: values });
      setSent(true);
    } catch { setSent(true); }
    finally { setSubmitting(false); }
  };

  if (sent) {
    return (
      <div style={{ ...bgStyle, color: s.textColor || "#e2e8f0" }} className="w-full py-16 px-8 flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h3 className="text-2xl font-bold mb-2">{c.successText || "Спасибо!"}</h3>
          <p className="opacity-60 text-sm">Мы получили вашу заявку и скоро свяжемся с вами.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...bgStyle, color: s.textColor || "#e2e8f0" }} className="w-full py-16 px-8">
      <div className="max-w-md mx-auto">
        <h2 className="text-3xl font-bold mb-2 text-center">{c.title}</h2>
        {c.subtitle && <p className="text-center opacity-60 text-sm mb-8">{c.subtitle}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {(c.fields || []).map((f: any, i: number) => (
            <div key={i}>
              <label className="text-sm opacity-60 mb-1 block">{f.label}{f.required && <span className="text-red-400 ml-0.5">*</span>}</label>
              {f.type === "textarea"
                ? <textarea
                    className="w-full bg-white/5 rounded-xl px-4 py-3 text-sm border border-white/8 focus:outline-none focus:border-purple-500/50 transition resize-none"
                    placeholder={f.placeholder}
                    rows={3}
                    required={f.required}
                    value={values[f.label] || ""}
                    onChange={e => setValues(v => ({ ...v, [f.label]: e.target.value }))}
                  />
                : <input
                    className="w-full bg-white/5 rounded-xl px-4 py-3 text-sm border border-white/8 focus:outline-none focus:border-purple-500/50 transition"
                    placeholder={f.placeholder || f.label}
                    type={f.type || "text"}
                    required={f.required}
                    value={values[f.label] || ""}
                    onChange={e => setValues(v => ({ ...v, [f.label]: e.target.value }))}
                  />
              }
            </div>
          ))}
          <button type="submit" disabled={submitting}
            className="w-full text-base text-center py-3 font-bold transition disabled:opacity-60 flex items-center justify-center gap-2"
            style={ctaStyle(s, { width: "100%" })}>
            {submitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {submitting ? "Отправка..." : (c.ctaLabel || "Отправить")}
          </button>
        </form>
      </div>
    </div>
  );
}

function ProductsBlock({ block }: { block: Block }) {
  const c = parseContent(block);
  const s = parseStyles(block);
  const cart = useContext(CartContext);
  const cur = s.currency || "₽";
  const cols = s.columns || 3;

  const bgStyle: React.CSSProperties = s.bgImage
    ? { backgroundImage: `url(${s.bgImage})`, backgroundSize: "cover", backgroundPosition: "center" }
    : s.bg ? (s.bg.startsWith("linear") ? { background: s.bg } : { backgroundColor: s.bg }) : { backgroundColor: "#0f0f23" };

  const [added, setAdded] = useState<Record<number, boolean>>({});

  const fmtPrice = (raw: string) => {
    const num = parseFloat(raw.replace(/[^\d.,]/g, "").replace(",", "."));
    if (isNaN(num)) return raw;
    return `${num.toLocaleString("ru-RU")} ${cur}`;
  };

  const handleAdd = (p: any, i: number) => {
    if (!cart) return;
    cart.add({ id: `${block.id}-${i}`, name: p.name, price: fmtPrice(p.price), image: p.image });
    cart.openCart();
    setAdded(prev => ({ ...prev, [i]: true }));
    setTimeout(() => setAdded(prev => ({ ...prev, [i]: false })), 1200);
  };

  const items = c.items || [];
  const gridCols = Math.min(items.length || 1, cols);

  return (
    <div id={s.anchorId} style={bgStyle} className="w-full py-16 px-8">
      {c.title && <h2 style={{ color: s.textColor || "#fff" }} className="text-3xl font-bold text-center mb-3">{c.title}</h2>}
      {c.subtitle && <p style={{ color: s.textColor || "#fff" }} className="text-base opacity-50 text-center mb-10">{c.subtitle}</p>}
      {items.length === 0 ? (
        <p className="text-white/20 text-center py-8">Добавьте товары в настройках блока</p>
      ) : (
        <div className="grid gap-6 max-w-5xl mx-auto" style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}>
          {items.map((p: any, i: number) => (
            <div key={i} className="bg-white/6 rounded-2xl overflow-hidden border border-white/5 flex flex-col">
              <div className="h-52 bg-white/4 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                {p.image
                  ? <img src={p.image} className="w-full h-full object-cover" />
                  : <ShoppingBag size={32} className="text-white/15" />}
                {p.badge && (
                  <span className="absolute top-3 left-3 text-xs bg-purple-600 text-white px-2.5 py-0.5 rounded-full font-semibold">
                    {p.badge}
                  </span>
                )}
              </div>
              <div className="p-5 flex flex-col flex-1">
                <p style={{ color: s.textColor || "#fff" }} className="text-base font-semibold flex-1 leading-snug">{p.name}</p>
                {p.description && <p className="text-xs opacity-40 mt-1.5 mb-2 leading-relaxed" style={{ color: s.textColor || "#fff" }}>{p.description}</p>}
                <p className="text-purple-400 font-bold text-xl mt-2">{fmtPrice(p.price)}</p>
                <button
                  onClick={() => handleAdd(p, i)}
                  className={`mt-3 w-full text-sm py-2.5 rounded-xl text-center font-semibold transition ${added[i] ? "bg-green-600 text-white" : "bg-purple-600 hover:bg-purple-500 text-white"}`}>
                  {added[i] ? "✓ Добавлено" : "В корзину"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Popup Renderer ───────────────────────────────────────────────────────────
function PopupRenderer({ popupBlocks, siteId }: { popupBlocks: Block[]; siteId: string }) {
  const popup = usePopup();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!popup?.activePopupId) { setSent(false); setFormData({}); }
  }, [popup?.activePopupId]);

  useEffect(() => {
    if (!popup?.activePopupId) return;
    const onKey = (e: KeyboardEvent) => {
      const block = popupBlocks.find(b => {
        const pc = parseContent(b);
        return (pc.popupId || b.id.slice(0, 8)) === popup.activePopupId;
      });
      if (!block) return;
      const ps = parseStyles(block);
      if (ps.closeOnEscape !== false && e.key === "Escape") popup.closePopup();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [popup?.activePopupId, popupBlocks]);

  if (!popup?.activePopupId) return null;

  const activeBlock = popupBlocks.find(b => {
    const pc = parseContent(b);
    return (pc.popupId || b.id.slice(0, 8)) === popup.activePopupId;
  });
  if (!activeBlock) return null;

  const c = parseContent(activeBlock);
  const s = parseStyles(activeBlock);
  const variant = s.variant || "centered";
  const maxW = s.maxWidth ? `${s.maxWidth}px` : "500px";
  const bdColor = s.backdropColor || "rgba(0,0,0,0.75)";
  const bdBlur = s.backdropBlur !== false;
  const showClose = s.showCloseButton !== false;
  const closeOnBd = s.closeOnBackdrop !== false;

  const animClass = (() => {
    switch (s.animation || "fade") {
      case "slide-up": return "animate-[slideUp_0.3s_ease-out]";
      case "scale": return "animate-[scaleIn_0.25s_ease-out]";
      case "slide-left": return "animate-[slideLeft_0.3s_ease-out]";
      case "slide-right": return "animate-[slideRight_0.3s_ease-out]";
      case "none": return "";
      default: return "animate-[fadeIn_0.25s_ease-out]";
    }
  })();

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending || sent) return;
    setSending(true);
    try {
      await sitesApi.formSubmit(siteId, {
        blockId: activeBlock.id,
        formTitle: c.formTitle || c.title || "Форма из попапа",
        data: formData,
      });
      setSent(true);
    } catch {}
    finally { setSending(false); }
  };

  const imageEl = c.image ? <img src={c.image} alt="" className="object-cover w-full h-full" /> : null;
  const isImageLeft = variant === "image-left" || c.imagePosition === "left";
  const isFullscreen = variant === "fullscreen";
  const isBottomSheet = variant === "bottom-sheet";

  const innerStyle: React.CSSProperties = {
    backgroundColor: s.bg || "#111121",
    color: s.textColor || "#e2e8f0",
    borderRadius: isBottomSheet ? "20px 20px 0 0" : "20px",
    maxWidth: isFullscreen || isBottomSheet ? "100%" : maxW,
    width: "100%",
    position: "relative",
    overflow: "hidden",
    maxHeight: isBottomSheet ? "85vh" : isFullscreen ? "95vh" : "90vh",
    display: "flex",
    flexDirection: isImageLeft ? "row" : "column",
  };

  const contentBox = (
    <div className={`flex flex-col p-7 ${isImageLeft ? "flex-1 overflow-y-auto" : "overflow-y-auto"}`}>
      {c.title && <h2 className="text-xl font-bold mb-3 leading-snug">{c.title}</h2>}
      {c.body && <div className="prose prose-sm prose-invert mb-4 text-sm opacity-80 rich-content" dangerouslySetInnerHTML={{ __html: c.body }} />}
      {c.showForm && (
        <form onSubmit={submitForm} className="space-y-3 mt-2">
          {sent ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-2">✅</div>
              <p className="font-bold">{c.successText || "Спасибо! Мы свяжемся с вами."}</p>
            </div>
          ) : (
            <>
              {(c.formFields || []).map((f: any, idx: number) => (
                <div key={idx}>
                  <label className="block text-xs font-medium opacity-70 mb-1">
                    {f.label}{f.required && <span className="text-red-400 ml-0.5">*</span>}
                  </label>
                  {f.type === "textarea" ? (
                    <textarea rows={3} required={f.required} placeholder={f.placeholder}
                      value={formData[f.label] || ""}
                      onChange={e => setFormData(d => ({ ...d, [f.label]: e.target.value }))}
                      className="w-full bg-white/8 border border-white/15 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 resize-none" />
                  ) : f.type === "select" ? (
                    <select required={f.required} value={formData[f.label] || ""}
                      onChange={e => setFormData(d => ({ ...d, [f.label]: e.target.value }))}
                      className="w-full bg-white/8 border border-white/15 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500">
                      <option value="">— выберите —</option>
                      {(f.options || "").split(",").map((o: string, i: number) => <option key={i} value={o.trim()}>{o.trim()}</option>)}
                    </select>
                  ) : f.type === "checkbox" ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" required={f.required}
                        checked={formData[f.label] === "true"}
                        onChange={e => setFormData(d => ({ ...d, [f.label]: e.target.checked ? "true" : "false" }))}
                        className="rounded" />
                      <span className="text-sm opacity-70">{f.placeholder || f.label}</span>
                    </label>
                  ) : (
                    <input type={f.type || "text"} required={f.required} placeholder={f.placeholder}
                      value={formData[f.label] || ""}
                      onChange={e => setFormData(d => ({ ...d, [f.label]: e.target.value }))}
                      className="w-full bg-white/8 border border-white/15 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
                  )}
                </div>
              ))}
              <button type="submit" disabled={sending}
                className="w-full py-3 rounded-xl font-bold text-sm bg-purple-600 hover:bg-purple-500 transition text-white disabled:opacity-50 mt-1">
                {sending ? "Отправка..." : (c.submitLabel || "Отправить")}
              </button>
            </>
          )}
        </form>
      )}
    </div>
  );

  const wrapperCls = `fixed inset-0 z-[300] flex ${isBottomSheet ? "items-end" : "items-center"} justify-center px-4`;

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(40px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.85) } to { opacity: 1; transform: scale(1) } }
        @keyframes slideLeft { from { opacity: 0; transform: translateX(-40px) } to { opacity: 1; transform: translateX(0) } }
        @keyframes slideRight { from { opacity: 0; transform: translateX(40px) } to { opacity: 1; transform: translateX(0) } }
      `}</style>
      <div className={wrapperCls}
        style={{ background: bdBlur ? bdColor : bdColor, backdropFilter: bdBlur ? "blur(6px)" : "none" }}
        onClick={e => { if (closeOnBd && e.target === e.currentTarget) popup.closePopup(); }}>
        <div className={animClass} style={innerStyle}>
          {showClose && (
            <button onClick={popup.closePopup}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition text-white/60 hover:text-white flex items-center justify-center text-lg leading-none"
              style={{ flexShrink: 0 }}>✕</button>
          )}
          {c.image && c.imagePosition === "background" && (
            <div className="absolute inset-0 z-0">{imageEl}<div className="absolute inset-0 bg-black/60" /></div>
          )}
          {c.image && (isImageLeft || c.imagePosition === "top") && (
            <div className={`${isImageLeft ? "w-64 flex-shrink-0" : "h-48 w-full"} overflow-hidden`}>{imageEl}</div>
          )}
          <div className={`relative z-10 flex-1 flex flex-col ${isImageLeft ? "" : ""}`}>
            {contentBox}
          </div>
        </div>
      </div>
    </>
  );
}

function ea(s: any, key: string): { animation?: string; delay?: number; duration?: number } {
  const e = (s.elemAnims || {})[key] || {};
  return e.animation ? { animation: e.animation, delay: e.delay, duration: e.duration } : {};
}

function LiveBlock({ block }: { block: Block }) {
  const popup = usePopup();
  const c = parseContent(block);
  const s = parseStyles(block);
  const baseStyle: React.CSSProperties = {};
  if (s.borderRadius) baseStyle.borderRadius = `${s.borderRadius}px`;
  if (s.opacity && s.opacity < 100) baseStyle.opacity = s.opacity / 100;
  if (s.minHeight) baseStyle.minHeight = s.minHeight;

  const bgStyle: React.CSSProperties = {
    ...(s.bgImage
      ? { backgroundImage: `url(${s.bgImage})`, backgroundSize: "cover", backgroundPosition: "center", position: "relative" as const }
      : s.bg
        ? s.bg.startsWith("linear") ? { background: s.bg } : { backgroundColor: s.bg }
        : { backgroundColor: "#0f0f23" }),
    ...baseStyle,
  };

  const anchorId = s.anchorId || undefined;

  switch (block.type) {
    case "HERO": {
      const hv = s.variant || "centered";
      const heroBg = c.heroImage ? { ...bgStyle, backgroundImage: `url(${c.heroImage})`, backgroundSize: "cover", backgroundPosition: "center" } : bgStyle;
      const titleStyle = { fontSize: TITLE_SIZE_MAP[s.titleSize || "xl"] || TITLE_SIZE_MAP.xl, fontWeight: s.fontWeight || "900", lineHeight: s.lineHeight || "1.15", letterSpacing: s.letterSpacing !== undefined ? `${s.letterSpacing}px` : undefined };
      const badgeEl = c.badge && <AnimWrap {...ea(s,"badge")}><div className="mb-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-current/20 bg-current/10 text-sm font-semibold">{c.badge}</div></AnimWrap>;
      const makeCta1 = (cls: string) => c.ctaAction === "popup"
        ? <button type="button" onClick={() => c.ctaPopupId && popup?.openPopup(c.ctaPopupId)} className={cls} style={ctaStyle(s)}>{c.cta || "Начать"}</button>
        : <a href={c.ctaUrl || "#"} className={cls} style={ctaStyle(s)}>{c.cta || "Начать"}</a>;
      const makeCta2 = (cls: string) => c.ctaSecondaryAction === "popup"
        ? <button type="button" onClick={() => c.ctaSecondaryPopupId && popup?.openPopup(c.ctaSecondaryPopupId)} className={cls}>{c.ctaSecondary}</button>
        : <a href={c.ctaSecondaryUrl || "#"} className={cls}>{c.ctaSecondary}</a>;
      const btns = (
        <AnimWrap {...ea(s,"cta")}>
          <div className={`flex gap-4 flex-wrap ${hv === "split" ? "" : "justify-center"}`}>
            {makeCta1("text-base px-8 py-3 font-bold transition")}
            {c.ctaSecondary && makeCta2("text-base px-8 py-3 rounded-xl border border-current/20 font-medium")}
          </div>
        </AnimWrap>
      );
      if (hv === "split") return (
        <div id={anchorId} style={{ ...bgStyle, color: s.textColor || "#fff", minHeight: s.minHeight || "80vh" }} className="w-full flex">
          <div className="flex-1 flex flex-col justify-center px-12 py-20">
            {badgeEl}
            <AnimWrap {...ea(s,"title")}><h1 style={titleStyle} className="mb-4">{c.title || "Заголовок"}</h1></AnimWrap>
            <AnimWrap {...ea(s,"subtitle")}><p className="text-lg opacity-60 mb-8 max-w-lg">{c.subtitle || "Подзаголовок"}</p></AnimWrap>
            {btns}
          </div>
          <AnimWrap {...ea(s,"image")}>
            <div className="w-2/5 flex-shrink-0 bg-gradient-to-br from-purple-700 to-indigo-800 flex items-center justify-center relative overflow-hidden">
              {c.heroImage ? <img src={c.heroImage} className="w-full h-full object-cover absolute inset-0" /> : <div className="w-32 h-32 rounded-full bg-white/10 backdrop-blur-sm" />}
            </div>
          </AnimWrap>
        </div>
      );
      if (hv === "minimal") return (
        <div id={anchorId} style={{ ...heroBg, color: s.textColor || "#111", minHeight: s.minHeight || "60vh" }} className="w-full py-24 px-8 flex flex-col items-center justify-center text-center">
          {badgeEl}
          <AnimWrap {...ea(s,"title")}><h1 style={{ ...titleStyle, fontWeight: "700" }} className="mb-4 max-w-2xl">{c.title || "Заголовок"}</h1></AnimWrap>
          <AnimWrap {...ea(s,"subtitle")}><p className="text-lg mb-8 max-w-xl" style={{ opacity: 0.5 }}>{c.subtitle || "Подзаголовок"}</p></AnimWrap>
          {btns}
        </div>
      );
      return (
        <div id={anchorId} style={{ ...heroBg, color: s.textColor || "#fff", minHeight: s.minHeight || "80vh" }} className="w-full py-20 px-8 flex flex-col items-center justify-center text-center relative">
          {c.heroImage && <div className="absolute inset-0 bg-black/40" />}
          <div className="relative z-10 flex flex-col items-center">
            {badgeEl}
            <AnimWrap {...ea(s,"title")}><h1 style={titleStyle} className="mb-4 max-w-3xl">{c.title || "Заголовок"}</h1></AnimWrap>
            <AnimWrap {...ea(s,"subtitle")}><p className="text-lg opacity-60 mb-8 max-w-xl">{c.subtitle || "Подзаголовок"}</p></AnimWrap>
            {btns}
          </div>
        </div>
      );
    }
    case "FEATURES": {
      const fv = s.variant || "cards";
      if (fv === "list") return (
        <div id={anchorId} style={{ ...bgStyle, color: s.textColor || "#e2e8f0" }} className="w-full py-16 px-8">
          <AnimWrap {...ea(s,"title")}><h2 className="text-3xl font-bold text-center mb-3">{c.title}</h2></AnimWrap>
          <AnimWrap {...ea(s,"subtitle")}><p className="text-base opacity-50 text-center mb-10 max-w-lg mx-auto">{c.subtitle}</p></AnimWrap>
          <AnimWrap {...ea(s,"items")}>
            <div className="max-w-3xl mx-auto divide-y divide-white/8">
              {(c.items || []).map((it: any, i: number) => (
                <div key={i} className="flex items-start gap-5 py-5">
                  <div className="w-10 h-10 flex-shrink-0 bg-purple-600/20 rounded-xl flex items-center justify-center text-purple-400 text-lg">
                    {it.iconUrl ? <img src={it.iconUrl} className="w-7 h-7 object-contain" /> : (it.icon || "◆")}
                  </div>
                  <div>
                    <h3 className="text-base font-bold mb-1">{it.title}</h3>
                    <p className="text-sm opacity-50">{it.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </AnimWrap>
        </div>
      );
      if (fv === "alternating") return (
        <div id={anchorId} style={{ ...bgStyle, color: s.textColor || "#e2e8f0" }} className="w-full py-16 px-8">
          <AnimWrap {...ea(s,"title")}><h2 className="text-3xl font-bold text-center mb-3">{c.title}</h2></AnimWrap>
          <AnimWrap {...ea(s,"subtitle")}><p className="text-base opacity-50 text-center mb-12 max-w-lg mx-auto">{c.subtitle}</p></AnimWrap>
          <AnimWrap {...ea(s,"items")}>
            <div className="max-w-5xl mx-auto space-y-16">
              {(c.items || []).map((it: any, i: number) => (
                <div key={i} className={`flex items-center gap-12 ${i % 2 === 1 ? "flex-row-reverse" : ""}`}>
                  <div className="w-48 h-48 flex-shrink-0 bg-purple-600/15 rounded-3xl flex items-center justify-center text-5xl border border-purple-500/20">
                    {it.iconUrl ? <img src={it.iconUrl} className="w-24 h-24 object-contain" /> : (it.icon || "◆")}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-3">{it.title}</h3>
                    <p className="text-base opacity-50">{it.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </AnimWrap>
        </div>
      );
      return (
        <div id={anchorId} style={{ ...bgStyle, color: s.textColor || "#e2e8f0" }} className="w-full py-16 px-8">
          <AnimWrap {...ea(s,"title")}><h2 className="text-3xl font-bold text-center mb-3">{c.title}</h2></AnimWrap>
          <AnimWrap {...ea(s,"subtitle")}><p className="text-base opacity-50 text-center mb-10 max-w-lg mx-auto">{c.subtitle}</p></AnimWrap>
          <AnimWrap {...ea(s,"items")}>
            <div className="grid gap-6 max-w-5xl mx-auto" style={{ gridTemplateColumns: `repeat(${Math.min((c.items || []).length || 1, s.columns || 3)}, 1fr)` }}>
              {(c.items || []).map((it: any, i: number) => (
                <div key={i} className="bg-white/5 rounded-2xl p-6 text-center">
                  {it.iconUrl ? <img src={it.iconUrl} className="w-12 h-12 mx-auto mb-4 object-contain" /> : <div className="w-12 h-12 bg-purple-600/30 rounded-xl mx-auto mb-4 flex items-center justify-center text-purple-400 text-xl">{it.icon || "◆"}</div>}
                  <h3 className="text-base font-bold mb-2">{it.title}</h3>
                  <p className="text-sm opacity-50">{it.desc}</p>
                </div>
              ))}
            </div>
          </AnimWrap>
        </div>
      );
    }
    case "PRICING": {
      const pv = s.variant || "cards";
      if (pv === "table") {
        const plans = c.plans || [];
        const allFeatures = Array.from(new Set(plans.flatMap((p: any) => p.features || []))) as string[];
        return (
          <div id={anchorId} style={{ ...bgStyle, color: s.textColor || "#fff" }} className="w-full py-16 px-8 overflow-x-auto">
            <AnimWrap {...ea(s,"title")}><h2 className="text-3xl font-bold text-center mb-2">{c.title}</h2></AnimWrap>
            <AnimWrap {...ea(s,"subtitle")}><p className="text-base opacity-50 text-center mb-10">{c.subtitle}</p></AnimWrap>
            <table className="max-w-4xl mx-auto w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-4 text-left text-sm opacity-40">Функции</th>
                  {plans.map((p: any, i: number) => (
                    <th key={i} className={`p-4 text-center rounded-t-xl ${p.highlighted ? "bg-purple-600" : "bg-white/5"}`}>
                      <p className="text-sm font-semibold opacity-70">{p.name}</p>
                      <p className="text-3xl font-black">{p.price}</p>
                      <p className="text-xs opacity-40">/{p.period}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allFeatures.map((f, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td className="p-4 text-sm opacity-60">{f}</td>
                    {plans.map((p: any, j: number) => (
                      <td key={j} className={`p-4 text-center ${p.highlighted ? "bg-purple-600/20" : ""}`}>
                        {(p.features || []).includes(f) ? <span className="text-green-400">✓</span> : <span className="opacity-20">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t border-white/5">
                  <td className="p-4" />
                  {plans.map((p: any, i: number) => (
                    <td key={i} className={`p-4 text-center rounded-b-xl ${p.highlighted ? "bg-purple-600/20" : "bg-white/3"}`}>
                      <a href={p.ctaUrl || "#"} className={`inline-block text-sm px-5 py-2 rounded-xl font-bold ${p.highlighted ? "bg-purple-600 text-white" : "bg-white/10"}`}>{p.cta}</a>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        );
      }
      return (
        <div id={anchorId} style={{ ...bgStyle, color: s.textColor || "#fff" }} className="w-full py-16 px-8">
          <AnimWrap {...ea(s,"title")}><h2 className="text-3xl font-bold text-center mb-2">{c.title}</h2></AnimWrap>
          <AnimWrap {...ea(s,"subtitle")}><p className="text-base opacity-50 text-center mb-10">{c.subtitle}</p></AnimWrap>
          <AnimWrap {...ea(s,"items")}>
          <div className="grid gap-6 max-w-4xl mx-auto" style={{ gridTemplateColumns: `repeat(${(c.plans || []).length}, 1fr)` }}>
            {(c.plans || []).map((p: any, i: number) => (
              <div key={i} className={`rounded-2xl p-6 ${p.highlighted ? "bg-purple-600 ring-2 ring-purple-400 shadow-lg shadow-purple-500/20" : "bg-white/6"}`}>
                <p className="text-sm font-semibold opacity-60 mb-2">{p.name}</p>
                <p className="text-4xl font-black">{p.price}</p>
                <p className="text-sm opacity-40">/{p.period}</p>
                <div className="mt-4 space-y-2">
                  {(p.features || []).map((f: string, j: number) => <p key={j} className="text-sm opacity-70">✓ {f}</p>)}
                </div>
                <a href={p.ctaUrl || "#"} className={`block mt-5 text-sm text-center py-2.5 rounded-xl font-bold ${p.highlighted ? "bg-white text-purple-700" : "bg-white/10 hover:bg-white/15"} transition`}>{p.cta}</a>
              </div>
            ))}
          </div>
          </AnimWrap>
        </div>
      );
    }
    case "TESTIMONIALS": {
      const tv = s.variant || "grid";
      const tCard = (it: any, i: number) => (
        <div key={i} className="bg-white/5 rounded-2xl p-6 border border-white/5">
          <div className="text-yellow-400 text-sm mb-3">★★★★★</div>
          <p className="text-sm italic mb-4 opacity-80">"{it.text}"</p>
          <div className="flex items-center gap-3 mt-3">
            {it.avatar ? <img src={it.avatar} className="w-10 h-10 rounded-full object-cover flex-shrink-0" /> : <div className="w-10 h-10 rounded-full bg-purple-600/30 flex items-center justify-center text-sm font-bold text-purple-300 flex-shrink-0">{(it.author || "?")[0]}</div>}
            <div><p className="text-sm font-semibold">{it.author}</p><p className="text-xs opacity-40">{it.role}</p></div>
          </div>
        </div>
      );
      if (tv === "quote") {
        const it = (c.items || [])[0] || {};
        return (
          <div id={anchorId} style={{ ...bgStyle, color: s.textColor || "#cbd5e1" }} className="w-full py-24 px-8 flex flex-col items-center text-center">
            <div className="text-yellow-400 text-2xl mb-6">★★★★★</div>
            <AnimWrap {...ea(s,"items")}><p className="text-2xl italic mb-8 max-w-2xl opacity-80">"{it.text}"</p></AnimWrap>
            <div className="flex items-center gap-3">
              {it.avatar ? <img src={it.avatar} className="w-12 h-12 rounded-full object-cover" /> : <div className="w-12 h-12 rounded-full bg-purple-600/30 flex items-center justify-center text-sm font-bold text-purple-300">{(it.author || "?")[0]}</div>}
              <div className="text-left"><p className="font-semibold">{it.author}</p><p className="text-sm opacity-40">{it.role}</p></div>
            </div>
          </div>
        );
      }
      if (tv === "list") return (
        <div id={anchorId} style={{ ...bgStyle, color: s.textColor || "#cbd5e1" }} className="w-full py-16 px-8">
          <AnimWrap {...ea(s,"title")}><h2 className="text-3xl font-bold text-center mb-3">{c.title}</h2></AnimWrap>
          {c.subtitle && <AnimWrap {...ea(s,"subtitle")}><p className="text-base opacity-50 text-center mb-10">{c.subtitle}</p></AnimWrap>}
          <AnimWrap {...ea(s,"items")}><div className="max-w-3xl mx-auto space-y-4">{(c.items || []).map(tCard)}</div></AnimWrap>
        </div>
      );
      return (
        <div id={anchorId} style={{ ...bgStyle, color: s.textColor || "#cbd5e1" }} className="w-full py-16 px-8">
          <AnimWrap {...ea(s,"title")}><h2 className="text-3xl font-bold text-center mb-2">{c.title}</h2></AnimWrap>
          {c.subtitle && <AnimWrap {...ea(s,"subtitle")}><p className="text-base opacity-50 text-center mb-8">{c.subtitle}</p></AnimWrap>}
          <AnimWrap {...ea(s,"items")}><div className="grid grid-cols-3 gap-6 max-w-5xl mx-auto mt-6">{(c.items || []).map(tCard)}</div></AnimWrap>
        </div>
      );
    }
    case "STATS": {
      const stv = s.variant || "row";
      if (stv === "cards") return (
        <div id={anchorId} style={{ ...bgStyle, color: s.textColor || "#fff" }} className="w-full py-16 px-8">
          <AnimWrap {...ea(s,"title")}><h2 className="text-3xl font-bold text-center mb-10">{c.title}</h2></AnimWrap>
          <AnimWrap {...ea(s,"items")}>
            <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto">
              {(c.items || []).map((it: any, i: number) => (
                <div key={i} className="bg-white/5 rounded-2xl p-8 text-center border border-white/5">
                  <p className="text-5xl font-black text-purple-400 mb-2">{it.value}</p>
                  <p className="text-sm opacity-50">{it.label}</p>
                </div>
              ))}
            </div>
          </AnimWrap>
        </div>
      );
      return (
        <div id={anchorId} style={{ ...bgStyle, color: s.textColor || "#fff" }} className="w-full py-16 px-8">
          <AnimWrap {...ea(s,"title")}><h2 className="text-3xl font-bold text-center mb-10">{c.title}</h2></AnimWrap>
          <AnimWrap {...ea(s,"items")}>
            <div className="grid grid-cols-4 gap-6 max-w-4xl mx-auto">
              {(c.items || []).map((it: any, i: number) => (
                <div key={i} className="text-center">
                  <p className="text-4xl font-black text-purple-400 mb-2">{it.value}</p>
                  <p className="text-sm opacity-50">{it.label}</p>
                </div>
              ))}
            </div>
          </AnimWrap>
        </div>
      );
    }
    case "TEAM": {
      const tmv = s.variant || "cards";
      if (tmv === "list") return (
        <div id={anchorId} style={{ ...bgStyle, color: s.textColor || "#fff" }} className="w-full py-16 px-8">
          <AnimWrap {...ea(s,"title")}><h2 className="text-3xl font-bold text-center mb-10">{c.title}</h2></AnimWrap>
          <AnimWrap {...ea(s,"items")}>
            <div className="max-w-3xl mx-auto divide-y divide-white/8">
              {(c.members || []).map((m: any, i: number) => (
                <div key={i} className="flex items-center gap-5 py-4">
                  {m.avatar ? <img src={m.avatar} className="w-14 h-14 rounded-full object-cover flex-shrink-0" /> : <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xl font-bold">{(m.name || "?")[0]}</div>}
                  <div className="flex-1"><p className="font-bold">{m.name}</p><p className="text-sm opacity-40">{m.role}</p>{m.bio && <p className="text-sm opacity-30 mt-1">{m.bio}</p>}</div>
                </div>
              ))}
            </div>
          </AnimWrap>
        </div>
      );
      return (
        <div id={anchorId} style={{ ...bgStyle, color: s.textColor || "#fff" }} className="w-full py-16 px-8">
          <AnimWrap {...ea(s,"title")}><h2 className="text-3xl font-bold text-center mb-10">{c.title}</h2></AnimWrap>
          <AnimWrap {...ea(s,"items")}>
            <div className="flex gap-6 justify-center max-w-4xl mx-auto flex-wrap">
              {(c.members || []).map((m: any, i: number) => (
                <div key={i} className="bg-white/6 rounded-2xl p-6 text-center flex-1 max-w-[200px]">
                  {m.avatar ? <img src={m.avatar} className="w-16 h-16 rounded-full object-cover mx-auto mb-3" /> : <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-xl font-bold">{(m.name || "?")[0]}</div>}
                  <p className="text-sm font-bold">{m.name}</p>
                  <p className="text-xs opacity-40 mt-1">{m.role}</p>
                  {m.bio && <p className="text-xs opacity-30 mt-2">{m.bio}</p>}
                </div>
              ))}
            </div>
          </AnimWrap>
        </div>
      );
    }
    case "FAQ": {
      const faqv = s.variant || "accordion";
      if (faqv === "grid") return (
        <div id={anchorId} style={{ ...bgStyle, color: s.textColor || "#e2e8f0" }} className="w-full py-16 px-8">
          <AnimWrap {...ea(s,"title")}><h2 className="text-3xl font-bold text-center mb-10">{c.title}</h2></AnimWrap>
          <AnimWrap {...ea(s,"items")}>
            <div className="grid grid-cols-2 gap-5 max-w-4xl mx-auto">
              {(c.items || []).map((it: any, i: number) => (
                <div key={i} className="bg-white/4 rounded-2xl p-6 border border-white/5">
                  <p className="font-bold mb-2">{it.q}</p>
                  <p className="text-sm opacity-50">{it.a}</p>
                </div>
              ))}
            </div>
          </AnimWrap>
        </div>
      );
      return (
        <div id={anchorId} style={{ ...bgStyle, color: s.textColor || "#e2e8f0" }} className="w-full py-16 px-8">
          <AnimWrap {...ea(s,"title")}><h2 className="text-3xl font-bold text-center mb-10">{c.title}</h2></AnimWrap>
          <AnimWrap {...ea(s,"items")}>
            <div className="space-y-3 max-w-2xl mx-auto">
              {(c.items || []).map((it: any, i: number) => (
                <details key={i} className="border border-white/8 rounded-2xl overflow-hidden group">
                  <summary className="p-5 cursor-pointer text-base font-semibold flex justify-between items-center hover:bg-white/3 transition">
                    {it.q}<span className="text-purple-400 text-lg group-open:rotate-45 transition-transform">+</span>
                  </summary>
                  <div className="px-5 pb-5 text-sm opacity-60 leading-relaxed">{it.a}</div>
                </details>
              ))}
            </div>
          </AnimWrap>
        </div>
      );
    }
    case "CTA": {
      const cv = s.variant || "centered";
      const ctaBtn = (cls: string) => c.ctaAction === "popup"
        ? <button type="button" onClick={() => c.ctaPopupId && popup?.openPopup(c.ctaPopupId)} className={cls} style={ctaStyle(s)}>{c.cta}</button>
        : <a href={c.ctaUrl || "#"} className={cls} style={ctaStyle(s)}>{c.cta}</a>;
      const ctaBtn2 = (cls: string) => c.ctaSecondaryAction === "popup"
        ? <button type="button" onClick={() => c.ctaSecondaryPopupId && popup?.openPopup(c.ctaSecondaryPopupId)} className={cls}>{c.ctaSecondary}</button>
        : <a href={c.ctaSecondaryUrl || "#"} className={cls}>{c.ctaSecondary}</a>;
      if (cv === "banner") return (
        <div id={anchorId} style={{ ...bgStyle, color: s.textColor || "#fff" }} className="w-full py-8 px-8">
          <div className="flex items-center justify-between max-w-5xl mx-auto gap-8 flex-wrap">
            <div>
              <AnimWrap {...ea(s,"title")}><h2 className="text-2xl font-black">{c.title}</h2></AnimWrap>
              <AnimWrap {...ea(s,"subtitle")}><p className="text-sm opacity-60 mt-1">{c.subtitle}</p></AnimWrap>
            </div>
            <AnimWrap {...ea(s,"cta")}>
              <div className="flex gap-4 flex-shrink-0">
                {ctaBtn("text-base px-8 py-3 font-bold transition")}
                {c.ctaSecondary && ctaBtn2("text-base px-8 py-3 border border-white/40 rounded-xl")}
              </div>
            </AnimWrap>
          </div>
        </div>
      );
      if (cv === "split") return (
        <div id={anchorId} style={{ ...bgStyle, color: s.textColor || "#fff" }} className="w-full py-20 px-8 flex items-center max-w-5xl mx-auto gap-12">
          <div className="flex-1">
            <AnimWrap {...ea(s,"title")}><h2 className="text-4xl font-black mb-3">{c.title}</h2></AnimWrap>
            <AnimWrap {...ea(s,"subtitle")}><p className="text-base opacity-60">{c.subtitle}</p></AnimWrap>
          </div>
          <AnimWrap {...ea(s,"cta")}>
            <div className="flex flex-col gap-3 flex-shrink-0">
              {ctaBtn("text-base px-8 py-3 font-bold text-center transition")}
              {c.ctaSecondary && ctaBtn2("text-base px-8 py-3 border border-white/40 rounded-xl text-center")}
            </div>
          </AnimWrap>
        </div>
      );
      return (
        <div id={anchorId} style={{ ...bgStyle, color: s.textColor || "#fff" }} className="w-full py-20 px-8 flex flex-col items-center text-center">
          <AnimWrap {...ea(s,"title")}><h2 className="text-4xl font-black mb-3 max-w-2xl">{c.title}</h2></AnimWrap>
          <AnimWrap {...ea(s,"subtitle")}><p className="text-base opacity-60 mb-8">{c.subtitle}</p></AnimWrap>
          <AnimWrap {...ea(s,"cta")}>
            <div className="flex gap-4">
              {ctaBtn("text-base px-8 py-3 font-bold transition")}
              {c.ctaSecondary && ctaBtn2("text-base px-8 py-3 border border-white/40 rounded-xl")}
            </div>
          </AnimWrap>
        </div>
      );
    }
    case "TEXT":
      return (
        <div style={{ ...bgStyle, color: s.textColor || "#e2e8f0", textAlign: (s.align as any) || "left" }} className="w-full py-16 px-8">
          <div className="max-w-3xl mx-auto">
            {c.title && <AnimWrap {...ea(s,"title")}><h2 className="text-2xl font-bold mb-4">{c.title}</h2></AnimWrap>}
            <AnimWrap {...ea(s,"body")}>
              {c.bodyHtml ? (
                <div className="text-base leading-relaxed rich-content" dangerouslySetInnerHTML={{ __html: c.bodyHtml }} />
              ) : (
                <div className="text-base opacity-60 leading-relaxed whitespace-pre-wrap">{c.body}</div>
              )}
            </AnimWrap>
            {c.link && <a href={c.link} className="text-base text-purple-400 mt-4 inline-flex items-center gap-1 font-semibold">{c.linkLabel || "Подробнее"} →</a>}
          </div>
        </div>
      );
    case "GALLERY": {
      const allImgs: { url: string; caption?: string }[] = [
        ...(c.galleryItems || []).filter((g: any) => g.url),
        ...(c.images || []).map((url: string) => ({ url })),
      ];
      const galCols = c.columns || 3;
      const galv = s.variant || "grid";
      if (galv === "masonry") return (
        <div id={anchorId} style={bgStyle} className="w-full py-16 px-8">
          <AnimWrap {...ea(s,"title")}><h2 style={{ color: s.textColor || "#fff" }} className="text-3xl font-bold text-center mb-10">{c.title}</h2></AnimWrap>
          <AnimWrap {...ea(s,"items")}><div className="max-w-5xl mx-auto" style={{ columnCount: galCols, columnGap: "1rem" }}>
            {allImgs.length > 0 ? allImgs.map((img, i) => (
              <div key={i} className="mb-4 break-inside-avoid">
                <img src={img.url} className="w-full rounded-xl object-cover" />
                {img.caption && <p style={{ color: s.textColor || "#fff" }} className="text-sm opacity-50 text-center mt-1">{img.caption}</p>}
              </div>
            )) : Array.from({ length: galCols * 2 }).map((_, i) => (
              <div key={i} className="mb-4 break-inside-avoid" style={{ height: i % 2 === 0 ? "180px" : "240px" }}>
                <div className="h-full bg-white/5 rounded-xl border border-dashed border-white/10 flex items-center justify-center">
                  <Image size={28} className="text-white/15" />
                </div>
              </div>
            ))}
          </div></AnimWrap>
        </div>
      );
      return (
        <div id={anchorId} style={bgStyle} className="w-full py-16 px-8">
          <AnimWrap {...ea(s,"title")}><h2 style={{ color: s.textColor || "#fff" }} className="text-3xl font-bold text-center mb-10">{c.title}</h2></AnimWrap>
          <AnimWrap {...ea(s,"items")}>
            {allImgs.length > 0 ? (
              <div className="grid gap-4 max-w-5xl mx-auto" style={{ gridTemplateColumns: `repeat(${galCols}, 1fr)` }}>
                {allImgs.map((img, i: number) => (
                  <div key={i}>
                    <img src={img.url} className="w-full h-48 object-cover rounded-xl" />
                    {img.caption && <p style={{ color: s.textColor || "#fff" }} className="text-sm opacity-50 text-center mt-2">{img.caption}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 max-w-5xl mx-auto" style={{ gridTemplateColumns: `repeat(${galCols}, 1fr)` }}>
                {Array.from({ length: galCols }).map((_, i) => (
                  <div key={i} className="h-48 bg-white/5 rounded-xl border border-dashed border-white/10 flex items-center justify-center">
                    <Image size={32} className="text-white/15" />
                  </div>
                ))}
              </div>
            )}
          </AnimWrap>
        </div>
      );
    }
    case "VIDEO":
      return (
        <div id={anchorId} style={bgStyle} className="w-full py-16 px-8">
          <h2 style={{ color: s.textColor || "#fff" }} className="text-3xl font-bold text-center mb-6">{c.title}</h2>
          <div className="max-w-3xl mx-auto bg-black/50 rounded-2xl overflow-hidden" style={{ aspectRatio: "16/9", position: "relative" }}>
            {c.url
              ? <iframe src={c.url} className="absolute inset-0 w-full h-full" allowFullScreen />
              : <div className="w-full h-full flex items-center justify-center text-white/20"><Video size={48} /></div>
            }
          </div>
          {c.description && <p style={{ color: s.textColor || "#fff" }} className="text-base opacity-60 text-center mt-4 max-w-xl mx-auto">{c.description}</p>}
        </div>
      );
    case "PRODUCTS":
      return <ProductsBlock block={block} />;
    case "CONTACTS":
      return (
        <div style={{ ...bgStyle, color: s.textColor || "#e2e8f0" }} className="w-full py-16 px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-3">{c.title}</h2>
            <p className="text-base opacity-50 mb-8">{c.subtitle}</p>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                {c.email && <a href={`mailto:${c.email}`} className="flex items-center gap-3 text-base hover:opacity-80 transition"><span className="text-purple-400">✉</span>{c.email}</a>}
                {c.phone && <a href={`tel:${c.phone}`} className="flex items-center gap-3 text-base hover:opacity-80 transition"><span className="text-purple-400">☎</span>{c.phone}</a>}
                {c.address && <div className="flex items-center gap-3 text-base"><span className="text-purple-400">📍</span>{c.address}</div>}
              </div>
              <div className="space-y-4">
                {c.telegram && <a href={c.telegram.startsWith("http") ? c.telegram : `https://t.me/${c.telegram.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-base hover:opacity-80 transition"><span className="text-purple-400">✈</span>Telegram</a>}
                {c.whatsapp && <a href={`https://wa.me/${c.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-base hover:opacity-80 transition"><span className="text-purple-400">💬</span>WhatsApp</a>}
                {c.instagram && <a href={c.instagram.startsWith("http") ? c.instagram : `https://instagram.com/${c.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-base hover:opacity-80 transition"><span className="text-purple-400">📷</span>Instagram</a>}
                {c.vk && <a href={c.vk.startsWith("http") ? c.vk : `https://vk.com/${c.vk}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-base hover:opacity-80 transition"><span className="text-purple-400">🌐</span>VK</a>}
                {c.youtube && <a href={c.youtube.startsWith("http") ? c.youtube : `https://youtube.com/@${c.youtube}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-base hover:opacity-80 transition"><span className="text-purple-400">▶</span>YouTube</a>}
              </div>
            </div>
          </div>
        </div>
      );
    case "FORM":
      return <FormBlock block={block} />;
    case "HEADER_MENU": {
      const hv = s.variant || "split";
      const navLinks = (c.links || []).map((l: any, i: number) => (
        <a key={i} href={l.url || "#"} className={`text-sm ${l.active ? "text-purple-400 font-semibold" : "opacity-60 hover:opacity-100"} transition`}>{l.label}</a>
      ));
      const ctaBtn = !c.hideCta && <a href={c.ctaUrl || "#"} className="text-sm px-5 py-2 font-semibold transition flex-shrink-0" style={ctaStyle(s)}>{c.cta}</a>;
      const cartIcon = s.showCart !== false && <CartNavIcon />;
      if (hv === "logo_center") return (
        <div id={anchorId} style={{ ...bgStyle, color: s.textColor || "#e2e8f0" }} className="w-full sticky top-0 z-40 backdrop-blur-xl">
          <div className="flex items-center justify-center px-8 py-3 border-b border-white/5">
            <span className="text-lg font-bold">{c.logo}</span>
          </div>
          <div className="flex items-center justify-between px-8 py-2">
            <div className="flex gap-8 flex-1 justify-center">{navLinks}</div>
            <div className="flex items-center gap-2">{cartIcon}{ctaBtn}</div>
          </div>
        </div>
      );
      if (hv === "minimal") return (
        <div id={anchorId} style={{ ...bgStyle, color: s.textColor || "#e2e8f0" }} className="w-full px-8 py-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur-xl">
          <span className="text-lg font-bold">{c.logo}</span>
          <div className="flex items-center gap-2">{cartIcon}{ctaBtn}</div>
        </div>
      );
      return (
        <div id={anchorId} style={{ ...bgStyle, color: s.textColor || "#e2e8f0" }} className="w-full px-8 py-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur-xl">
          <span className="text-lg font-bold flex-shrink-0">{c.logo}</span>
          <div className="flex gap-8 flex-1 justify-center">{navLinks}</div>
          <div className="flex items-center gap-2">{cartIcon}{ctaBtn}</div>
        </div>
      );
    }
    case "FOOTER": {
      const fv2 = s.variant || "columns";
      const socialLinks = [
        c.instagram && { href: c.instagram.startsWith("http") ? c.instagram : `https://instagram.com/${c.instagram.replace(/^@/, "")}`, label: "Instagram", icon: "📷" },
        c.telegram  && { href: c.telegram.startsWith("http")  ? c.telegram  : `https://t.me/${c.telegram.replace(/^@/, "")}`,          label: "Telegram",  icon: "✈" },
        c.vk        && { href: c.vk.startsWith("http")        ? c.vk        : `https://vk.com/${c.vk}`,                                 label: "VK",        icon: "🌐" },
        c.youtube   && { href: c.youtube.startsWith("http")   ? c.youtube   : `https://youtube.com/@${c.youtube}`,                      label: "YouTube",   icon: "▶" },
        c.facebook  && { href: c.facebook.startsWith("http")  ? c.facebook  : `https://facebook.com/${c.facebook}`,                     label: "Facebook",  icon: "🌍" },
      ].filter(Boolean) as { href: string; label: string; icon: string }[];
      const socialEl = socialLinks.length > 0 && (
        <div className="flex gap-3 mt-3">
          {socialLinks.map((sl, i) => <a key={i} href={sl.href} target="_blank" rel="noreferrer" title={sl.label} className="text-lg opacity-50 hover:opacity-90 transition">{sl.icon}</a>)}
        </div>
      );
      if (fv2 === "minimal") return (
        <div id={anchorId} style={{ ...bgStyle, color: s.textColor || "#475569" }} className="w-full py-6 px-8 border-t border-white/5">
          <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-4">
            <p className="text-sm font-bold text-white/50">{c.company}</p>
            <div className="flex gap-5 flex-wrap">
              {(c.links || []).map((l: any, i: number) => <a key={i} href={l.url || "#"} className="text-sm opacity-50 hover:opacity-80 transition">{l.label}</a>)}
            </div>
            <p className="text-xs opacity-30">{c.copyright}</p>
          </div>
        </div>
      );
      if (fv2 === "centered") return (
        <div id={anchorId} style={{ ...bgStyle, color: s.textColor || "#475569" }} className="w-full py-12 px-8 text-center">
          {c.logo && <img src={c.logo} alt={c.company} className="h-8 object-contain mx-auto mb-3" />}
          <p className="text-base font-bold text-white/60 mb-1">{c.company}</p>
          <p className="text-sm opacity-50 mb-4">{c.slogan}</p>
          <div className="flex gap-5 justify-center flex-wrap mb-4">
            {(c.links || []).map((l: any, i: number) => <a key={i} href={l.url || "#"} className="text-sm opacity-50 hover:opacity-80 transition">{l.label}</a>)}
          </div>
          {socialLinks.length > 0 && <div className="flex gap-3 justify-center mb-6">{socialLinks.map((sl, i) => <a key={i} href={sl.href} target="_blank" rel="noreferrer" title={sl.label} className="text-lg opacity-50 hover:opacity-90 transition">{sl.icon}</a>)}</div>}
          <p className="text-xs opacity-30 border-t border-white/5 pt-6">{c.copyright}</p>
        </div>
      );
      return (
        <div id={anchorId} style={{ ...bgStyle, color: s.textColor || "#475569" }} className="w-full py-12 px-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between gap-6 mb-8">
              <div>
                {c.logo && <img src={c.logo} alt={c.company} className="h-8 object-contain mb-2" />}
                <p className="text-base font-bold text-white/60 mb-1">{c.company}</p>
                <p className="text-sm opacity-50">{c.slogan}</p>
                {socialEl}
              </div>
              <div className="flex gap-6 flex-wrap items-start">
                {(c.links || []).map((l: any, i: number) => <a key={i} href={l.url || "#"} className="text-sm hover:text-white/70 transition">{l.label}</a>)}
              </div>
            </div>
            <div className="border-t border-white/5 pt-6 text-sm opacity-40">{c.copyright}</div>
          </div>
        </div>
      );
    }
    case "SCHEDULE":
      return (
        <div style={{ ...bgStyle, color: s.textColor || "#e2e8f0" }} className="w-full py-16 px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">{c.title}</h2>
            <div className="space-y-3">
              {(c.items || []).map((it: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-4 border-b border-white/8">
                  <p className="text-base font-semibold">{it.type}</p>
                  <p className="text-sm opacity-50">{it.trainer}</p>
                  <p className="text-sm opacity-60">{it.day}</p>
                  <p className="text-sm text-purple-400 font-semibold">{it.time}</p>
                  <a href={it.ctaUrl || "#"} className="text-sm bg-purple-600/20 text-purple-400 px-4 py-1.5 rounded-full font-semibold">Записаться</a>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    case "COACHES":
      return (
        <div id={anchorId} style={{ ...bgStyle, color: s.textColor || "#fff" }} className="w-full py-16 px-8">
          <h2 className="text-3xl font-bold text-center mb-10">{c.title}</h2>
          <div className="flex gap-6 justify-center max-w-4xl mx-auto">
            {(c.members || []).map((m: any, i: number) => (
              <div key={i} className="bg-white/6 rounded-2xl p-6 text-center flex-1 max-w-[220px]">
                {m.avatar ? (
                  <img src={m.avatar} className="w-20 h-20 rounded-full object-cover mx-auto mb-4" />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">{(m.name || "?")[0]}</div>
                )}
                <p className="text-base font-bold">{m.name}</p>
                <p className="text-sm opacity-40 mt-1">{m.role}</p>
                {m.bio && <p className="text-xs opacity-30 mt-2">{m.bio}</p>}
              </div>
            ))}
          </div>
        </div>
      );
    case "BLOG": {
      const bv = s.variant || "grid";
      const blogCard = (it: any, i: number) => (
        <a key={i} href={it.url || "#"} className="bg-white/5 rounded-2xl overflow-hidden border border-white/5 hover:border-purple-500/30 transition block">
          <div className="h-32 bg-white/4 border-b border-white/5 flex items-center justify-center overflow-hidden">
            {it.image ? <img src={it.image} className="w-full h-full object-cover" /> : <FileText size={28} className="text-white/15" />}
          </div>
          <div className="p-5">
            {it.tag && <span className="text-xs bg-purple-600/20 text-purple-400 px-2.5 py-0.5 rounded-full font-semibold">{it.tag}</span>}
            <p className="text-base font-bold mt-3">{it.title}</p>
            {it.preview && <p className="text-sm opacity-50 mt-2 line-clamp-2">{it.preview}</p>}
            <div className="flex items-center justify-between mt-3">
              <span className="text-sm opacity-40">{it.date}</span>
              <span className="text-sm text-purple-400 font-semibold">Читать →</span>
            </div>
          </div>
        </a>
      );
      if (bv === "list") return (
        <div id={anchorId} style={{ ...bgStyle, color: s.textColor || "#e2e8f0" }} className="w-full py-16 px-8">
          <AnimWrap {...ea(s,"title")}><h2 className="text-3xl font-bold mb-3">{c.title}</h2></AnimWrap>
          <AnimWrap {...ea(s,"subtitle")}><p className="text-base opacity-50 mb-10">{c.subtitle}</p></AnimWrap>
          <AnimWrap {...ea(s,"items")}>
            <div className="max-w-3xl mx-auto space-y-4">
              {(c.items || []).map((it: any, i: number) => (
                <a key={i} href={it.url || "#"} className="flex gap-5 bg-white/5 rounded-2xl overflow-hidden border border-white/5 hover:border-purple-500/30 transition">
                  <div className="w-40 h-28 flex-shrink-0 overflow-hidden">
                    {it.image ? <img src={it.image} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-white/4 flex items-center justify-center"><FileText size={24} className="text-white/15" /></div>}
                  </div>
                  <div className="py-4 pr-4 flex flex-col justify-center">
                    {it.tag && <span className="text-xs bg-purple-600/20 text-purple-400 px-2.5 py-0.5 rounded-full font-semibold self-start mb-2">{it.tag}</span>}
                    <p className="text-base font-bold">{it.title}</p>
                    {it.preview && <p className="text-sm opacity-50 mt-1 line-clamp-1">{it.preview}</p>}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm opacity-40">{it.date}</span>
                      <span className="text-sm text-purple-400 font-semibold">Читать →</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </AnimWrap>
        </div>
      );
      return (
        <div id={anchorId} style={{ ...bgStyle, color: s.textColor || "#e2e8f0" }} className="w-full py-16 px-8">
          <AnimWrap {...ea(s,"title")}><h2 className="text-3xl font-bold mb-3">{c.title}</h2></AnimWrap>
          <AnimWrap {...ea(s,"subtitle")}><p className="text-base opacity-50 mb-10">{c.subtitle}</p></AnimWrap>
          <AnimWrap {...ea(s,"items")}><div className="grid grid-cols-2 gap-6 max-w-4xl mx-auto">{(c.items || []).map(blogCard)}</div></AnimWrap>
        </div>
      );
    }
    case "MUSIC_PLAYER":
      return (
        <div style={{ ...bgStyle, color: s.textColor || "#f1f5f9" }} className="w-full py-16 px-8 flex items-center gap-8 justify-center">
          <div className="w-32 h-32 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center flex-shrink-0">
            {c.coverUrl ? <img src={c.coverUrl} className="w-full h-full object-cover rounded-2xl" /> : <Music size={40} className="text-white" />}
          </div>
          <div>
            <h3 className="text-2xl font-bold">{c.title}</h3>
            <p className="text-base opacity-60">{c.artist} · {c.album}</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-1.5 w-48 bg-white/10 rounded-full"><div className="h-full w-1/3 bg-purple-400 rounded-full" /></div>
              <span className="text-xs opacity-40">0:00</span>
            </div>
            <div className="flex gap-3 mt-4">
              {c.spotifyUrl && <a href={c.spotifyUrl} className="text-sm bg-green-600 text-white px-4 py-1.5 rounded-lg font-semibold">Spotify</a>}
              {c.appleUrl && <a href={c.appleUrl} className="text-sm bg-pink-600 text-white px-4 py-1.5 rounded-lg font-semibold">Apple Music</a>}
              {c.youtubeUrl && <a href={c.youtubeUrl} className="text-sm bg-red-600 text-white px-4 py-1.5 rounded-lg font-semibold">YouTube</a>}
            </div>
          </div>
        </div>
      );
    case "DISCOGRAPHY":
      return (
        <div style={{ ...bgStyle, color: s.textColor || "#e2e8f0" }} className="w-full py-16 px-8">
          <h2 className="text-3xl font-bold text-center mb-10">{c.title}</h2>
          <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto">
            {(c.albums || []).map((a: any, i: number) => (
              <div key={i} className="bg-white/6 rounded-2xl overflow-hidden">
                <div className="h-40 bg-gradient-to-br from-purple-800 to-indigo-900 flex items-center justify-center">
                  {a.cover ? <img src={a.cover} className="w-full h-full object-cover" /> : <Music size={32} className="text-white/30" />}
                </div>
                <div className="p-4">
                  <p className="text-base font-bold">{a.title}</p>
                  <p className="text-sm opacity-40">{a.year} · {a.tracks} треков</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    case "MAP":
      return (
        <div id={anchorId} style={bgStyle} className="w-full py-16 px-8">
          {c.title && <h2 style={{ color: s.textColor || "#fff" }} className="text-3xl font-bold text-center mb-6">{c.title}</h2>}
          <div className="max-w-4xl mx-auto rounded-2xl overflow-hidden" style={{ height: c.height || "400px" }}>
            {c.embedUrl ? (
              <iframe src={c.embedUrl} className="w-full h-full border-0" allowFullScreen loading="lazy" />
            ) : (
              <div className="w-full h-full bg-white/5 flex flex-col items-center justify-center text-white/20 gap-2">
                <MapPin size={48} />
                <span className="text-sm">Карта не настроена</span>
              </div>
            )}
          </div>
        </div>
      );
    case "ZERO_BLOCK":
      return (
        <div id={anchorId} className="w-full">
          <ZeroBlockRenderer content={c} styles={s} />
        </div>
      );
    default:
      return (
        <div className="w-full py-8 px-8 bg-white/3 text-center text-sm text-white/30">
          Блок: {block.type}
        </div>
      );
  }
}

export default function PreviewPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const [, nav] = useLocation();
  const [site, setSite] = useState<Site | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [activePage, setActivePage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [siteState, setSiteState] = useState<"ok" | "frozen" | "draft" | "notfound">("ok");
  const [frozenReason, setFrozenReason] = useState("");
  const [viewMode, setViewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");

  // ─── Cart state ─────────────────────────────────────────────────────────────
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [activePopupId, setActivePopupId] = useState<string | null>(null);
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const hasProducts = blocks.some(b => b.type === "PRODUCTS");
  const currency = (() => {
    const pb = blocks.find(b => b.type === "PRODUCTS");
    if (!pb) return "₽";
    try { return JSON.parse(pb.styles).currency || "₽"; } catch { return "₽"; }
  })();

  const cartCtx = {
    items: cartItems,
    add: (p: { id: string; name: string; price: string; image?: string }) => {
      setCartItems(prev => {
        const ex = prev.find(i => i.id === p.id);
        if (ex) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
        return [...prev, { ...p, priceNum: parsePrice(p.price), qty: 1 }];
      });
    },
    remove: (id: string) => setCartItems(prev => prev.filter(i => i.id !== id)),
    change: (id: string, delta: number) => setCartItems(prev =>
      prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i).filter(i => i.qty > 0)
    ),
    clear: () => setCartItems([]),
    openCart: () => setCartOpen(true),
  };

  useEffect(() => {
    if (!siteId) return;
    setLoading(true);
    sitesApi.getPublic(siteId).then(data => {
      setSite(data.site);
      setBlocks(data.blocks);
      setPages(data.pages);
      setActivePage(data.pages[0]?.id || null);
      setSiteState("ok");
    }).catch((err: any) => {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message;
      if (status === 403 && msg === "frozen") {
        setSiteState("frozen");
        setFrozenReason(err?.response?.data?.frozenReason || "Нарушение пользовательского соглашения");
      } else if (status === 404 && msg === "draft") {
        setSiteState("draft");
      } else {
        setSiteState("notfound");
        setError("Сайт не найден или был удалён");
      }
    }).finally(() => setLoading(false));
  }, [siteId]);

  // Parse global design tokens
  const globalDesign = (() => {
    try { return JSON.parse(site?.globalStyles || "{}"); } catch { return {}; }
  })();
  const sitePrimary = globalDesign.primaryColor || "#7C3AED";
  const siteFont = globalDesign.fontFamily || "Inter";
  const siteBgColor = globalDesign.siteBg || "#0f0f23";

  useEffect(() => {
    const currentPage = pages.find(p => p.id === activePage);
    let pageMeta: { title?: string; desc?: string; ogImage?: string } = {};
    try { pageMeta = JSON.parse(currentPage?.meta || "{}"); } catch {}
    let globalMeta: { seoTitle?: string; seoDesc?: string } = {};
    try { globalMeta = JSON.parse(site?.globalStyles || "{}"); } catch {}
    const title = pageMeta.title || globalMeta.seoTitle || site?.name || "Сайт";
    const desc = pageMeta.desc || globalMeta.seoDesc || "";
    document.title = title;
    let metaDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!metaDesc) { metaDesc = document.createElement("meta"); metaDesc.name = "description"; document.head.appendChild(metaDesc); }
    metaDesc.content = desc;
    if (pageMeta.ogImage) {
      let og = document.querySelector<HTMLMetaElement>('meta[property="og:image"]');
      if (!og) { og = document.createElement("meta"); og.setAttribute("property", "og:image"); document.head.appendChild(og); }
      og.content = pageMeta.ogImage;
    }
  }, [activePage, pages, site]);

  // Inject CSS custom properties + Google Font when site loads
  useEffect(() => {
    if (!site) return;
    const gs = (() => { try { return JSON.parse(site.globalStyles || "{}"); } catch { return {}; } })();
    const primary = gs.primaryColor || "#7C3AED";
    const font = gs.fontFamily || "Inter";
    const bg = gs.siteBg || "#0f0f23";

    // CSS custom properties
    let styleEl = document.getElementById("site-design-tokens") as HTMLStyleElement | null;
    if (!styleEl) { styleEl = document.createElement("style"); styleEl.id = "site-design-tokens"; document.head.appendChild(styleEl); }
    styleEl.textContent = `
      :root { --site-primary: ${primary}; --site-bg: ${bg}; --site-font: "${font}", system-ui, sans-serif; }
      .site-preview { font-family: var(--site-font); }
      .site-preview .bg-purple-600, .site-preview [class*="bg-purple-6"] { background-color: var(--site-primary) !important; }
      .site-preview .bg-purple-500, .site-preview [class*="bg-purple-5"] { background-color: var(--site-primary) !important; filter: brightness(1.1); }
      .site-preview .hover\\:bg-purple-500:hover { background-color: var(--site-primary) !important; filter: brightness(1.1); }
      .site-preview .text-purple-400, .site-preview [class*="text-purple-4"] { color: var(--site-primary) !important; }
      .site-preview .text-purple-300 { color: var(--site-primary) !important; filter: brightness(1.2); }
      .site-preview .ring-purple-400 { --tw-ring-color: var(--site-primary); }
      .site-preview .shadow-purple-500\\/20 { --tw-shadow-color: var(--site-primary); }
      .site-preview .border-purple-400 { border-color: var(--site-primary) !important; }
      .site-preview .bg-purple-600\\/20, .site-preview .bg-purple-600\\/30 { background-color: color-mix(in srgb, var(--site-primary) 20%, transparent) !important; }
      .site-preview a[style*="var(--site-primary)"], .site-preview button[style*="var(--site-primary)"] { background-color: var(--site-primary); }
      /* Block-level typography tokens cascade to headings */
      .site-preview h1 { font-size: var(--block-title-size, clamp(2.5rem,5vw,3.5rem)); font-weight: var(--block-font-weight, 900); line-height: var(--block-line-height, 1.15); letter-spacing: var(--block-letter-spacing, 0px); }
      .site-preview h2 { font-size: calc(var(--block-title-size, clamp(2.5rem,5vw,3.5rem)) * 0.72); font-weight: var(--block-font-weight, 700); line-height: var(--block-line-height, 1.25); letter-spacing: var(--block-letter-spacing, 0px); }
      .site-preview h3 { font-size: calc(var(--block-title-size, clamp(2.5rem,5vw,3.5rem)) * 0.55); font-weight: var(--block-font-weight, 700); line-height: var(--block-line-height, 1.3); letter-spacing: var(--block-letter-spacing, 0px); }
    `;

    // Google Fonts loader
    const googleFonts = ["Inter", "Roboto", "Montserrat", "Playfair Display", "Oswald"];
    if (googleFonts.includes(font)) {
      const fontId = "site-google-font";
      let link = document.getElementById(fontId) as HTMLLinkElement | null;
      if (!link) { link = document.createElement("link"); link.id = fontId; link.rel = "stylesheet"; document.head.appendChild(link); }
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;500;600;700;800;900&display=swap`;
    }

    // Favicon
    if (gs.favicon) {
      let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
      link.href = gs.favicon;
    }

    return () => {
      document.getElementById("site-design-tokens")?.remove();
    };
  }, [site]);

  const pageBlocks = activePage
    ? blocks.filter(b => b.pageId === activePage || !b.pageId)
    : blocks;
  const visiblePageBlocks = pageBlocks.filter(b => b.visible !== false);
  const popupBlocks = visiblePageBlocks.filter(b => b.type === "POPUP");
  const filteredBlocks = visiblePageBlocks.filter(b => b.type !== "POPUP");

  const viewWidths = { desktop: "100%", tablet: "768px", mobile: "375px" };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070711] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!loading && siteState === "frozen") {
    return (
      <div className="min-h-screen bg-[#070711] flex items-center justify-center text-white p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">❄</span>
          </div>
          <h2 className="text-2xl font-black mb-3 text-white">Сайт заморожен</h2>
          <p className="text-white/50 text-sm mb-4 leading-relaxed">
            Этот сайт временно недоступен по решению модерации.
          </p>
          <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-4 mb-6 text-left">
            <p className="text-xs text-blue-400/70 font-semibold uppercase tracking-wider mb-1">Причина</p>
            <p className="text-blue-300 text-sm">{frozenReason}</p>
          </div>
          <div className="text-white/30 text-xs leading-relaxed">
            Если вы являетесь владельцем этого сайта, обратитесь в поддержку:{" "}
            <a href="mailto:support@lilluucore.com" className="text-purple-400 hover:underline">support@lilluucore.com</a>
          </div>
          <div className="mt-6 pt-4 border-t border-white/5">
            <span className="text-xs text-white/15">Создано с помощью </span>
            <span className="text-xs text-purple-400/50 font-semibold">lilluucore</span>
          </div>
        </div>
      </div>
    );
  }

  if (!loading && siteState === "draft") {
    return (
      <div className="min-h-screen bg-[#070711] flex items-center justify-center text-white p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
            <Globe size={36} className="text-white/20" />
          </div>
          <h2 className="text-2xl font-black mb-3 text-white">Сайт не опубликован</h2>
          <p className="text-white/40 text-sm mb-6 leading-relaxed">
            Этот сайт ещё не был опубликован. Возможно, ссылка устарела или сайт был переведён в режим черновика.
          </p>
          <button onClick={() => nav("/dashboard")} className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition text-sm">
            На дашборд
          </button>
          <div className="mt-6 pt-4 border-t border-white/5">
            <span className="text-xs text-white/15">Создано с помощью </span>
            <span className="text-xs text-purple-400/50 font-semibold">lilluucore</span>
          </div>
        </div>
      </div>
    );
  }

  if (!loading && (siteState === "notfound" || !site)) {
    return (
      <div className="min-h-screen bg-[#070711] flex items-center justify-center text-white">
        <div className="text-center">
          <Globe size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Сайт не найден</h2>
          <p className="text-white/50 mb-6">{error || "Этот сайт не существует или был удалён"}</p>
          <button onClick={() => nav("/dashboard")} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-semibold">
            На дашборд
          </button>
        </div>
      </div>
    );
  }

  return (
    <PopupContext.Provider value={{ activePopupId, openPopup: setActivePopupId, closePopup: () => setActivePopupId(null) }}>
    <CartContext.Provider value={cartCtx}>
    <div className="min-h-screen bg-[#070711] flex flex-col">
      <div className="sticky top-0 z-50 bg-[#0a0a1a]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-12 flex items-center gap-4">
          <button onClick={() => nav("/dashboard")} className="flex items-center gap-1.5 text-white/50 hover:text-white transition text-sm">
            <ArrowLeft size={14} /> Назад
          </button>
          <div className="w-px h-5 bg-white/10" />
          <div className="flex items-center gap-2">
            <Eye size={14} className="text-purple-400" />
            <span className="text-sm font-semibold text-white">{site?.name}</span>
            <span className="text-xs text-white/30 font-mono">{site?.subdomain}</span>
          </div>

          {pages.length > 1 && (
            <>
              <div className="w-px h-5 bg-white/10" />
              <div className="flex gap-1">
                {pages.map(p => (
                  <button key={p.id} onClick={() => setActivePage(p.id)}
                    className={`text-xs px-3 py-1 rounded-lg transition ${activePage === p.id ? "bg-purple-600 text-white" : "text-white/40 hover:text-white/70"}`}>
                    {p.name}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="ml-auto flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
            {([["desktop", Monitor], ["tablet", Tablet], ["mobile", Smartphone]] as const).map(([mode, Icon]) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`p-1.5 rounded-md transition ${viewMode === mode ? "bg-purple-600 text-white" : "text-white/30 hover:text-white/60"}`}>
                <Icon size={14} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center py-6 px-4 overflow-auto">
        <div className="transition-all duration-300" style={{ width: viewWidths[viewMode], maxWidth: "100%" }}>
          <div className="site-preview rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-white/5"
            style={{ backgroundColor: siteBgColor, fontFamily: siteFont }}>
            {filteredBlocks.map(block => {
              const st = parseStyles(block);
              const ctaShadowMap: Record<string, string> = {
                none: "none", sm: "0 2px 8px rgba(0,0,0,.3)",
                lg: "0 6px 24px rgba(0,0,0,.4)", glow: `0 0 20px 4px ${st.ctaColor || "var(--site-primary)"}80`,
              };
              const wrapperStyle: React.CSSProperties = {
                paddingTop: st.paddingTop || undefined,
                paddingBottom: st.paddingBottom || undefined,
                paddingLeft: st.paddingLeft || undefined,
                paddingRight: st.paddingRight || undefined,
                marginTop: st.marginTop || undefined,
                marginBottom: st.marginBottom || undefined,
                ["--block-cta-color" as any]: st.ctaColor || "var(--site-primary)",
                ["--block-cta-text" as any]: st.ctaTextColor || "#fff",
                ["--block-cta-radius" as any]: st.ctaBorderRadius !== undefined ? `${st.ctaBorderRadius}px` : "12px",
                ["--block-cta-shadow" as any]: ctaShadowMap[st.ctaShadow || "none"] || "none",
                ["--block-cta-variant" as any]: st.ctaVariant || "filled",
                ["--block-title-size" as any]: TITLE_SIZE_MAP[st.titleSize || "xl"] || TITLE_SIZE_MAP.xl,
                ["--block-font-weight" as any]: st.fontWeight || "700",
                ["--block-line-height" as any]: st.lineHeight || "1.3",
                ["--block-letter-spacing" as any]: st.letterSpacing !== undefined ? `${st.letterSpacing}px` : "0px",
              };
              return (
                <div key={block.id} style={wrapperStyle}>
                  <AnimWrap animation={st.animation} delay={st.animDelay} duration={st.animDuration}>
                    <LiveBlock block={block} />
                  </AnimWrap>
                </div>
              );
            })}
            {filteredBlocks.length === 0 && (
              <div className="py-20 text-center text-white/20">
                <p className="text-base">На этой странице пока нет блоков</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-white/5 py-3 text-center">
        <span className="text-xs text-white/20">Создано с помощью </span>
        <span className="text-xs text-purple-400 font-semibold">lilluucore</span>
      </div>

      {/* Floating cart button — only when site has PRODUCTS blocks */}
      {hasProducts && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 right-6 z-[100] w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-500 transition shadow-lg shadow-purple-600/30 flex items-center justify-center text-white"
          title="Корзина"
        >
          <ShoppingBag size={22} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-pink-500 text-white text-[10px] font-bold flex items-center justify-center">
              {cartCount > 9 ? "9+" : cartCount}
            </span>
          )}
        </button>
      )}

      {/* Cart Drawer */}
      {cartOpen && siteId && (
        <CartDrawer siteId={siteId} currency={currency} onClose={() => setCartOpen(false)} />
      )}

      {/* Popup Renderer — renders POPUP blocks as fixed overlays */}
      {siteId && <PopupRenderer popupBlocks={popupBlocks} siteId={siteId} />}
    </div>
    </CartContext.Provider>
    </PopupContext.Provider>
  );
}
