import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  User, Lock, ShieldCheck, PaintBrush, ChatCircle,
  Diamond, Moon, Sun, CheckCircle,
  EnvelopeSimple, Lightning, Headset, HardDrive,
  PaperPlaneTilt, ArrowClockwise, ImageSquare, X,
  CreditCard, Warning, ArrowRight,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import AppHeader from "@/components/AppHeader";
import { authApi, chatApi, billingApi, uploadImage } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

type PlanDetail = { label: string; color: string; badgeBg: string; sites: string; storage: string; analytics: string; support: string; SupportIcon: PhosphorIcon };
const PLAN_DETAILS: Record<string, PlanDetail> = {
  free:     { label: "Free",     color: "text-gray-400",   badgeBg: "bg-gray-500/15",   sites: "1 сайт",    storage: "512 МБ",  analytics: "7 дней",  support: "Email",                 SupportIcon: EnvelopeSimple },
  pro:      { label: "Pro",      color: "text-purple-400", badgeBg: "bg-purple-500/15", sites: "10 сайтов", storage: "10 ГБ",   analytics: "90 дней", support: "Приоритетный email",    SupportIcon: Lightning      },
  business: { label: "Business", color: "text-amber-400",  badgeBg: "bg-amber-500/15",  sites: "Безлимит",  storage: "100 ГБ",  analytics: "1 год",   support: "Выделенная линия 24/7", SupportIcon: Headset        },
};

const SUPPORT_CATEGORIES = ["Технический вопрос", "Проблема с оплатой", "Вопрос по функционалу", "Другое"];

type Section = "personal" | "security" | "appearance" | "2fa" | "support" | "messages" | "subscription";

