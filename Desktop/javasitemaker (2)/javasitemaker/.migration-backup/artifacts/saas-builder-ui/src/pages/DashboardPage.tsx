import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { sitesApi, authApi, PLAN_LIMITS, type Site, type Block, type GlobalSeoSettings, type FormSubmission } from "@/lib/api";
import AppHeader from "@/components/AppHeader";
import InfoTooltip from "@/components/Tooltip";
import { useAuthStore } from "@/lib/store";
import {
  Binoculars, UsersThree, HandPointing, UserCirclePlus, Hourglass, TrendDown,
  MegaphoneSimple, Storefront, Headphones, Heartbeat,
  HardDrives, Crown, PaperPlaneRight, GlobeSimple, MagnifyingGlass, Gear, X, Tray, ShoppingCart,
} from "@phosphor-icons/react";

const BUSINESS_TYPES = [
  { value: "LANDING", label: "Лендинг", Icon: MegaphoneSimple, desc: "Продающая страница" },
  { value: "ECOMMERCE", label: "Интернет-магазин", Icon: Storefront, desc: "Продажа товаров" },
  { value: "MUSIC_LABEL", label: "Музыкальный лейбл", Icon: Headphones, desc: "Для артистов" },
  { value: "FITNESS", label: "Фитнес", Icon: Heartbeat, desc: "Спорт и здоровье" },
];

/** Возвращает true если сайт содержит форму обратной связи */
function siteHasForms(site: Site): boolean {
  return (site.blocks ?? []).some(block => {
    if (block.type === "FORM" || block.type === "CONTACTS") return true;
    if (block.type === "ZERO_BLOCK") {
      try {
        const data = JSON.parse(block.content || "{}");
        const els: any[] = data.zeroElements ?? data.elements ?? [];
        return els.some((el: any) => el.type === "form");
      } catch { return false; }
    }
    return false;
  });
}

/** Возвращает true если сайт содержит блок товаров / магазина */
function siteHasProducts(site: Site): boolean {
  return (site.blocks ?? []).some(block => {
    if (block.type === "PRODUCTS" || block.type === "ECOMMERCE") return true;
    if (block.type === "ZERO_BLOCK") {
      try {
        const data = JSON.parse(block.content || "{}");
        const els: any[] = data.zeroElements ?? data.elements ?? [];
        return els.some((el: any) =>
          el.type === "form" &&
          (el.content?.formTitle?.toLowerCase().includes("заказ") ||
           el.content?.formTitle?.toLowerCase().includes("товар") ||
           el.content?.formTitle?.toLowerCase().includes("shop") ||
           el.content?.formTitle?.toLowerCase().includes("order"))
        );
      } catch { return false; }
    }
    return false;
  });
}

const PERIOD_OPTIONS = [
  { value: "7d", label: "7 дней" },
  { value: "30d", label: "30 дней" },
  { value: "90d", label: "90 дней" },
];

function fmtTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function DashboardPage() {
  const [, nav] = useLocation();
  const [showCreate, setShowCreate] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [newSite, setNewSite] = useState({ name: "", subdomain: "", businessType: "LANDING" });
  const [createError, setCreateError] = useState("");
  const [period, setPeriod] = useState("7d");
  const qc = useQueryClient();
  const { user } = useAuthStore();

  // Per-site SEO modal
  const [seoSite, setSeoSite] = useState<Site | null>(null);
  const [siteSeoForm, setSiteSeoForm] = useState({ seoTitle: "", seoDesc: "", seoKeywords: "", favicon: "", ogImage: "" });
  const [siteSeoSaving, setSiteSeoSaving] = useState(false);

  // Global SEO modal
  const [showGlobalSeo, setShowGlobalSeo] = useState(false);
  const [globalSeoForm, setGlobalSeoForm] = useState<GlobalSeoSettings>({});
  const [globalSeoSaving, setGlobalSeoSaving] = useState(false);
  const [globalSeoSaved, setGlobalSeoSaved] = useState(false);

  // Form submissions modal
  const [submissionsSite, setSubmissionsSite] = useState<Site | null>(null);
  const { data: submissions = [], isLoading: submissionsLoading } = useQuery({
    queryKey: ["formSubmissions", submissionsSite?.id],
    queryFn: () => sitesApi.getFormSubmissions(submissionsSite!.id),
    enabled: !!submissionsSite,
  });

  // Orders modal (filtered from form submissions)
  const [ordersSite, setOrdersSite] = useState<Site | null>(null);
  const { data: allOrderSubmissions = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["formSubmissions", ordersSite?.id],
    queryFn: () => sitesApi.getFormSubmissions(ordersSite!.id),
    enabled: !!ordersSite,
  });
  const orders = (allOrderSubmissions as FormSubmission[]).filter(s => s.formTitle === "Заказ товаров");

  const { data: sites = [], isLoading: sitesLoading } = useQuery({ queryKey: ["sites"], queryFn: sitesApi.list, enabled: !!user });
  const { data: stats } = useQuery({ queryKey: ["allStats", period], queryFn: () => sitesApi.allStats(period), enabled: !!user });
  const { data: globalSeoData } = useQuery({ queryKey: ["globalSeo"], queryFn: authApi.getSeoSettings, enabled: !!user });

  const createMutation = useMutation({
    mutationFn: sitesApi.create,
    onSuccess: (site) => { qc.invalidateQueries({ queryKey: ["sites"] }); setShowCreate(false); nav(`/builder/${site.id}`); },
    onError: (e: any) => setCreateError(e.response?.data?.message || "Ошибка создания"),
  });

  const deleteMutation = useMutation({
    mutationFn: sitesApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sites"] }),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSite.name.trim()) { setCreateError("Введите название"); return; }
    setCreateError("");
    createMutation.mutate(newSite);
  };

  const planLimits = PLAN_LIMITS[user?.plan || "free"];
  const atSiteLimit = sites.length >= planLimits.sites;

  const handleOpenCreate = () => {
    if (atSiteLimit) { setShowUpgrade(true); return; }
    setShowCreate(true);
    setCreateError("");
    setNewSite({ name: "", subdomain: "", businessType: "LANDING" });
  };

  // Open per-site SEO modal
  const openSiteSeo = (e: React.MouseEvent, site: Site) => {
    e.stopPropagation();
    const gs = (() => { try { return JSON.parse(site.globalStyles || "{}"); } catch { return {}; } })();
    setSiteSeoForm({
      seoTitle: gs.seoTitle || "",
      seoDesc: gs.seoDesc || "",
      seoKeywords: gs.seoKeywords || "",
      favicon: gs.favicon || "",
      ogImage: gs.ogImage || "",
    });
    setSeoSite(site);
  };

  const saveSiteSeo = async () => {
    if (!seoSite) return;
    setSiteSeoSaving(true);
    try {
      const gs = (() => { try { return JSON.parse(seoSite.globalStyles || "{}"); } catch { return {}; } })();
      const updated = { ...gs, ...siteSeoForm };
      await sitesApi.updateStyles(seoSite.id, JSON.stringify(updated));
      qc.invalidateQueries({ queryKey: ["sites"] });
      setSeoSite(null);
    } finally { setSiteSeoSaving(false); }
  };

  // Open global SEO modal
  const openGlobalSeo = () => {
    setGlobalSeoForm(globalSeoData || {});
    setGlobalSeoSaved(false);
    setShowGlobalSeo(true);
  };

  const saveGlobalSeo = async () => {
    setGlobalSeoSaving(true);
    try {
      await authApi.updateSeoSettings(globalSeoForm);
      qc.invalidateQueries({ queryKey: ["globalSeo"] });
      setGlobalSeoSaved(true);
      setTimeout(() => setGlobalSeoSaved(false), 2000);
    } finally { setGlobalSeoSaving(false); }
  };

  const METRIC_CARDS = [
    {
      label: "Просмотры", value: stats?.views?.toLocaleString() ?? "—", Icon: Binoculars, color: "from-purple-500/15 to-indigo-500/5",
      tooltip: "Общее количество загрузок страниц за выбранный период. Один пользователь может создать несколько просмотров.",
    },
    {
      label: "Уникальные посетители", value: stats?.uniqueVisitors?.toLocaleString() ?? "—", Icon: UsersThree, color: "from-blue-500/15 to-cyan-500/5",
      tooltip: "Количество отдельных пользователей, которые посетили ваш сайт. Определяется по IP + user-agent.",
    },
    {
      label: "Клики", value: stats?.clicks?.toLocaleString() ?? "—", Icon: HandPointing, color: "from-pink-500/15 to-rose-500/5",
      tooltip: "Количество кликов по кнопкам и ссылкам на ваших сайтах.",
    },
    {
      label: "Новые регистрации", value: stats?.newRegistrations?.toLocaleString() ?? "—", Icon: UserCirclePlus, color: "from-green-500/15 to-emerald-500/5",
      tooltip: "Пользователи, которые зарегистрировались через форму на вашем сайте за выбранный период.",
    },
    {
      label: "Среднее время на сайте", value: stats ? fmtTime(stats.avgSessionSec) : "—", Icon: Hourglass, color: "from-amber-500/15 to-yellow-500/5",
      tooltip: "Среднее время сессии по всем посетителям в минутах:секундах.",
    },
    {
      label: "Процент отказов", value: stats ? `${stats.bounceRate}%` : "—", Icon: TrendDown, color: "from-red-500/15 to-orange-500/5",
      tooltip: "Процент посетителей, которые покинули сайт после просмотра одной страницы. Чем ниже — тем лучше.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Analytics header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-foreground">Аналитика</h2>
            <p className="text-muted-foreground text-sm mt-0.5">Агрегированные данные по всем вашим сайтам</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={openGlobalSeo}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/8 bg-secondary/40 hover:bg-secondary/70 text-sm font-medium text-foreground transition">
              <Gear size={16} weight="light" />
              Глобальный SEO
            </button>
            <div className="flex gap-1 bg-secondary/50 border border-border rounded-xl p-1">
              {PERIOD_OPTIONS.map((p) => (
                <button key={p.value} onClick={() => setPeriod(p.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${period === p.value ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
          {METRIC_CARDS.map((m, i) => (
            <motion.div key={m.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`glass rounded-xl p-4 bg-gradient-to-br ${m.color} border border-white/6`}>
              <div className="flex items-center gap-1.5 mb-2">
                <m.Icon size={18} weight="light" className="text-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground truncate flex-1">{m.label}</span>
                <InfoTooltip content={m.tooltip} />
              </div>
              <p className="text-2xl font-black text-foreground">{m.value}</p>
            </motion.div>
          ))}
        </div>

        {/* DB state bar */}
        {stats && (
          <div className="glass border border-white/6 rounded-xl p-4 mb-6 flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-2 flex-shrink-0">
              <HardDrives size={20} weight="light" className="text-foreground" />
              <span className="text-sm font-semibold text-foreground">Дамп памяти</span>
              <InfoTooltip content="Отображает использование выделенного пространства для дампа памяти пользователя на вашем тарифе. При превышении лимита новые данные не будут записываться." />
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>{stats.dbUsedMb} МБ использовано</span>
                <span>из {stats.dbTotalMb} МБ</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full gradient-purple rounded-full transition-all" style={{ width: `${(stats.dbUsedMb / stats.dbTotalMb) * 100}%` }} />
              </div>
            </div>
            <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full flex-shrink-0">
              ✓ {Math.round(100 - (stats.dbUsedMb / stats.dbTotalMb) * 100)}% свободно
            </span>
          </div>
        )}

        {/* Chart */}
        {stats && (
          <div className="glass border border-white/6 rounded-xl p-5 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-foreground font-bold">Динамика за {PERIOD_OPTIONS.find(p => p.value === period)?.label}</h3>
              <InfoTooltip content="График показывает тренды просмотров, кликов и уникальных посетителей по дням за выбранный период." />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={stats.chartData} margin={{ top: 5, right: 5, bottom: 0, left: -30 }}>
                <defs>
                  {[["views", "#7C3AED"], ["clicks", "#EC4899"], ["visitors", "#3B82F6"]].map(([k, c]) => (
                    <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={c} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={c} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "var(--color-card,#0f0f1a)", border: "1px solid var(--color-border,rgba(255,255,255,0.08))", borderRadius: 10, fontSize: 12, color: "var(--color-foreground,#fff)" }} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                <Area type="monotone" dataKey="views" stroke="#7C3AED" fill="url(#grad-views)" strokeWidth={2} name="Просмотры" />
                <Area type="monotone" dataKey="clicks" stroke="#EC4899" fill="url(#grad-clicks)" strokeWidth={2} name="Клики" />
                <Area type="monotone" dataKey="visitors" stroke="#3B82F6" fill="url(#grad-visitors)" strokeWidth={2} name="Посетители" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Sites header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-2xl font-black text-foreground">Мои сайты</h2>
            <p className="text-muted-foreground text-sm">{sites.length} сайтов · {sites.filter((s: Site) => s.status === "PUBLISHED").length} опубликованных</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleOpenCreate}
              className={`font-bold px-5 py-2.5 rounded-xl transition shadow-lg flex items-center gap-2 text-sm ${atSiteLimit ? "bg-amber-500/15 text-amber-400 border border-amber-500/25 hover:bg-amber-500/25" : "gradient-purple text-white shadow-purple-500/20 hover:opacity-90"}`}>
              <span className="text-base">+</span> Новый сайт
            </button>
          </div>
        </div>

        {/* Sites grid */}
        {sitesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="glass rounded-xl h-40 animate-pulse" />)}
          </div>
        ) : sites.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="glass border border-white/6 rounded-2xl p-16 text-center">
            <div className="flex justify-center mb-4">
              <PaperPlaneRight size={52} weight="light" className="text-foreground" />
            </div>
            <p className="text-foreground font-bold text-xl mb-2">Создайте первый сайт</p>
            <p className="text-muted-foreground">Нажмите «Новый сайт» и начните прямо сейчас</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {sites.map((site: Site, i: number) => {
                const bt = BUSINESS_TYPES.find(b => b.value === site.businessType);
                const BtIcon = bt?.Icon || GlobeSimple;
                const gs = (() => { try { return JSON.parse(site.globalStyles || "{}"); } catch { return {}; } })();
                const hasSeo = !!(gs.seoTitle || gs.seoDesc);
                const hasForms = siteHasForms(site);
                const hasProducts = siteHasProducts(site);
                return (
                  <motion.div key={site.id}
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.05 }}
                    className="glass border border-white/6 rounded-xl p-5 cursor-pointer hover:border-primary/30 transition-all group focus:outline-none"
                    onClick={() => nav(`/builder/${site.id}`)}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="gradient-purple w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <BtIcon size={20} weight="light" className="text-white" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${site.status === "PUBLISHED" ? "bg-green-500/15 text-green-400" : "bg-amber-500/15 text-amber-400"}`}>
                          {site.status === "PUBLISHED" ? "Опубликован" : "Черновик"}
                        </span>
                        <button onClick={(e) => { e.stopPropagation(); if (confirm("Удалить сайт?")) deleteMutation.mutate(site.id); }}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition text-xl leading-none focus:outline-none">×</button>
                      </div>
                    </div>
                    <h3 className="text-foreground font-bold mb-1 truncate">{site.name}</h3>
                    {site.subdomain && (
                      <p className="text-xs text-primary/70 font-mono truncate mb-1">{site.subdomain}</p>
                    )}
                    <p className="text-muted-foreground text-xs">{bt?.label}</p>
                    {gs.seoTitle && (
                      <p className="text-xs text-muted-foreground/60 truncate mt-1 italic">«{gs.seoTitle}»</p>
                    )}
                    <div className="mt-3 pt-3 border-t border-white/6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-muted-foreground text-xs">{site.blocks?.length ?? 0} блоков</span>
                        <span className="text-primary text-xs font-medium opacity-0 group-hover:opacity-100 transition">Открыть →</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {hasForms && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setSubmissionsSite(site); }}
                            className="flex-1 flex items-center justify-center gap-1.5 text-xs px-2 py-1.5 rounded-lg font-medium border bg-white/5 text-muted-foreground border-white/10 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition focus:outline-none"
                            title="Заявки с форм">
                            <Tray size={12} weight="bold" />
                            Заявки
                          </button>
                        )}
                        {hasProducts && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setOrdersSite(site); }}
                            className="flex-1 flex items-center justify-center gap-1.5 text-xs px-2 py-1.5 rounded-lg font-medium border bg-amber-500/8 text-amber-400 border-amber-500/20 hover:bg-amber-500/15 transition focus:outline-none"
                            title="Заказы из магазина">
                            <ShoppingCart size={12} weight="bold" />
                            Заказы
                          </button>
                        )}
                        <button
                          onClick={(e) => openSiteSeo(e, site)}
                          className={`flex-1 flex items-center justify-center gap-1.5 text-xs px-2 py-1.5 rounded-lg font-medium border transition focus:outline-none ${hasSeo ? "bg-green-500/10 text-green-400 border-green-500/25 hover:bg-green-500/20" : "bg-white/5 text-muted-foreground border-white/10 hover:bg-primary/10 hover:text-primary hover:border-primary/30"}`}
                          title="Настройки SEO">
                          <MagnifyingGlass size={12} weight="bold" />
                          {hasSeo ? "SEO ✓" : "SEO"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Form Submissions Modal ── */}
      <AnimatePresence>
        {submissionsSite && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setSubmissionsSite(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass border border-white/8 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[80vh]">
              {/* Header */}
              <div className="flex items-center gap-3 p-6 border-b border-white/8 flex-shrink-0">
                <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                  <Tray size={18} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-foreground font-black text-lg leading-tight">Заявки — {submissionsSite.name}</h3>
                  <p className="text-muted-foreground text-xs">Заявки с форм обратной связи</p>
                </div>
                <button onClick={() => setSubmissionsSite(null)} className="ml-auto text-muted-foreground hover:text-foreground transition p-1">
                  <X size={20} />
                </button>
              </div>
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {submissionsLoading ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />)}
                  </div>
                ) : (submissions as FormSubmission[]).length === 0 ? (
                  <div className="text-center py-16">
                    <Tray size={48} weight="light" className="mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground font-semibold">Заявок пока нет</p>
                    <p className="text-muted-foreground/60 text-sm mt-1">Как только кто-то заполнит форму на сайте, заявки появятся здесь</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(submissions as FormSubmission[]).map((sub) => {
                      const data = (() => { try { return JSON.parse(sub.data); } catch { return sub.data; } })();
                      return (
                        <div key={sub.id} className="bg-white/4 border border-white/8 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-foreground">{sub.formTitle || "Заявка"}</span>
                            <span className="text-xs text-muted-foreground">{new Date(sub.createdAt).toLocaleString("ru-RU", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          <div className="space-y-1.5">
                            {typeof data === "object" && data !== null
                              ? Object.entries(data).map(([key, val]) => (
                                  <div key={key} className="flex gap-2 text-sm">
                                    <span className="text-muted-foreground min-w-[100px] flex-shrink-0">{key}:</span>
                                    <span className="text-foreground/80 break-all">{String(val)}</span>
                                  </div>
                                ))
                              : <p className="text-sm text-foreground/80">{String(data)}</p>
                            }
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {/* Footer */}
              {!submissionsLoading && (submissions as FormSubmission[]).length > 0 && (
                <div className="border-t border-white/8 px-6 py-3 flex-shrink-0">
                  <p className="text-xs text-muted-foreground">Всего заявок: {(submissions as FormSubmission[]).length}</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Orders Modal ── */}
      <AnimatePresence>
        {ordersSite && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setOrdersSite(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass border border-white/8 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="flex items-center gap-3 p-6 border-b border-white/8 flex-shrink-0">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
                  <ShoppingCart size={18} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="text-foreground font-black text-lg leading-tight">Заказы — {ordersSite.name}</h3>
                  <p className="text-muted-foreground text-xs">Заказы из интернет-магазина</p>
                </div>
                <button onClick={() => setOrdersSite(null)} className="ml-auto text-muted-foreground hover:text-foreground transition p-1">
                  <X size={20} />
                </button>
              </div>
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {ordersLoading ? (
                  <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />)}</div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-16">
                    <ShoppingCart size={48} weight="light" className="mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground font-semibold">Заказов пока нет</p>
                    <p className="text-muted-foreground/60 text-sm mt-1">Как только посетители оформят заказы, они появятся здесь</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => {
                      const data = (() => { try { return JSON.parse(order.data); } catch { return {}; } })();
                      const orderNum = data["№ заказа"] || "—";
                      const name = data["Имя"] || "—";
                      const phone = data["Телефон"] || "";
                      const total = data["Итого"] || "";
                      const delivery = data["Доставка"] || "";
                      const payment = data["Оплата"] || "";
                      const items = data["Состав заказа"] || data["Заказ"] || "";
                      return (
                        <div key={order.id} className="bg-white/4 border border-white/8 rounded-xl p-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-mono font-bold text-amber-400">{orderNum}</span>
                                {delivery && <span className="text-xs bg-white/8 text-white/50 px-2 py-0.5 rounded-full">{delivery}</span>}
                                {payment && <span className="text-xs bg-white/8 text-white/50 px-2 py-0.5 rounded-full">{payment}</span>}
                              </div>
                              <p className="text-foreground font-semibold text-sm">{name}</p>
                              {phone && <p className="text-muted-foreground text-xs mt-0.5">{phone}</p>}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-amber-400 font-bold text-base">{total}</p>
                              <p className="text-muted-foreground/60 text-xs mt-0.5">
                                {new Date(order.createdAt).toLocaleString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                          {items && (
                            <div className="border-t border-white/8 pt-3">
                              <p className="text-xs text-muted-foreground/60 mb-1.5">Состав заказа</p>
                              {items.split("\n").filter(Boolean).map((line: string, i: number) => (
                                <p key={i} className="text-xs text-foreground/70 py-0.5">{line}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {!ordersLoading && orders.length > 0 && (
                <div className="border-t border-white/8 px-6 py-3 flex-shrink-0 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Всего заказов: {orders.length}</p>
                  <p className="text-xs text-amber-400 font-semibold">
                    Итого: {orders.reduce((sum, o) => {
                      const d = (() => { try { return JSON.parse(o.data); } catch { return {}; } })();
                      const n = parseFloat((d["Итого"] || "0").replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
                      return sum + n;
                    }, 0).toLocaleString("ru-RU")} {(() => {
                      const d = (() => { try { return JSON.parse(orders[0]?.data || "{}"); } catch { return {}; } })();
                      const m = (d["Итого"] || "").match(/[₽$€£₸₴]/);
                      return m ? m[0] : "₽";
                    })()}
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Per-site SEO Modal ── */}
      <AnimatePresence>
        {seoSite && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setSeoSite(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass border border-white/8 rounded-2xl p-7 w-full max-w-lg shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                  <MagnifyingGlass size={18} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-foreground font-black text-lg leading-tight">SEO — {seoSite.name}</h3>
                  <p className="text-muted-foreground text-xs">Мета-данные для поисковых систем</p>
                </div>
                <button onClick={() => setSeoSite(null)} className="ml-auto text-muted-foreground hover:text-foreground transition p-1">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1 font-medium">
                    Мета-заголовок
                    <InfoTooltip content="Отображается во вкладке браузера и в результатах поиска Google. Рекомендуется 50–60 символов." />
                  </label>
                  <input value={siteSeoForm.seoTitle} onChange={e => setSiteSeoForm(f => ({ ...f, seoTitle: e.target.value }))}
                    className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
                    placeholder="Лучший сайт для вашего бизнеса" maxLength={70} />
                  <p className="text-xs text-muted-foreground/60 mt-1">{siteSeoForm.seoTitle.length}/70 символов</p>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1 font-medium">
                    Мета-описание
                    <InfoTooltip content="Краткое описание страницы под заголовком в поиске. Рекомендуется 120–160 символов." />
                  </label>
                  <textarea value={siteSeoForm.seoDesc} onChange={e => setSiteSeoForm(f => ({ ...f, seoDesc: e.target.value }))}
                    className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition resize-none"
                    placeholder="Создайте профессиональный сайт за минуты без кода..." rows={3} maxLength={180} />
                  <p className="text-xs text-muted-foreground/60 mt-1">{siteSeoForm.seoDesc.length}/180 символов</p>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1 font-medium">
                    Ключевые слова
                    <InfoTooltip content="Через запятую. Современные поисковики уделяют им меньше внимания, но они полезны для систематизации." />
                  </label>
                  <input value={siteSeoForm.seoKeywords} onChange={e => setSiteSeoForm(f => ({ ...f, seoKeywords: e.target.value }))}
                    className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
                    placeholder="сайт, конструктор, лендинг, бизнес" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1 font-medium">
                      Favicon (URL)
                      <InfoTooltip content="Иконка во вкладке браузера. Укажите прямую ссылку на изображение (png, ico)." />
                    </label>
                    <input value={siteSeoForm.favicon} onChange={e => setSiteSeoForm(f => ({ ...f, favicon: e.target.value }))}
                      className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary/50 transition"
                      placeholder="https://example.com/icon.png" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1 font-medium">
                      OG-изображение
                      <InfoTooltip content="Картинка при шаринге в соцсетях (og:image). Рекомендуемый размер 1200×630 px." />
                    </label>
                    <input value={siteSeoForm.ogImage} onChange={e => setSiteSeoForm(f => ({ ...f, ogImage: e.target.value }))}
                      className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary/50 transition"
                      placeholder="https://example.com/og.jpg" />
                  </div>
                </div>

                {/* Preview snippet */}
                {(siteSeoForm.seoTitle || siteSeoForm.seoDesc) && (
                  <div className="rounded-xl bg-white/3 border border-white/6 p-4">
                    <p className="text-xs text-muted-foreground mb-2 font-medium">Превью в Google</p>
                    <p className="text-blue-400 text-sm font-medium truncate">{siteSeoForm.seoTitle || seoSite.name}</p>
                    <p className="text-green-500/70 text-xs mb-1">{seoSite.subdomain || "example"}.lilluucore.com</p>
                    <p className="text-muted-foreground text-xs line-clamp-2">{siteSeoForm.seoDesc || "Описание не задано"}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setSeoSite(null)}
                  className="flex-1 bg-secondary/60 text-foreground font-medium py-3 rounded-xl hover:bg-secondary transition text-sm">
                  Отмена
                </button>
                <button onClick={saveSiteSeo} disabled={siteSeoSaving}
                  className="flex-1 gradient-purple text-white font-bold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50 text-sm">
                  {siteSeoSaving ? "Сохраняю..." : "Сохранить SEO"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Global SEO Modal ── */}
      <AnimatePresence>
        {showGlobalSeo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowGlobalSeo(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass border border-white/8 rounded-2xl p-7 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                  <Gear size={18} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-foreground font-black text-lg leading-tight">Глобальный SEO</h3>
                  <p className="text-muted-foreground text-xs">Настройки аналитики и поисковой оптимизации для всех ваших сайтов</p>
                </div>
                <button onClick={() => setShowGlobalSeo(false)} className="ml-auto text-muted-foreground hover:text-foreground transition p-1">
                  <X size={20} />
                </button>
              </div>

              {/* Analytics section */}
              <div className="mb-6">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-3">Аналитика</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1 font-medium">
                      Google Tag Manager ID
                      <InfoTooltip content="Идентификатор GTM-контейнера (GTM-XXXXXXX). Скрипт GTM будет вставлен на все ваши опубликованные сайты." />
                    </label>
                    <input value={globalSeoForm.gtmId || ""} onChange={e => setGlobalSeoForm(f => ({ ...f, gtmId: e.target.value }))}
                      className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-2.5 text-foreground text-sm font-mono focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
                      placeholder="GTM-XXXXXXX" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1 font-medium">
                      Google Analytics 4 (Measurement ID)
                      <InfoTooltip content="ID вашего потока данных GA4 (G-XXXXXXXXXX). Если указан GTM — используйте его; этот параметр добавляет gtag напрямую." />
                    </label>
                    <input value={globalSeoForm.ga4Id || ""} onChange={e => setGlobalSeoForm(f => ({ ...f, ga4Id: e.target.value }))}
                      className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-2.5 text-foreground text-sm font-mono focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
                      placeholder="G-XXXXXXXXXX" />
                  </div>
                </div>
              </div>

              {/* Defaults section */}
              <div className="mb-6">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-3">Мета-данные по умолчанию</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1 font-medium">
                      Автор сайтов
                      <InfoTooltip content='Заполняет тег &lt;meta name="author"&gt; для всех ваших сайтов.' />
                    </label>
                    <input value={globalSeoForm.defaultAuthor || ""} onChange={e => setGlobalSeoForm(f => ({ ...f, defaultAuthor: e.target.value }))}
                      className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
                      placeholder="Моя Компания" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1 font-medium">
                      OG-изображение по умолчанию
                      <InfoTooltip content="Используется как og:image если у конкретного сайта не задано своё. Рекомендуемый размер 1200×630 px." />
                    </label>
                    <input value={globalSeoForm.defaultOgImage || ""} onChange={e => setGlobalSeoForm(f => ({ ...f, defaultOgImage: e.target.value }))}
                      className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
                      placeholder="https://example.com/og-default.jpg" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 font-medium">
                      Индексация роботами (robots)
                    </label>
                    <div className="flex gap-2">
                      {(["index", "noindex"] as const).map(v => (
                        <button key={v} type="button" onClick={() => setGlobalSeoForm(f => ({ ...f, robotsPolicy: v }))}
                          className={`flex-1 py-2 rounded-xl border text-sm font-medium transition ${globalSeoForm.robotsPolicy === v || (!globalSeoForm.robotsPolicy && v === "index") ? "border-primary/60 bg-primary/10 text-foreground" : "border-white/8 bg-secondary/30 text-muted-foreground hover:border-white/15"}`}>
                          {v === "index" ? "✓ Разрешить индексацию" : "✗ Запретить (noindex)"}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground/60 mt-1.5">«Запретить» скроет все ваши сайты из результатов поиска.</p>
                  </div>
                </div>
              </div>

              {/* Organization / JSON-LD */}
              <div className="mb-6">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-3">Структурированные данные (JSON-LD)</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1 font-medium">
                      Название организации
                      <InfoTooltip content="Используется в JSON-LD разметке Organization для улучшения отображения в поиске." />
                    </label>
                    <input value={globalSeoForm.organizationName || ""} onChange={e => setGlobalSeoForm(f => ({ ...f, organizationName: e.target.value }))}
                      className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
                      placeholder="ООО «Рога и Копыта»" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1 font-medium">
                      Логотип организации (URL)
                      <InfoTooltip content="Изображение логотипа для JSON-LD разметки. Рекомендуется PNG 600×60 px минимум." />
                    </label>
                    <input value={globalSeoForm.organizationLogo || ""} onChange={e => setGlobalSeoForm(f => ({ ...f, organizationLogo: e.target.value }))}
                      className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
                      placeholder="https://example.com/logo.png" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowGlobalSeo(false)}
                  className="flex-1 bg-secondary/60 text-foreground font-medium py-3 rounded-xl hover:bg-secondary transition text-sm">
                  Отмена
                </button>
                <button onClick={saveGlobalSeo} disabled={globalSeoSaving}
                  className="flex-1 gradient-purple text-white font-bold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50 text-sm flex items-center justify-center gap-2">
                  {globalSeoSaving ? "Сохраняю..." : globalSeoSaved ? "✓ Сохранено!" : "Сохранить настройки"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass border border-white/8 rounded-2xl p-7 w-full max-w-lg shadow-2xl">
              <h3 className="text-foreground font-black text-2xl mb-1">Новый сайт</h3>
              <p className="text-muted-foreground text-sm mb-6">Выберите тип и введите название</p>
              <form onSubmit={handleCreate} className="space-y-5">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Название сайта</label>
                  <input className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
                    placeholder="Мой крутой сайт" value={newSite.name} onChange={(e) => setNewSite(n => ({ ...n, name: e.target.value }))} autoFocus />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1 font-medium">
                    Субдомен
                    <InfoTooltip content="Ваш сайт будет доступен по адресу [субдомен].lilluucore.com. Используйте только латиницу, цифры и дефис." />
                  </label>
                  <div className="flex items-center">
                    <input className="flex-1 bg-secondary/40 border border-border border-r-0 rounded-l-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary/50 transition"
                      placeholder="my-site" value={newSite.subdomain} onChange={(e) => setNewSite(n => ({ ...n, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))} />
                    <span className="bg-secondary/80 border border-border rounded-r-xl px-3 py-3 text-muted-foreground text-sm font-mono">.lilluucore.com</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block font-medium">Тип бизнеса</label>
                  <div className="grid grid-cols-2 gap-2">
                    {BUSINESS_TYPES.map((bt) => (
                      <button key={bt.value} type="button" onClick={() => setNewSite(n => ({ ...n, businessType: bt.value }))}
                        className={`p-3 rounded-xl border text-left transition-all ${newSite.businessType === bt.value ? "border-primary/60 bg-primary/10" : "border-white/8 bg-secondary/30 hover:border-white/15"}`}>
                        <div className="mb-1.5">
                          <bt.Icon size={24} weight="light" className="text-foreground" />
                        </div>
                        <div className="text-foreground text-sm font-semibold">{bt.label}</div>
                        <div className="text-muted-foreground text-xs">{bt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                {createError && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 text-red-400 text-sm">{createError}</div>}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowCreate(false)} className="flex-1 bg-secondary/60 text-foreground font-medium py-3 rounded-xl hover:bg-secondary transition text-sm">Отмена</button>
                  <button type="submit" disabled={createMutation.isPending} className="flex-1 gradient-purple text-white font-bold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50 text-sm">
                    {createMutation.isPending ? "Создаю..." : "Создать и открыть →"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upgrade modal */}
      <AnimatePresence>
        {showUpgrade && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowUpgrade(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass border border-amber-500/25 rounded-2xl p-7 w-full max-w-md shadow-2xl text-center">
              <div className="flex justify-center mb-4">
                <Crown size={48} weight="light" className="text-foreground" />
              </div>
              <h3 className="text-foreground font-black text-2xl mb-2">Лимит тарифа Free</h3>
              <p className="text-muted-foreground mb-2">
                На тарифе <span className="text-amber-400 font-bold">Free</span> доступен только <span className="text-foreground font-bold">1 сайт</span>.
              </p>
              <p className="text-muted-foreground text-sm mb-6">
                Перейдите на Pro или Business чтобы создавать до 10 и более сайтов.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowUpgrade(false)} className="flex-1 border border-white/8 rounded-xl py-3 text-sm text-muted-foreground hover:bg-white/5 transition">
                  Закрыть
                </button>
                <button onClick={() => { setShowUpgrade(false); nav("/pricing"); }}
                  className="flex-1 gradient-purple text-white font-bold py-3 rounded-xl hover:opacity-90 transition shadow-lg">
                  Улучшить тариф →
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
