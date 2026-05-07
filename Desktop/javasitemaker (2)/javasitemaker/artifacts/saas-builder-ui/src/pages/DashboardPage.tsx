import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { sitesApi, authApi, PLAN_LIMITS, analyzeScreenshot, analyzeFromWebsiteUrl, type Site, type Block, type GlobalSeoSettings, type FormSubmission, type AiScreenshotResult } from "@/lib/api";
import AppHeader from "@/components/AppHeader";
import InfoTooltip from "@/components/Tooltip";
import { useAuthStore } from "@/lib/store";
import {
  Binoculars, UsersThree, HandPointing, UserCirclePlus, Hourglass, TrendDown,
  MegaphoneSimple, Storefront, Headphones, Heartbeat,
  HardDrives, Crown, PaperPlaneRight, GlobeSimple, MagnifyingGlass, Gear, X, Tray, ShoppingCart,
  Sparkle, UploadSimple, ImageSquare, DotsSixVertical, LinkSimple, DownloadSimple, FileCsv, BracketsCurly, CaretDown, FilePdf, MicrosoftWordLogo,
} from "@phosphor-icons/react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, useSortable,
  verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type AiBlock = { id: string; type: string; content: any; styles: any };

function SortableAiBlockRow({
  block, index, onRemove, disabled,
}: { block: AiBlock; index: number; onRemove: () => void; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style}
      className="flex items-center gap-2.5 bg-secondary/40 border border-white/6 rounded-xl px-3 py-2 select-none">
      <button
        type="button"
        {...attributes} {...listeners}
        disabled={disabled}
        className="text-muted-foreground/40 hover:text-muted-foreground transition cursor-grab active:cursor-grabbing flex-shrink-0 disabled:cursor-default">
        <DotsSixVertical size={16} />
      </button>
      <span className="w-5 h-5 rounded-md bg-primary/15 flex items-center justify-center text-primary text-[10px] font-bold flex-shrink-0">
        {index + 1}
      </span>
      <span className="text-foreground text-sm font-medium flex-1 truncate">
        {AI_BLOCK_LABELS[block.type] ?? block.type}
      </span>
      <span className="text-muted-foreground/40 text-[10px] font-mono uppercase mr-1">{block.type}</span>
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        className="w-5 h-5 rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-muted-foreground/50 flex items-center justify-center transition flex-shrink-0 disabled:opacity-30">
        <X size={10} weight="bold" />
      </button>
    </div>
  );
}

const BUSINESS_TYPES = [
  { value: "LANDING", label: "Лендинг", Icon: MegaphoneSimple, desc: "Продающая страница" },
  { value: "ECOMMERCE", label: "Интернет-магазин", Icon: Storefront, desc: "Продажа товаров" },
  { value: "MUSIC_LABEL", label: "Музыкальный лейбл", Icon: Headphones, desc: "Для артистов" },
  { value: "FITNESS", label: "Фитнес", Icon: Heartbeat, desc: "Спорт и здоровье" },
];