export default function ProfilePage() {
  const { user, theme, setTheme, updateUser } = useAuthStore();
  const [, nav] = useLocation();
  const qc = useQueryClient();

  const initSection = (): Section => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get("section");
    if (s === "messages" || s === "support" || s === "personal" || s === "security" || s === "appearance" || s === "2fa" || s === "subscription") return s as Section;
    return "personal";
  };
  const [activeSection, setActiveSection] = useState<Section>(initSection);

  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: authApi.getSettings });
  const [hasTicket, setHasTicket] = useState(false);
  const { data: chatData, refetch: refetchChat } = useQuery({
    queryKey: ["support-thread", user?.userId],
    queryFn: chatApi.getSupportThread,
    refetchInterval: activeSection === "messages" ? 5000 : false,
    enabled: !!user?.userId,
  });
  const chatUnread = chatData?.messages?.filter((m: any) => m.toUserId === user?.userId && !m.read).length ?? 0;
  const hasChatMessages = (chatData?.messages?.length ?? 0) > 0 || hasTicket;

  const plan = PLAN_DETAILS[user?.plan || "free"];
  const userId = user?.userId || "";
  const shortId = `USR-${userId.slice(0, 8).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <div className="max-w-5xl mx-auto px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-black text-foreground">Настройки аккаунта</h1>
          <p className="text-muted-foreground mt-1">Управляйте профилем, безопасностью и настройками</p>
        </motion.div>

        <div className="flex gap-6 items-start">
          {/* Sidebar nav */}
          <div className="w-56 flex-shrink-0 space-y-1">
            {/* User card */}
            <div className="glass border border-white/8 rounded-xl p-4 mb-4 text-center">
              <div className="w-14 h-14 rounded-xl mx-auto mb-3 overflow-hidden shadow-lg flex-shrink-0">
                {user?.avatarUrl
                  ? <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  : <div className="w-full h-full gradient-purple flex items-center justify-center text-white text-xl font-black">{user?.firstName?.[0]}</div>
                }
              </div>
              <p className="text-foreground font-bold text-sm">{user?.firstName} {user?.lastName}</p>
              <p className="text-muted-foreground text-xs mt-0.5 truncate">{user?.email}</p>
              <div className={`mt-2 inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${plan.badgeBg} ${plan.color}`}>
                {plan.label}
              </div>
              <p className="text-muted-foreground text-xs mt-2 font-mono">{shortId}</p>
            </div>

            {([
              { id: "personal",     label: "Личные данные",  icon: User         },
              { id: "security",     label: "Безопасность",   icon: Lock         },
              { id: "2fa",          label: "Двухфакторная",  icon: ShieldCheck  },
              { id: "appearance",   label: "Внешний вид",    icon: PaintBrush   },
              { id: "subscription", label: "Подписка",       icon: CreditCard   },
              { id: "support",      label: "Поддержка",      icon: ChatCircle   },
            ] as { id: Section; label: string; icon: React.ComponentType<{ size?: number; weight?: string }> }[]).map((item) => (
              <button key={item.id} onClick={() => setActiveSection(item.id)}
                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${activeSection === item.id ? "bg-primary/15 text-primary font-semibold" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}>
                <item.icon size={16} weight="light" />
                <span className="flex-1">{item.label}</span>
              </button>
            ))}

            {/* Сообщения — появляется как только есть тикет или сообщения с поддержкой */}
            {hasChatMessages && (
              <button onClick={() => setActiveSection("messages")}
                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${activeSection === "messages" ? "bg-primary/15 text-primary font-semibold" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}>
                <PaperPlaneTilt size={16} weight="light" />
                <span className="flex-1">Сообщения</span>
                {chatUnread > 0 && (
                  <span className="bg-primary text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">{chatUnread > 9 ? "9+" : chatUnread}</span>
                )}
              </button>
            )}

          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div key={activeSection} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.15 }}>
                {activeSection === "personal" && <PersonalSection user={user} updateUser={updateUser} settings={settings} />}
                {activeSection === "security" && <SecuritySection user={user} />}
                {activeSection === "2fa" && <TwoFASection />}
                {activeSection === "appearance" && <AppearanceSection settings={settings} theme={theme} setTheme={setTheme} qc={qc} />}
                {activeSection === "subscription" && <SubscriptionSection user={user} plan={plan} updateUser={updateUser} nav={nav} />}
                {activeSection === "support" && <SupportSection user={user} plan={plan} shortId={shortId} onTicketSent={() => {
                  setHasTicket(true);
                  setActiveSection("messages");
                  setTimeout(() => refetchChat(), 300);
                }} />}
                {activeSection === "messages" && <SupportChatSection user={user} chatData={chatData} onRefetch={() => refetchChat()} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Personal Data ─── */
function PersonalSection({ user, updateUser, settings }: any) {
  const [form, setForm] = useState({ firstName: user?.firstName || "", lastName: user?.lastName || "" });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarSaved, setAvatarSaved] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);

  const mutation = useMutation({
    mutationFn: () => authApi.updateProfile(form),
    onSuccess: (data) => { updateUser({ firstName: data.firstName, lastName: data.lastName }); setSaved(true); setTimeout(() => setSaved(false), 2000); },
    onError: (e: any) => setError(e.response?.data?.message || "Ошибка"),
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError("");
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setAvatarError("Неподдерживаемый формат. Разрешены: JPG, PNG, GIF, WebP");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError(`Файл слишком большой (${(file.size / 1024 / 1024).toFixed(1)} МБ). Максимум 5 МБ.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropSrc(ev.target?.result as string);
      setCrop(undefined);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const c = centerCrop(makeAspectCrop({ unit: "%", width: 80 }, 1, width, height), width, height);
    setCrop(c);
  }, []);

  const applyCrop = useCallback(async () => {
    if (!completedCrop || !imgRef.current) return;
    const canvas = document.createElement("canvas");
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
    const size = Math.min(completedCrop.width * scaleX, completedCrop.height * scaleY);
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(imgRef.current,
      completedCrop.x * scaleX, completedCrop.y * scaleY,
      completedCrop.width * scaleX, completedCrop.height * scaleY,
      0, 0, size, size);
    setCropSrc(null);
    setAvatarUploading(true);
    try {
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(b => b ? resolve(b) : reject(new Error("Canvas empty")), "image/jpeg", 0.85)
      );
      const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
      const url = await uploadImage(file);
      await authApi.updateAvatar(url);
      updateUser({ avatarUrl: url });
      setAvatarSaved(true);
      setTimeout(() => setAvatarSaved(false), 2000);
    } catch (err: any) {
      setAvatarError(err.response?.data?.message || "Ошибка загрузки аватара");
    } finally { setAvatarUploading(false); }
  }, [completedCrop, updateUser]);

  const removeAvatar = async () => {
    setAvatarUploading(true);
    try { await authApi.updateAvatar(null); updateUser({ avatarUrl: null }); }
    catch { alert("Ошибка"); }
    finally { setAvatarUploading(false); }
  };

  return (
    <div className="glass border border-white/8 rounded-2xl p-6">
      <h2 className="text-xl font-bold text-foreground mb-1">Личные данные</h2>
      <p className="text-muted-foreground text-sm mb-6">Измените имя, фото и отображаемые данные профиля</p>

      {/* Avatar crop modal */}
      <AnimatePresence>
        {cropSrc && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <h3 className="text-foreground font-bold text-lg mb-4 text-center">Кадрировать фото</h3>
              <div className="mb-4 rounded-xl overflow-hidden bg-black/40">
                <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)} aspect={1} circularCrop>
                  <img ref={imgRef} src={cropSrc} onLoad={onImageLoad} alt="Crop" className="max-h-72 w-full object-contain" />
                </ReactCrop>
              </div>
              <p className="text-muted-foreground text-xs text-center mb-4">Выделите квадратную область — это будет ваш аватар</p>
              <div className="flex gap-2">
                <button onClick={() => setCropSrc(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition">
                  Отмена
                </button>
                <button onClick={applyCrop} disabled={!completedCrop}
                  className="flex-1 py-2.5 rounded-xl gradient-purple text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-40">
                  Применить
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar upload */}
      <div className="flex items-center gap-5 mb-6 pb-6 border-b border-border">
        <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg">
          {user?.avatarUrl
            ? <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            : <div className="w-full h-full gradient-purple flex items-center justify-center text-white text-3xl font-black">{user?.firstName?.[0]}</div>
          }
        </div>
        <div className="flex-1">
          <p className="text-foreground font-semibold text-sm mb-1">Фото профиля</p>
          <p className="text-muted-foreground text-xs mb-3">JPG, PNG, WebP — максимум 5 МБ. Будет кадрировано до квадрата.</p>
          <div className="flex gap-2">
            <label className="cursor-pointer gradient-purple text-white text-xs font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition">
              {avatarUploading ? "Загрузка..." : avatarSaved ? "✓ Сохранено!" : "Загрузить фото"}
              <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleAvatarChange} disabled={avatarUploading} />
            </label>
            {user?.avatarUrl && (
              <button onClick={removeAvatar} disabled={avatarUploading}
                className="text-xs text-muted-foreground hover:text-destructive border border-border rounded-lg px-3 py-2 transition">
                Удалить
              </button>
            )}
          </div>
          {avatarError && <p className="text-red-400 text-xs mt-2">{avatarError}</p>}
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Имя</label>
            <input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
              className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary/50 transition" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Фамилия</label>
            <input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
              className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary/50 transition" />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Email</label>
          <input value={user?.email} disabled
            className="w-full bg-secondary/20 border border-border rounded-xl px-4 py-2.5 text-muted-foreground text-sm cursor-not-allowed" />
          <p className="text-xs text-muted-foreground mt-1">Для смены email перейдите в раздел «Безопасность»</p>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
          className="gradient-purple text-white font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 transition disabled:opacity-50">
          {saved ? "✓ Сохранено!" : mutation.isPending ? "Сохраняю..." : "Сохранить изменения"}
        </button>
      </div>

      {/* DB state */}
      <div className="mt-6 pt-6 border-t border-white/8">
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <HardDrive size={16} weight="light" className="text-muted-foreground" /> Дамп памяти пользователя
        </h3>
        {settings?.dbAccessLocked && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <Lock size={14} weight="light" className="text-amber-400 flex-shrink-0" />
              <p className="text-amber-400 font-semibold text-sm">Доступ временно ограничен</p>
            </div>
            <p className="text-amber-400/80 text-xs">{settings.dbLockReason || "Временные технические работы"}</p>
          </div>
        )}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Использовано", value: "18 МБ", color: "" },
            { label: "Лимит", value: "512 МБ", color: "" },
            { label: "Статус", value: settings?.dbAccessLocked ? "Заблокирован" : "OK", color: settings?.dbAccessLocked ? "text-amber-400" : "text-green-400" },
          ].map(i => (
            <div key={i.label} className="bg-secondary/40 rounded-xl p-3 text-center">
              <p className="text-muted-foreground text-xs mb-1">{i.label}</p>
              <p className={`font-semibold text-sm ${i.color || "text-foreground"}`}>{i.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5"><span>18 МБ использовано</span><span>из 512 МБ</span></div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full gradient-purple rounded-full" style={{ width: "3.5%" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Security ─── */
function SecuritySection({ user }: any) {
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [emailForm, setEmailForm] = useState({ newEmail: "", password: "" });
  const [pwSaved, setPwSaved] = useState(false);
  const [emailSaved, setEmailSaved] = useState(false);
  const [pwError, setPwError] = useState("");
  const [emailError, setEmailError] = useState("");
  const { updateUser } = useAuthStore();

  const pwMutation = useMutation({
    mutationFn: () => authApi.updatePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
    onSuccess: () => { setPwForm({ currentPassword: "", newPassword: "", confirm: "" }); setPwSaved(true); setTimeout(() => setPwSaved(false), 3000); },
    onError: (e: any) => setPwError(e.response?.data?.message || "Ошибка"),
  });

  const emailMutation = useMutation({
    mutationFn: () => authApi.updateEmail({ newEmail: emailForm.newEmail, password: emailForm.password }),
    onSuccess: (data) => { updateUser({ email: data.email }); setEmailForm({ newEmail: "", password: "" }); setEmailSaved(true); setTimeout(() => setEmailSaved(false), 3000); },
    onError: (e: any) => setEmailError(e.response?.data?.message || "Ошибка"),
  });

  return (
    <div className="space-y-5">
      {/* Change email */}
      <div className="glass border border-white/8 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-foreground mb-1">Смена Email</h2>
        <p className="text-muted-foreground text-sm mb-5">Текущий: <span className="text-foreground">{user?.email}</span></p>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Новый email</label>
            <input type="email" value={emailForm.newEmail} onChange={e => setEmailForm(f => ({ ...f, newEmail: e.target.value }))}
              placeholder="new@email.com"
              className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary/50 transition" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Подтвердите текущий пароль</label>
            <input type="password" value={emailForm.password} onChange={e => setEmailForm(f => ({ ...f, password: e.target.value }))}
              placeholder="••••••"
              className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary/50 transition" />
          </div>
          {emailError && <p className="text-red-400 text-sm">{emailError}</p>}
          {emailSaved && <p className="text-green-400 text-sm">✓ Email успешно изменён</p>}
          <button onClick={() => { setEmailError(""); emailMutation.mutate(); }} disabled={emailMutation.isPending || !emailForm.newEmail || !emailForm.password}
            className="gradient-purple text-white font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 transition disabled:opacity-40">
            {emailMutation.isPending ? "Сохраняю..." : "Изменить email"}
          </button>
        </div>
      </div>

      {/* Change password */}
      <div className="glass border border-white/8 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-foreground mb-1">Смена пароля</h2>
        <p className="text-muted-foreground text-sm mb-5">Минимум 6 символов</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Текущий пароль</label>
            <input type="password" value={pwForm.currentPassword} onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
              placeholder="••••••"
              className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary/50 transition" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Новый пароль</label>
            <input type="password" value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
              placeholder="••••••"
              className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary/50 transition" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Повторите новый пароль</label>
            <input type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
              placeholder="••••••"
              className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary/50 transition" />
            {pwForm.confirm && pwForm.newPassword !== pwForm.confirm && (
              <p className="text-red-400 text-xs mt-1">Пароли не совпадают</p>
            )}
          </div>
          {pwError && <p className="text-red-400 text-sm">{pwError}</p>}
          {pwSaved && <p className="text-green-400 text-sm">✓ Пароль успешно изменён</p>}
          <button
            onClick={() => { setPwError(""); pwMutation.mutate(); }}
            disabled={pwMutation.isPending || !pwForm.currentPassword || !pwForm.newPassword || pwForm.newPassword !== pwForm.confirm}
            className="gradient-purple text-white font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 transition disabled:opacity-40">
            {pwMutation.isPending ? "Изменяю..." : "Изменить пароль"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── 2FA ─── */
function TwoFASection() {
  const [step, setStep] = useState<"idle" | "sent" | "verified">("idle");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [demoCode, setDemoCode] = useState("");
  const { user } = useAuthStore();

  const sendMutation = useMutation({
    mutationFn: authApi.send2FA,
    onSuccess: (data) => { setStep("sent"); setDemoCode(data.codeForDemo); setError(""); },
    onError: () => setError("Не удалось отправить код"),
  });

  const verifyMutation = useMutation({
    mutationFn: () => authApi.verify2FA(code),
    onSuccess: () => setStep("verified"),
    onError: (e: any) => setError(e.response?.data?.message || "Неверный код"),
  });

  return (
    <div className="glass border border-white/8 rounded-2xl p-6">
      <h2 className="text-xl font-bold text-foreground mb-1">Двухфакторная аутентификация</h2>
      <p className="text-muted-foreground text-sm mb-6">Защитите аккаунт кодом подтверждения на email</p>

      {step === "idle" && (
        <div className="space-y-4">
          <div className="bg-secondary/40 rounded-xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <EnvelopeSimple size={18} weight="light" className="text-primary" />
            </div>
            <div>
              <p className="text-foreground font-medium text-sm">Email-код</p>
              <p className="text-muted-foreground text-xs mt-0.5">Код будет отправлен на <span className="text-foreground">{user?.email}</span></p>
            </div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending}
            className="gradient-purple text-white font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 transition disabled:opacity-50">
            {sendMutation.isPending ? "Отправляю..." : "Отправить код"}
          </button>
        </div>
      )}

      {step === "sent" && (
        <div className="space-y-4">
          <div className="bg-green-500/8 border border-green-500/20 rounded-xl p-3 text-green-400 text-sm">
            ✓ Код отправлен на {user?.email}
            {demoCode && <span className="ml-2 font-mono bg-green-500/10 px-2 py-0.5 rounded">[DEMO: {demoCode}]</span>}
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Введите 6-значный код</label>
            <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456" maxLength={6}
              className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-2.5 text-foreground text-sm text-center tracking-widest text-lg font-mono focus:outline-none focus:border-primary/50 transition" />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3">
            <button onClick={() => verifyMutation.mutate()} disabled={code.length < 6 || verifyMutation.isPending}
              className="flex-1 gradient-purple text-white font-semibold py-2.5 rounded-xl hover:opacity-90 transition disabled:opacity-40">
              {verifyMutation.isPending ? "Проверяю..." : "Подтвердить"}
            </button>
            <button onClick={() => { setStep("idle"); setCode(""); setError(""); }} className="px-4 py-2.5 border border-white/8 rounded-xl text-muted-foreground hover:text-foreground text-sm transition">
              Отмена
            </button>
          </div>
        </div>
      )}

      {step === "verified" && (
        <div className="text-center py-6">
          <div className="flex justify-center mb-4"><CheckCircle size={48} weight="duotone" className="text-green-400" /></div>
          <p className="text-foreground font-bold text-lg">Код подтверждён!</p>
          <p className="text-muted-foreground text-sm mt-2">2FA успешно активирована для вашего аккаунта</p>
          <button onClick={() => { setStep("idle"); setCode(""); }} className="mt-5 text-sm text-primary hover:underline">
            Сбросить
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Appearance ─── */
function AppearanceSection({ settings, theme, setTheme, qc }: any) {
  const [localTheme, setLocalTheme] = useState(theme || settings?.theme || "dark");
  const [localNotif, setLocalNotif] = useState(settings?.notifications ?? true);
  const [localEmailNotif, setLocalEmailNotif] = useState(settings?.emailNotifications ?? true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setLocalTheme(settings.theme);
      setLocalNotif(settings.notifications);
      setLocalEmailNotif(settings.emailNotifications ?? true);
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: () => authApi.updateSettings({ theme: localTheme, notifications: localNotif, emailNotifications: localEmailNotif }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings"] }); setTheme(localTheme); setSaved(true); setTimeout(() => setSaved(false), 2000); },
  });

  const Toggle = ({ value, onChange, label, sub }: { value: boolean; onChange: () => void; label: string; sub: string }) => (
    <div className="flex items-center justify-between py-3.5 border-t border-white/8">
      <div>
        <p className="text-foreground font-medium text-sm">{label}</p>
        <p className="text-muted-foreground text-xs mt-0.5">{sub}</p>
      </div>
      <button onClick={onChange}
        className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${value ? "bg-primary" : "bg-secondary"}`}>
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${value ? "left-7" : "left-1"}`} />
      </button>
    </div>
  );

  return (
    <div className="glass border border-white/8 rounded-2xl p-6">
      <h2 className="text-xl font-bold text-foreground mb-1">Внешний вид и уведомления</h2>
      <p className="text-muted-foreground text-sm mb-6">Персонализируйте интерфейс и настройте уведомления</p>

      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">Тема интерфейса</label>
          <div className="grid grid-cols-2 gap-3">
            {(["dark", "light"] as const).map((t) => (
              <button key={t} onClick={() => setLocalTheme(t)}
                className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${localTheme === t ? "border-primary/60 bg-primary/10" : "border-white/8 bg-secondary/30 hover:border-white/20"}`}>
                {t === "dark" ? <Moon size={24} weight="light" /> : <Sun size={24} weight="light" />}
                <span className={`text-sm font-medium ${localTheme === t ? "text-primary" : "text-muted-foreground"}`}>
                  {t === "dark" ? "Тёмная" : "Светлая"}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground mb-1">Уведомления</p>
          <p className="text-xs text-muted-foreground mb-0">Управляйте тем, как и когда вы получаете уведомления от сервиса</p>
          <Toggle value={localNotif} onChange={() => setLocalNotif(!localNotif)}
            label="Уведомления в приложении"
            sub="Системные сообщения, модерация, статус публикации" />
          <Toggle value={localEmailNotif} onChange={() => setLocalEmailNotif(!localEmailNotif)}
            label="Email-уведомления"
            sub="Новости сервиса, важные обновления, статус модерации" />
        </div>

        <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3">
          <p className="text-xs text-amber-400/80 leading-relaxed">
            <strong>Важно:</strong> уведомления модерации (заморозка сайта, нарушения правил) всегда доставляются в приложение вне зависимости от ваших настроек.
          </p>
        </div>

        <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
          className="w-full gradient-purple text-white font-semibold py-2.5 rounded-xl hover:opacity-90 transition disabled:opacity-50">
          {saved ? "✓ Сохранено!" : mutation.isPending ? "Сохраняю..." : "Сохранить настройки"}
        </button>
      </div>
    </div>
  );
}

/* ─── Subscription ─── */
function SubscriptionSection({ user, plan, updateUser, nav }: any) {
  const currentPlanId: string = user?.plan || "free";
  const isPaid = currentPlanId !== "free";

  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  const PLAN_FEATURES: Record<string, { sites: string; storage: string; analytics: string; support: string }> = {
    free:     { sites: "1 сайт",     storage: "512 МБ", analytics: "7 дней",   support: "Email (48ч)"        },
    pro:      { sites: "10 сайтов",  storage: "10 ГБ",  analytics: "90 дней",  support: "Приоритет (12ч)"    },
    business: { sites: "Безлимит",   storage: "100 ГБ", analytics: "1 год",    support: "Выделенная 24/7"    },
  };
  const features = PLAN_FEATURES[currentPlanId] || PLAN_FEATURES.free;

  async function handleCancel() {
    setCancelling(true);
    setError("");
    try {
      const r = await billingApi.cancel();
      updateUser({ plan: r.plan });
      setCancelled(true);
      setShowConfirm(false);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Ошибка при отмене подписки");
    } finally {
      setCancelling(false);
    }
  }

  if (cancelled) {
    return (
      <div className="glass border border-white/8 rounded-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={28} weight="fill" className="text-green-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Подписка отменена</h3>
        <p className="text-muted-foreground text-sm mb-5">Вы переведены на тариф Free. Спасибо, что были с нами!</p>
        <button onClick={() => nav("/pricing")} className="gradient-purple text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition">
          Посмотреть тарифы
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Подписка</h2>
        <p className="text-muted-foreground text-sm">Управление текущим тарифом и оплатой</p>
      </div>

      {/* Current plan card */}
      <div className="glass border border-white/8 rounded-2xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1">Текущий тариф</p>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-black text-white">{plan.label}</h3>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${plan.badgeBg} ${plan.color}`}>{plan.label}</span>
            </div>
          </div>
          <button
            onClick={() => nav("/pricing")}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition font-semibold border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary/5"
          >
            Сменить тариф
            <ArrowRight size={12} weight="bold" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Сайты", value: features.sites },
            { label: "Хранилище", value: features.storage },
            { label: "Аналитика", value: features.analytics },
            { label: "Поддержка", value: features.support },
          ].map(f => (
            <div key={f.label} className="bg-white/4 rounded-xl px-4 py-3">
              <p className="text-xs text-muted-foreground mb-0.5">{f.label}</p>
              <p className="text-foreground text-sm font-semibold">{f.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cancel section — only for paid plans */}
      {isPaid && (
        <div className="glass border border-red-500/15 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <Warning size={18} weight="light" className="text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-foreground font-semibold text-sm mb-1">Отменить подписку</h4>
              <p className="text-muted-foreground text-xs leading-relaxed mb-4">
                После отмены тариф останется активным до конца оплаченного периода, затем аккаунт автоматически переведётся на Free. Все сайты сверх лимита будут заархивированы.
              </p>
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 text-red-400 text-xs mb-3">{error}</div>
              )}
              {!showConfirm ? (
                <button
                  onClick={() => setShowConfirm(true)}
                  className="text-sm text-red-400 hover:text-red-300 transition font-medium border border-red-500/20 hover:border-red-500/40 px-4 py-2 rounded-xl hover:bg-red-500/5"
                >
                  Отменить подписку
                </button>
              ) : (
                <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-4">
                  <p className="text-sm text-foreground font-medium mb-3">Вы уверены? Это действие нельзя отменить.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="flex-1 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 rounded-xl py-2 text-sm font-semibold transition disabled:opacity-50"
                    >
                      {cancelling ? "Отменяем..." : "Да, отменить подписку"}
                    </button>
                    <button
                      onClick={() => setShowConfirm(false)}
                      disabled={cancelling}
                      className="flex-1 border border-white/10 hover:bg-white/5 text-muted-foreground rounded-xl py-2 text-sm transition disabled:opacity-50"
                    >
                      Назад
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Free plan upgrade CTA */}
      {!isPaid && (
        <div className="glass border border-primary/20 rounded-2xl p-5 bg-primary/4">
          <p className="text-foreground font-semibold text-sm mb-1">Хотите больше возможностей?</p>
          <p className="text-muted-foreground text-xs mb-4">Перейдите на Pro или Business — больше сайтов, хранилища и расширенная аналитика.</p>
          <button onClick={() => nav("/pricing")} className="gradient-purple text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition flex items-center gap-1.5">
            Посмотреть тарифы
            <ArrowRight size={13} weight="bold" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Support ─── */
function SupportSection({ user, plan, shortId, onTicketSent }: any) {
  const [form, setForm] = useState({ subject: "", message: "", category: SUPPORT_CATEGORIES[0] });
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [ticket, setTicket] = useState<{ ticketId: string; userId: string } | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { setError("Файл слишком большой (макс. 4 МБ)"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setPendingImage(ev.target?.result as string); setError(""); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const mutation = useMutation({
    mutationFn: () => authApi.submitSupport({ ...form, imageUrl: pendingImage }),
    onSuccess: (data) => {
      setTicket(data);
      setForm({ subject: "", message: "", category: SUPPORT_CATEGORIES[0] });
      setPendingImage(null);
    },
    onError: (e: any) => setError(e.response?.data?.message || "Ошибка отправки"),
  });

  return (
    <div className="glass border border-white/8 rounded-2xl p-6">
      <h2 className="text-xl font-bold text-foreground mb-1">Служба поддержки</h2>
      <p className="text-muted-foreground text-sm mb-5">Задайте вопрос — ответим в течение рабочего дня</p>

      {/* User info block */}
      <div className="bg-secondary/40 rounded-xl p-4 mb-5 flex items-center gap-4">
        <div className="w-10 h-10 gradient-purple rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
          {user?.firstName?.[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-foreground font-medium text-sm">{user?.firstName} {user?.lastName}</p>
          <p className="text-muted-foreground text-xs">ID: <span className="font-mono text-foreground">{shortId}</span></p>
        </div>
        <div className="text-right">
          <p className={`text-xs font-bold ${plan.color}`}>{plan.label}</p>
          <p className="text-muted-foreground text-xs mt-0.5 flex items-center gap-1"><plan.SupportIcon size={11} weight="light" />{plan.support}</p>
        </div>
      </div>

      {ticket ? (
        <div className="space-y-4">
          <div className="bg-green-500/8 border border-green-500/20 rounded-xl p-5 text-center">
            <div className="flex justify-center mb-2"><CheckCircle size={36} weight="duotone" className="text-green-400" /></div>
            <p className="text-green-400 font-bold">Обращение отправлено!</p>
            <div className="mt-3 space-y-1 text-sm">
              <p className="text-muted-foreground">Номер тикета: <span className="font-mono text-foreground font-bold">{ticket.ticketId}</span></p>
              <p className="text-muted-foreground">Ваш ID: <span className="font-mono text-foreground">{ticket.userId}</span></p>
              <p className="text-muted-foreground mt-2 text-xs">Специалист ответит в разделе «Сообщения»</p>
            </div>
          </div>
          <button onClick={onTicketSent}
            className="w-full gradient-purple text-white font-bold py-3 rounded-xl hover:opacity-90 transition">
            Перейти к сообщениям →
          </button>
          <button onClick={() => setTicket(null)} className="w-full border border-white/8 rounded-xl py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition">
            Новое обращение
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Категория</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary/50 transition">
              {SUPPORT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Тема</label>
            <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              placeholder="Кратко опишите проблему"
              className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary/50 transition" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Сообщение</label>
            <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder={`Опишите проблему подробнее. Ваш ID: ${shortId}`}
              rows={5}
              className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary/50 transition resize-none" />
          </div>

          {/* Photo attachment */}
          <div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            {pendingImage ? (
              <div className="relative inline-block">
                <img src={pendingImage} alt="Preview" className="h-20 w-auto rounded-xl border border-white/12 object-cover" />
                <button onClick={() => setPendingImage(null)}
                  className="absolute -top-1.5 -right-1.5 bg-background border border-white/20 rounded-full p-0.5 hover:bg-red-500/20 transition">
                  <X size={12} weight="bold" className="text-foreground" />
                </button>
              </div>
            ) : (
              <button onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground border border-dashed border-white/15 hover:border-white/30 px-4 py-2.5 rounded-xl transition w-full">
                <ImageSquare size={16} weight="light" />
                Прикрепить скриншот или фото (до 4 МБ)
              </button>
            )}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button onClick={() => { setError(""); mutation.mutate(); }} disabled={!form.message.trim() || mutation.isPending}
            className="w-full gradient-purple text-white font-bold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-40">
            {mutation.isPending ? "Отправляю..." : "Отправить обращение"}
          </button>
          <p className="text-xs text-muted-foreground text-center">
            К тикету будет автоматически прикреплён ваш ID: <span className="font-mono text-foreground">{shortId}</span>
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Support Chat ─── */
function SupportChatSection({ user, chatData, onRefetch }: { user: any; chatData: any; onRefetch: () => void }) {
  const [text, setText] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messages: any[] = chatData?.messages || [];
  const userId = user?.userId || "";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setError("Файл слишком большой (макс. 4 МБ)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPendingImage(ev.target?.result as string);
      setError("");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const send = async () => {
    if (!text.trim() && !pendingImage || sending) return;
    setSending(true);
    setError("");
    try {
      await chatApi.sendToSupport(text.trim(), pendingImage);
      setText("");
      setPendingImage(null);
      onRefetch();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Ошибка отправки");
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  const isStaff = (msg: any) => msg.fromUser && (msg.fromUser.role === "admin" || msg.fromUser.role === "moderator");

  return (
    <div className="glass border border-white/8 rounded-2xl flex flex-col" style={{ height: "580px" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold text-foreground">Чат с поддержкой</h2>
          <p className="text-muted-foreground text-xs mt-0.5">Отвечаем в течение рабочего дня</p>
        </div>
        <button onClick={onRefetch} className="text-muted-foreground hover:text-foreground transition p-1.5 rounded-lg hover:bg-white/5" title="Обновить">
          <ArrowClockwise size={16} weight="light" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <div className="w-14 h-14 gradient-purple rounded-2xl flex items-center justify-center opacity-60">
              <ChatCircle size={28} weight="light" className="text-white" />
            </div>
            <div>
              <p className="text-foreground font-semibold text-sm">Напишите первым</p>
              <p className="text-muted-foreground text-xs mt-1">Задайте вопрос — специалист ответит как можно скорее</p>
            </div>
          </div>
        ) : (
          messages.map((msg: any, i: number) => {
            const mine = msg.fromUserId === userId;
            const staffSender = isStaff(msg);
            return (
              <div key={msg.id ?? i} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] ${mine ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                  {!mine && staffSender && (
                    <span className="text-[10px] text-muted-foreground px-1 font-medium">
                      {msg.fromUser.firstName} · {msg.fromUser.role === "admin" ? "Администратор" : "Модератор"}
                    </span>
                  )}
                  <div className={`rounded-2xl text-sm leading-relaxed overflow-hidden ${
                    mine
                      ? "bg-primary text-white rounded-br-sm"
                      : "bg-secondary/60 text-foreground border border-white/8 rounded-bl-sm"
                  }`}>
                    {msg.imageUrl && (
                      <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                        <img
                          src={msg.imageUrl}
                          alt="Вложение"
                          className="max-w-full block"
                          style={{ maxHeight: "240px", objectFit: "cover", width: "100%" }}
                        />
                      </a>
                    )}
                    {msg.message && (
                      <div className="px-4 py-2.5 break-words">{msg.message}</div>
                    )}
                    {!msg.message && !msg.imageUrl && (
                      <div className="px-4 py-2.5 opacity-50 italic text-xs">пустое сообщение</div>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground px-1">{formatTime(msg.createdAt)}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Image preview before send */}
      {pendingImage && (
        <div className="px-4 pt-3 flex-shrink-0">
          <div className="relative inline-block">
            <img src={pendingImage} alt="Preview" className="h-20 w-auto rounded-xl border border-white/12 object-cover" />
            <button
              onClick={() => setPendingImage(null)}
              className="absolute -top-1.5 -right-1.5 bg-background border border-white/20 rounded-full p-0.5 hover:bg-red-500/20 transition"
            >
              <X size={12} weight="bold" className="text-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/8 flex-shrink-0">
        {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
        <div className="flex gap-2 items-end">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-muted-foreground hover:text-primary transition p-2.5 rounded-xl hover:bg-white/5 flex-shrink-0"
            title="Прикрепить фото"
          >
            <ImageSquare size={20} weight="light" />
          </button>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Написать сообщение… (Enter — отправить)"
            rows={2}
            className="flex-1 bg-secondary/40 border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary/50 transition resize-none"
          />
          <button
            onClick={send}
            disabled={(!text.trim() && !pendingImage) || sending}
            className="gradient-purple text-white p-2.5 rounded-xl hover:opacity-90 transition disabled:opacity-40 flex-shrink-0"
          >
            <PaperPlaneTilt size={18} weight="light" />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 px-1">Enter — отправить · Shift+Enter — перенос строки</p>
      </div>
    </div>
  );
}