const AI_BLOCK_LABELS: Record<string, string> = {
  HERO: "Главный экран",
  HEADER_MENU: "Шапка / Меню",
  FOOTER: "Подвал",
  FEATURES: "Преимущества",
  PRICING: "Тарифы",
  CTA: "Призыв к действию",
  FAQ: "Вопросы и ответы",
  TESTIMONIALS: "Отзывы",
  STATS: "Статистика",
  TEAM: "Команда",
  CONTACTS: "Контакты",
  FORM: "Форма обратной связи",
  GALLERY: "Галерея",
  BLOG: "Блог",
  PRODUCTS: "Товары",
  VIDEO: "Видео",
  TEXT: "Текстовый блок",
  ZERO_BLOCK: "Zero-блок",
};

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
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();
  const { user } = useAuthStore();

  // AI screenshot generation
  const [showAI, setShowAI] = useState(false);
  const [aiMode, setAiMode] = useState<"file" | "url">("file");
  const [aiFile, setAiFile] = useState<File | null>(null);
  const [aiPreview, setAiPreview] = useState<string | null>(null);
  const [aiUrl, setAiUrl] = useState("");
  const [aiUrlThumb, setAiUrlThumb] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiProgress, setAiProgress] = useState("");
  const [aiDragOver, setAiDragOver] = useState(false);
  const aiFileInputRef = useRef<HTMLInputElement>(null);
  // Preview step after analysis
  const [aiResult, setAiResult] = useState<AiScreenshotResult | null>(null);
  const [aiStep, setAiStep] = useState<"upload" | "preview" | "creating">("upload");
  const [aiSuggestedName, setAiSuggestedName] = useState("");
  // Editable block list (user can reorder/remove)
  const [aiBlocks, setAiBlocks] = useState<AiBlock[]>([]);
  const aiDndSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const handleAiDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setAiBlocks(prev => {
        const oldIdx = prev.findIndex(b => b.id === active.id);
        const newIdx = prev.findIndex(b => b.id === over.id);
        if (oldIdx === -1 || newIdx === -1) return prev;
        return arrayMove(prev, oldIdx, newIdx);
      });
    }
  };

  const handleAIFileSelect = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setAiFile(null);
      setAiPreview(null);
      setAiError("Файл слишком большой. Максимальный размер — 10 МБ.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setAiFile(null);
      setAiPreview(null);
      setAiError("Поддерживаются только изображения: PNG, JPG, WebP.");
      return;
    }
    setAiFile(file);
    setAiError("");
    const reader = new FileReader();
    reader.onload = (e) => setAiPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  // Step 1: Analyse the screenshot or URL, show preview
  const handleAIAnalyze = async () => {
    if (aiMode === "file" && !aiFile) return;
    if (aiMode === "url" && !aiUrl.trim()) return;
    setAiLoading(true);
    setAiError("");
    setAiProgress(aiMode === "url" ? "Снимаю скриншот и анализирую дизайн... (30–90 сек)" : "Анализирую скриншот с помощью AI...");
    try {
      let result: AiScreenshotResult;
      if (aiMode === "url") {
        result = await analyzeFromWebsiteUrl(aiUrl.trim());
      } else {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const r = e.target?.result as string;
            resolve(r.split(",")[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(aiFile!);
        });
        result = await analyzeScreenshot(base64);
      }
      setAiResult(result);
      setAiSuggestedName(result.suggestedName || "AI сайт");
      setAiBlocks(result.blocks.map((b, i) => ({ ...b, id: `ai-block-${i}-${b.type}` })));
      setAiStep("preview");
    } catch (e: any) {
      setAiError(e.response?.data?.message || e.message || "Ошибка AI генерации");
    } finally {
      setAiLoading(false);
      setAiProgress("");
    }
  };

  // Step 2: Actually create the site with confirmed data
  const handleAICreate = async () => {
    if (!aiResult) return;
    setAiStep("creating");
    setAiLoading(true);
    setAiError("");
    setAiProgress(`Создаю сайт «${aiSuggestedName}»...`);
    try {
      const site = await sitesApi.create({
        name: aiSuggestedName || "AI сайт",
        businessType: aiResult.businessType || "LANDING",
      });

      setAiProgress("Удаляю шаблонные блоки...");
      for (const existingBlock of (site.blocks ?? [])) {
        await sitesApi.deleteBlock(site.id, existingBlock.id);
      }

      setAiProgress("Добавляю блоки...");
      for (let i = 0; i < aiBlocks.length; i++) {
        const b = aiBlocks[i];
        const block = await sitesApi.addBlock(site.id, { type: b.type, position: i });
        await sitesApi.updateBlock(site.id, block.id, {
          content: JSON.stringify(b.content || {}),
          styles: JSON.stringify(b.styles || {}),
        });
      }

      qc.invalidateQueries({ queryKey: ["sites"] });
      setShowAI(false);
      resetAI();
      nav(`/builder/${site.id}`);
    } catch (e: any) {
      setAiError(e.response?.data?.message || e.message || "Ошибка создания сайта");
      setAiStep("preview");
    } finally {
      setAiLoading(false);
      setAiProgress("");
    }
  };

  // Debounced thumbnail probe — after 800ms idle, try loading a thum.io
  // screenshot of the pasted website URL. Uses a `cancelled` flag so a stale
  // img.onload from a previous URL cannot overwrite state for a newer URL.
  useEffect(() => {
    if (aiMode !== "url" || !aiUrl.trim()) {
      setAiUrlThumb(null);
      return;
    }
    let cancelled = false;
    const probedUrl = aiUrl.trim();
    const timer = setTimeout(() => {
      // Use thum.io to capture a screenshot preview of the website
      const thumbSrc = `https://image.thum.io/get/width/1280/crop/900/${probedUrl}`;
      const img = new Image();
      img.onload = () => { if (!cancelled) setAiUrlThumb(thumbSrc); };
      img.onerror = () => {};
      img.src = thumbSrc;
    }, 800);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [aiUrl, aiMode]);

  const resetAI = () => {
    setAiMode("file");
    setAiFile(null);
    setAiPreview(null);
    setAiUrl("");
    setAiUrlThumb(null);
    setAiError("");
    setAiProgress("");
    setAiResult(null);
    setAiStep("upload");
    setAiSuggestedName("");
    setAiBlocks([]);
  };

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

  // Close export dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const periodLabel = PERIOD_OPTIONS.find(p => p.value === period)?.label ?? period;

  const exportCSV = () => {
    if (!stats) return;
    const now = new Date().toISOString().slice(0, 10);
    const avgMin = Math.floor(stats.avgSessionSec / 60);
    const avgSec = stats.avgSessionSec % 60;
    const avgFmt = `${avgMin}:${String(avgSec).padStart(2, "0")}`;
    // Proper CSV cell quoting: wrap in quotes if value contains comma, quote, or newline
    const q = (v: string | number) => {
      const s = String(v);
      return (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r"))
        ? `"${s.replace(/"/g, '""')}"` : s;
    };
    // All rows are 4 columns wide (widest section = chart data with 4 cols)
    const row = (a: string | number, b: string | number = "", c: string | number = "", d: string | number = "") =>
      [q(a), q(b), q(c), q(d)].join(",");
    const nl = "\r\n";
    const lines = [
      // Metadata block
      row("lilluucore Analytics Export"),
      row("Период:", periodLabel),
      row("Дата экспорта:", now),
      row(""),
      // Summary section
      row("СВОДНАЯ СТАТИСТИКА"),
      row("Метрика", "Значение"),
      row("Просмотры", stats.views),
      row("Уникальные посетители", stats.uniqueVisitors),
      row("Клики", stats.clicks),
      row("Новые регистрации", stats.newRegistrations),
      row("Среднее время на сайте (мм:сс)", avgFmt),
      row("Процент отказов", `${stats.bounceRate}%`),
      row(""),
      // Chart section
      row("ДИНАМИКА ПО ДНЯМ"),
      row("Дата", "Просмотры", "Клики", "Посетители"),
      ...(stats.chartData ?? []).map(r => row(r.date, r.views, r.clicks, r.visitors)),
    ];
    const csv = lines.join(nl);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `lilluucore-analytics-${period}-${now}.csv`; a.click();
    URL.revokeObjectURL(url);
    setExportOpen(false);
  };

  const exportJSON = () => {
    if (!stats) return;
    const now = new Date().toISOString();
    const payload = {
      platform: "lilluucore",
      period,
      exportedAt: now,
      summary: {
        views: stats.views,
        uniqueVisitors: stats.uniqueVisitors,
        clicks: stats.clicks,
        newRegistrations: stats.newRegistrations,
        avgSessionSec: stats.avgSessionSec,
        bounceRate: stats.bounceRate,
      },
      chartData: stats.chartData ?? [],
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `lilluucore-analytics-${period}-${now.slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
    setExportOpen(false);
  };

  const exportPDF = () => {
    if (!stats) return;
    const now = new Date().toISOString().slice(0, 10);
    const avgMin = Math.floor(stats.avgSessionSec / 60);
    const avgSec = stats.avgSessionSec % 60;
    const avgFmt = `${avgMin}:${String(avgSec).padStart(2, "0")}`;
    const summaryRows = [
      ["Просмотры", stats.views.toLocaleString("ru-RU")],
      ["Уникальные посетители", stats.uniqueVisitors.toLocaleString("ru-RU")],
      ["Клики", stats.clicks.toLocaleString("ru-RU")],
      ["Новые регистрации", stats.newRegistrations.toLocaleString("ru-RU")],
      ["Среднее время на сайте", avgFmt],
      ["Процент отказов", `${stats.bounceRate}%`],
    ];
    const chartRows = (stats.chartData ?? []).map(r =>
      `<tr><td>${r.date}</td><td>${r.views.toLocaleString("ru-RU")}</td><td>${r.clicks.toLocaleString("ru-RU")}</td><td>${r.visitors.toLocaleString("ru-RU")}</td></tr>`
    ).join("");
    const html = `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8">
<title>lilluucore Analytics ${now}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; padding: 36px; max-width: 820px; margin: 0 auto; }
  .logo { font-size: 20px; font-weight: 900; color: #6d28d9; letter-spacing: -0.5px; }
  .logo span { color: #a78bfa; }
  h1 { font-size: 18px; font-weight: 700; color: #1e1b4b; margin: 16px 0 2px; }
  .meta { font-size: 12px; color: #64748b; margin-bottom: 28px; display: flex; gap: 16px; }
  .badge { background: #ede9fe; color: #6d28d9; border-radius: 6px; padding: 2px 10px; font-weight: 600; font-size: 11px; }
  h2 { font-size: 13px; font-weight: 700; color: #4c1d95; margin: 24px 0 8px; text-transform: uppercase; letter-spacing: 0.5px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 8px; }
  th { background: #f5f3ff; color: #5b21b6; font-weight: 700; padding: 9px 14px; text-align: left; border-bottom: 2px solid #ddd6fe; }
  td { padding: 8px 14px; border-bottom: 1px solid #f1f5f9; }
  tr:hover td { background: #faf8ff; }
  td:last-child, th:last-child { font-weight: 600; color: #1e1b4b; }
  .footer { margin-top: 32px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
  @media print { body { padding: 20px; } @page { margin: 15mm; } }
</style></head><body>
<div class="logo">lillu<span>u</span>core</div>
<h1>Отчёт по аналитике</h1>
<div class="meta"><span class="badge">Период: ${periodLabel}</span><span>Дата: ${now}</span></div>
<h2>Сводная статистика</h2>
<table><thead><tr><th>Метрика</th><th>Значение</th></tr></thead><tbody>
${summaryRows.map(([m, v]) => `<tr><td>${m}</td><td>${v}</td></tr>`).join("")}
</tbody></table>
<h2>Динамика по дням</h2>
<table><thead><tr><th>Дата</th><th>Просмотры</th><th>Клики</th><th>Посетители</th></tr></thead><tbody>
${chartRows}
</tbody></table>
<div class="footer">Сформировано lilluucore · ${new Date().toLocaleString("ru-RU")}</div>
</body></html>`;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 450);
    setExportOpen(false);
  };

  const exportDOCX = async () => {
    if (!stats) return;
    const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel, WidthType } = await import("docx");
    const now = new Date().toISOString().slice(0, 10);
    const avgMin = Math.floor(stats.avgSessionSec / 60);
    const avgSec = stats.avgSessionSec % 60;
    const avgFmt = `${avgMin}:${String(avgSec).padStart(2, "0")}`;

    const cell = (text: string, bold = false, width = 50) =>
      new TableCell({ width: { size: width, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text, bold, size: 20 })] })] });

    const summaryTable = new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
      new TableRow({ children: [cell("Метрика", true), cell("Значение", true)], tableHeader: true }),
      ...([
        ["Просмотры", String(stats.views)],
        ["Уникальные посетители", String(stats.uniqueVisitors)],
        ["Клики", String(stats.clicks)],
        ["Новые регистрации", String(stats.newRegistrations)],
        ["Среднее время на сайте", avgFmt],
        ["Процент отказов", `${stats.bounceRate}%`],
      ].map(([m, v]) => new TableRow({ children: [cell(m), cell(v)] }))),
    ]});

    const chartTable = new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
      new TableRow({ children: ["Дата", "Просмотры", "Клики", "Посетители"].map(h => cell(h, true, 25)), tableHeader: true }),
      ...((stats.chartData ?? []).map(r =>
        new TableRow({ children: [r.date, String(r.views), String(r.clicks), String(r.visitors)].map(v => cell(v, false, 25)) })
      )),
    ]});

    const h = (text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel]) =>
      new Paragraph({ heading: level, children: [new TextRun({ text, bold: true })] });
    const p = (text: string) => new Paragraph({ children: [new TextRun({ text, size: 22 })] });

    const doc = new Document({ sections: [{ children: [
      h("lilluucore — Отчёт по аналитике", HeadingLevel.HEADING_1),
      p(`Период: ${periodLabel}`),
      p(`Дата экспорта: ${now}`),
      new Paragraph({}),
      h("Сводная статистика", HeadingLevel.HEADING_2),
      summaryTable,
      new Paragraph({}),
      h("Динамика по дням", HeadingLevel.HEADING_2),
      chartTable,
    ]}]});

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `lilluucore-analytics-${period}-${now}.docx`; a.click();
    URL.revokeObjectURL(url);
    setExportOpen(false);
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
            {/* Export button */}
            <div className="relative" ref={exportRef}>
              <button
                onClick={() => setExportOpen(o => !o)}
                disabled={!stats}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/8 bg-secondary/40 hover:bg-secondary/70 text-sm font-medium text-foreground transition disabled:opacity-40 disabled:cursor-not-allowed">
                <DownloadSimple size={16} weight="light" />
                Экспорт
                <CaretDown size={12} weight="bold" className={`transition-transform ${exportOpen ? "rotate-180" : ""}`} />
              </button>
              {exportOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 glass border border-border rounded-xl shadow-xl overflow-hidden z-50">
                  <div className="px-3 pt-3 pb-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Формат экспорта</p>
                  </div>
                  <button onClick={exportCSV}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition text-sm text-foreground">
                    <FileCsv size={20} weight="light" className="text-green-400 flex-shrink-0" />
                    <div className="text-left">
                      <p className="font-medium">CSV</p>
                      <p className="text-xs text-muted-foreground">Excel, Google Sheets</p>
                    </div>
                  </button>
                  <button onClick={exportJSON}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition text-sm text-foreground">
                    <BracketsCurly size={20} weight="light" className="text-blue-400 flex-shrink-0" />
                    <div className="text-left">
                      <p className="font-medium">JSON</p>
                      <p className="text-xs text-muted-foreground">API, разработчикам</p>
                    </div>
                  </button>
                  <button onClick={exportPDF}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition text-sm text-foreground">
                    <FilePdf size={20} weight="light" className="text-red-400 flex-shrink-0" />
                    <div className="text-left">
                      <p className="font-medium">PDF</p>
                      <p className="text-xs text-muted-foreground">Готовый отчёт с таблицами</p>
                    </div>
                  </button>
                  <button onClick={exportDOCX}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition text-sm text-foreground">
                    <MicrosoftWordLogo size={20} weight="light" className="text-sky-500 flex-shrink-0" />
                    <div className="text-left">
                      <p className="font-medium">Word</p>
                      <p className="text-xs text-muted-foreground">Документ .docx</p>
                    </div>
                  </button>
                  <div className="px-3 pb-2.5 pt-1 border-t border-border mt-1">
                    <p className="text-xs text-muted-foreground">Период: {periodLabel}</p>
                  </div>
                </div>
              )}
            </div>
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
            <button
              onClick={() => { if (atSiteLimit) { setShowUpgrade(true); return; } setShowAI(true); resetAI(); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-sm transition shadow-lg shadow-primary/10">
              <Sparkle size={16} weight="fill" />
              AI из скриншота
            </button>
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

      {/* ── AI Screenshot Modal ── */}
      <AnimatePresence>
        {showAI && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget && !aiLoading) { setShowAI(false); resetAI(); } }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass border border-white/8 rounded-2xl p-7 w-full max-w-lg shadow-2xl">

              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                  <Sparkle size={20} weight="fill" className="text-primary" />
                </div>
                <div>
                  <h3 className="text-foreground font-black text-xl leading-tight">
                    {aiStep !== "upload" ? "Предпросмотр сайта" : aiMode === "url" ? "AI генерация по сайту" : "AI генерация из скриншота"}
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    {aiStep === "upload"
                      ? "GPT-4o анализирует дизайн и создаёт готовый сайт"
                      : "Проверьте структуру перед созданием"}
                  </p>
                </div>
                {!aiLoading && (
                  <button onClick={() => { setShowAI(false); resetAI(); }} className="ml-auto text-muted-foreground hover:text-foreground transition p-1">
                    <X size={20} />
                  </button>
                )}
              </div>

              {/* ── Step: upload ── */}
              {aiStep === "upload" && (
                <>
                  {/* Mode toggle tabs */}
                  <div className="flex gap-1 bg-secondary/40 rounded-xl p-1 mb-4">
                    <button
                      type="button"
                      onClick={() => { setAiMode("file"); setAiError(""); }}
                      disabled={aiLoading}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition ${aiMode === "file" ? "bg-white/10 text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                      <ImageSquare size={15} />
                      Скриншот
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAiMode("url"); setAiError(""); setAiFile(null); setAiPreview(null); }}
                      disabled={aiLoading}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition ${aiMode === "url" ? "bg-white/10 text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                      <LinkSimple size={15} />
                      По ссылке
                    </button>
                  </div>

                  {/* File upload mode */}
                  {aiMode === "file" && (
                    <>
                      {!aiPreview ? (
                        <div
                          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${aiDragOver ? "border-primary bg-primary/10" : "border-white/15 bg-white/3 hover:border-primary/50 hover:bg-primary/5"}`}
                          onClick={() => aiFileInputRef.current?.click()}
                          onDragOver={(e) => { e.preventDefault(); setAiDragOver(true); }}
                          onDragLeave={() => setAiDragOver(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setAiDragOver(false);
                            const file = e.dataTransfer.files[0];
                            if (file) handleAIFileSelect(file);
                          }}>
                          <ImageSquare size={48} weight="light" className="mx-auto text-muted-foreground/40 mb-3" />
                          <p className="text-foreground font-semibold mb-1">Перетащите скриншот или нажмите</p>
                          <p className="text-muted-foreground text-sm">PNG, JPG, WebP до 10 МБ</p>
                          <input
                            ref={aiFileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAIFileSelect(f); }}
                          />
                        </div>
                      ) : (
                        <div className="relative rounded-xl overflow-hidden border border-white/8 mb-1">
                          <img src={aiPreview} alt="preview" className="w-full max-h-52 object-cover" />
                          {!aiLoading && (
                            <button
                              onClick={() => { setAiFile(null); setAiPreview(null); }}
                              className="absolute top-2 right-2 w-7 h-7 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/80 transition">
                              <X size={14} />
                            </button>
                          )}
                          {aiLoading && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              <p className="text-white text-sm font-medium">{aiProgress}</p>
                            </div>
                          )}
                        </div>
                      )}
                      {aiPreview && !aiLoading && (
                        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                          <UploadSimple size={13} />
                          <span className="truncate">{aiFile?.name}</span>
                        </div>
                      )}
                    </>
                  )}

                  {/* URL mode */}
                  {aiMode === "url" && (
                    <div className="space-y-3">
                      <div className="relative">
                        <LinkSimple size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                        <input
                          type="url"
                          value={aiUrl}
                          onChange={(e) => { setAiUrl(e.target.value); setAiError(""); setAiUrlThumb(null); }}
                          onKeyDown={(e) => { if (e.key === "Enter" && aiUrl.trim()) handleAIAnalyze(); }}
                          disabled={aiLoading}
                          placeholder="https://example.com"
                          className="w-full bg-secondary/60 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary/50 disabled:opacity-50 transition placeholder:text-muted-foreground/40"
                        />
                      </div>
                      {!aiUrlThumb && (
                        <p className="text-xs text-muted-foreground">
                          Вставьте ссылку на любой публичный сайт — AI сделает скриншот и создаст шаблон по его дизайну
                        </p>
                      )}
                      {/* Live thumbnail preview */}
                      {aiUrlThumb && !aiLoading && (
                        <div className="relative rounded-xl overflow-hidden border border-white/8">
                          <img
                            src={aiUrlThumb}
                            alt="Предпросмотр"
                            className="w-full max-h-44 object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => { setAiUrl(""); setAiUrlThumb(null); }}
                            className="absolute top-2 right-2 w-7 h-7 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/80 transition">
                            <X size={14} />
                          </button>
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
                            <p className="text-white/80 text-xs truncate">{aiUrl}</p>
                          </div>
                        </div>
                      )}
                      {aiLoading && (
                        <div className="flex items-center gap-2.5 bg-primary/8 border border-primary/20 rounded-xl px-4 py-3">
                          <div className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin flex-shrink-0" />
                          <p className="text-primary text-sm font-medium">{aiProgress}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {aiError && (
                    <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 text-red-400 text-sm">
                      {aiError}
                    </div>
                  )}

                  <div className="flex gap-3 mt-5">
                    <button
                      type="button"
                      onClick={() => { setShowAI(false); resetAI(); }}
                      disabled={aiLoading}
                      className="flex-1 bg-secondary/60 text-foreground font-medium py-3 rounded-xl hover:bg-secondary transition text-sm disabled:opacity-40">
                      Отмена
                    </button>
                    <button
                      type="button"
                      onClick={handleAIAnalyze}
                      disabled={(aiMode === "file" ? !aiFile : !aiUrl.trim()) || aiLoading}
                      className="flex-1 gradient-purple text-white font-bold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-40 text-sm flex items-center justify-center gap-2">
                      {aiLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Анализирую...
                        </>
                      ) : (
                        <>
                          <Sparkle size={16} weight="fill" />
                          Анализировать
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}

              {/* ── Step: preview ── */}
              {(aiStep === "preview" || aiStep === "creating") && aiResult && (
                <>
                  {/* Thumbnail strip */}
                  {aiPreview && (
                    <div className="relative rounded-xl overflow-hidden border border-white/8 mb-4 h-28">
                      <img src={aiPreview} alt="скриншот" className="w-full h-full object-cover object-top" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                  )}

                  {/* Editable site name */}
                  <div className="mb-3">
                    <label className="text-xs text-muted-foreground font-medium mb-1 block">Название сайта</label>
                    <input
                      value={aiSuggestedName}
                      onChange={(e) => setAiSuggestedName(e.target.value)}
                      disabled={aiLoading}
                      className="w-full bg-secondary/60 border border-white/10 rounded-xl px-4 py-2.5 text-foreground text-sm font-semibold focus:outline-none focus:border-primary/50 disabled:opacity-50 transition"
                    />
                  </div>

                  {/* Business type */}
                  <div className="mb-4">
                    <label className="text-xs text-muted-foreground font-medium mb-1 block">Тип сайта</label>
                    <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
                      <Sparkle size={12} weight="fill" className="text-primary" />
                      <span className="text-primary text-xs font-semibold">
                        {BUSINESS_TYPES.find(b => b.value === aiResult.businessType)?.label ?? aiResult.businessType}
                      </span>
                    </div>
                  </div>

                  {/* Block list — sortable + removable */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-muted-foreground font-medium">
                        Блоки ({aiBlocks.length})
                      </label>
                      {aiBlocks.length === 0 && (
                        <span className="text-xs text-red-400">Добавьте хотя бы один блок</span>
                      )}
                    </div>
                    <DndContext
                      sensors={aiDndSensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleAiDragEnd}>
                      <SortableContext items={aiBlocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                        <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-1">
                          {aiBlocks.map((b, i) => (
                            <SortableAiBlockRow
                              key={b.id}
                              block={b}
                              index={i}
                              disabled={aiLoading}
                              onRemove={() => setAiBlocks(prev => prev.filter(x => x.id !== b.id))}
                            />
                          ))}
                          {aiBlocks.length === 0 && (
                            <div className="text-center py-4 text-muted-foreground/50 text-sm border-2 border-dashed border-white/8 rounded-xl">
                              Все блоки удалены
                            </div>
                          )}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>

                  {/* Creating progress overlay */}
                  {aiStep === "creating" && (
                    <div className="flex items-center gap-2.5 bg-primary/8 border border-primary/20 rounded-xl px-4 py-3 mb-4">
                      <div className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin flex-shrink-0" />
                      <p className="text-primary text-sm font-medium">{aiProgress}</p>
                    </div>
                  )}

                  {aiError && (
                    <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 text-red-400 text-sm">
                      {aiError}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setShowAI(false); resetAI(); }}
                      disabled={aiLoading}
                      className="flex-1 bg-secondary/60 text-foreground font-medium py-3 rounded-xl hover:bg-secondary transition text-sm disabled:opacity-40">
                      Отмена
                    </button>
                    <button
                      type="button"
                      onClick={handleAICreate}
                      disabled={aiLoading || !aiSuggestedName.trim() || aiBlocks.length === 0}
                      className="flex-1 gradient-purple text-white font-bold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-40 text-sm flex items-center justify-center gap-2">
                      {aiLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Создаю...
                        </>
                      ) : (
                        <>
                          <Sparkle size={16} weight="fill" />
                          Создать
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}

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
