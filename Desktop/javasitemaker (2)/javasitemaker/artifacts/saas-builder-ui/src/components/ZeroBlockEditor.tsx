import { useState, useEffect, useRef, useCallback } from "react";
import type { ReactNode } from "react";
import {
  Type, Image, Square, Star, Code, Play, FileText, Pencil, Layers,
  Monitor, Tablet, Smartphone,
  X, Check, ArrowLeft, ChevronUp, ChevronDown,
  AlignLeft, AlignCenter, AlignRight, ArrowUp, ArrowUpDown, ArrowDown,
  Clone, ObjectGroup, Grid, StopCircle, Edit2, Lock, LockOpen, Eye, EyeOff,
} from "@/lib/icons";
import {
  ZeroElementType, Breakpoint, ResizeHandle, ShapeType, AnimTrigger, AnimEffect,
  PathPoint, BPData, ZeroElement, ZeroBlockData,
  defaultZeroBlockData, parseZeroData, serializeZeroData,
  buildSVGPath, getPathBounds,
} from "./zeroBlockUtils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CANVAS_WIDTHS: Record<Breakpoint, number> = { desktop: 1200, tablet: 768, mobile: 375 };
const BP_LABELS: Record<Breakpoint, string> = { desktop: "Десктоп", tablet: "Планшет", mobile: "Мобильный" };

function uid() { return Math.random().toString(36).slice(2, 10); }

function getBPData(el: ZeroElement, bp: Breakpoint): BPData {
  if (bp === "desktop") return el.desktop;
  const override = el[bp];
  return {
    x: override?.x ?? el.desktop.x,
    y: override?.y ?? el.desktop.y,
    w: override?.w ?? el.desktop.w,
    h: override?.h ?? el.desktop.h,
    visible: override?.visible ?? el.desktop.visible,
  };
}

function setBPData(el: ZeroElement, bp: Breakpoint, patch: Partial<BPData>): ZeroElement {
  if (bp === "desktop") return { ...el, desktop: { ...el.desktop, ...patch } };
  return { ...el, [bp]: { ...el[bp], ...patch } };
}

function makeElement(type: ZeroElementType, x: number, y: number): ZeroElement {
  const defaults: Record<ZeroElementType, Partial<ZeroElement["desktop"]>> = {
    text:   { w: 320, h: 60 },
    image:  { w: 280, h: 200 },
    button: { w: 180, h: 48 },
    shape:  { w: 200, h: 200 },
    html:   { w: 300, h: 200 },
    video:  { w: 480, h: 270 },
    form:   { w: 360, h: 320 },
    path:   { w: 300, h: 300 },
    group:  { w: 400, h: 300 },
  };
  const d = defaults[type] || {};
  return {
    id: uid(),
    type,
    locked: false,
    zIndex: 1,
    container: "grid",
    desktop: { x, y, w: (d as any).w || 200, h: (d as any).h || 100, visible: true },
    content: {
      text: type === "text" ? "Введите текст..." : undefined,
      label: type === "button" ? "Кнопка" : undefined,
      src: type === "image" ? "" : undefined,
      videoUrl: type === "video" ? "" : undefined,
      formFields: type === "form" ? [
        { id: uid(), type: "text", label: "Имя", required: true },
        { id: uid(), type: "email", label: "Email", required: true },
        { id: uid(), type: "tel", label: "Телефон", required: false },
      ] : undefined,
      pathPoints: type === "path" ? [] : undefined,
      childIds: type === "group" ? [] : undefined,
    },
    styles: {
      color: "#ffffff",
      fontSize: type === "text" ? 18 : 16,
      fontWeight: type === "text" ? "400" : "600",
      textAlign: "left",
      bg: type === "button" ? "#7c3aed" : type === "group" ? "transparent" : "transparent",
      borderRadius: type === "button" ? 10 : 0,
      shapeType: type === "shape" ? "rect" : undefined,
      shapeFill: type === "shape" ? "#7c3aed" : undefined,
      btnVariant: type === "button" ? "filled" : undefined,
      pathFill: type === "path" ? "#7c3aed" : undefined,
      pathStroke: type === "path" ? "transparent" : undefined,
      pathStrokeW: type === "path" ? 0 : undefined,
      pathClosed: type === "path" ? false : undefined,
      animTrigger: "none",
      animEffect: "fade",
      animDuration: 600,
      animDelay: 0,
    },
  };
}

// ─── Grid Overlay ─────────────────────────────────────────────────────────────

function GridOverlay({ cols, gutter, margin, width, height }: { cols: number; gutter: number; margin: number; width: number; height: number }) {
  const colWidth = (width - margin * 2 - gutter * (cols - 1)) / cols;
  const columns = Array.from({ length: cols }, (_, i) => ({
    left: margin + i * (colWidth + gutter),
    width: colWidth,
  }));
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      {columns.map((col, i) => (
        <div key={i} className="absolute top-0 bottom-0 bg-blue-400/5 border-l border-r border-blue-400/10"
          style={{ left: col.left, width: col.width }} />
      ))}
      <div className="absolute top-0 bottom-0 bg-blue-400/5" style={{ left: 0, width: margin }} />
      <div className="absolute top-0 bottom-0 bg-blue-400/5" style={{ right: 0, width: margin }} />
    </div>
  );
}

// ─── Element Renderer (preview inside editor) ─────────────────────────────────

function ElementPreview({ el, selected }: { el: ZeroElement; selected: boolean }) {
  const s = el.styles;
  const c = el.content;

  const baseStyle: React.CSSProperties = {
    width: "100%", height: "100%",
    opacity: s.opacity !== undefined ? s.opacity / 100 : 1,
    borderRadius: s.borderRadius,
    overflow: "hidden",
    boxShadow: s.boxShadow,
    fontFamily: s.fontFamily || "inherit",
  };

  if (el.type === "text") {
    return (
      <div style={{ ...baseStyle, background: s.bg, color: s.color, fontSize: s.fontSize, fontWeight: s.fontWeight,
        textAlign: s.textAlign, lineHeight: s.lineHeight || 1.5, letterSpacing: s.letterSpacing,
        padding: "4px 8px", whiteSpace: "pre-wrap", wordBreak: "break-word", borderWidth: s.borderWidth, borderColor: s.borderColor, borderStyle: s.borderWidth ? "solid" : undefined }}>
        {c.text || "Текст..."}
      </div>
    );
  }
  if (el.type === "image") {
    if (c.src) return <img src={c.src} alt={c.alt || ""} style={{ ...baseStyle, objectFit: "cover", display: "block" }} />;
    return (
      <div style={{ ...baseStyle, background: s.bg || "#1e1b4b", display: "flex", alignItems: "center", justifyContent: "center",
        border: "2px dashed rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.3)", fontSize: 12 }}>
        🖼 Изображение
      </div>
    );
  }
  if (el.type === "button") {
    const filled = s.btnVariant !== "outline" && s.btnVariant !== "ghost";
    return (
      <div style={{ ...baseStyle, background: filled ? (s.bg || "#7c3aed") : "transparent",
        border: s.btnVariant === "ghost" ? "none" : `${s.borderWidth || 2}px solid ${s.borderColor || s.bg || "#7c3aed"}`,
        color: s.color || "#fff", fontSize: s.fontSize || 16, fontWeight: s.fontWeight || "600",
        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", gap: 8 }}>
        {c.label || "Кнопка"}
      </div>
    );
  }
  if (el.type === "shape") {
    const fill = s.shapeFill || "#7c3aed";
    const bw = s.shapeBorderW || 0;
    const bc = s.shapeBorder || "transparent";
    if (s.shapeType === "circle") {
      return <div style={{ ...baseStyle, borderRadius: "50%", background: fill, border: bw ? `${bw}px solid ${bc}` : "none" }} />;
    }
    if (s.shapeType === "triangle") {
      return (
        <div style={{ width: "100%", height: "100%", position: "relative", overflow: "visible" }}>
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polygon points="50,0 100,100 0,100" fill={fill} stroke={bc} strokeWidth={bw} />
          </svg>
        </div>
      );
    }
    if (s.shapeType === "star") {
      return (
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" fill={fill} stroke={bc} strokeWidth={bw} />
          </svg>
        </div>
      );
    }
    if (s.shapeType === "line") {
      return (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center" }}>
          <div style={{ width: "100%", height: bw || 2, background: fill }} />
        </div>
      );
    }
    return <div style={{ ...baseStyle, background: fill, border: bw ? `${bw}px solid ${bc}` : "none" }} />;
  }
  if (el.type === "html") {
    if (c.html) {
      return (
        <iframe srcDoc={`<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{background:transparent;color:#fff;font-family:sans-serif;font-size:14px}</style></head><body>${c.html}</body></html>`}
          sandbox="allow-same-origin" style={{ ...baseStyle, border: "none", background: "transparent" }} />
      );
    }
    return (
      <div style={{ ...baseStyle, background: s.bg || "#0f0f1a", border: "2px dashed rgba(255,255,255,0.1)",
        display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)", fontSize: 12 }}>
        {"</>"} HTML-блок
      </div>
    );
  }
  if (el.type === "video") {
    const url = c.videoUrl || "";
    const ytId = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/)([^&?]+)/)?.[1];
    if (ytId) {
      return <iframe src={`https://www.youtube.com/embed/${ytId}`} style={{ ...baseStyle, border: "none", background: "#000" }} allowFullScreen />;
    }
    return (
      <div style={{ ...baseStyle, background: "#000", display: "flex", alignItems: "center", justifyContent: "center",
        border: "2px dashed rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)", fontSize: 12, gap: 6 }}>
        <Play size={14} /> Видео
      </div>
    );
  }
  if (el.type === "form") {
    const fields = c.formFields || [];
    return (
      <div style={{ ...baseStyle, background: s.bg || "rgba(255,255,255,0.05)", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {fields.map(f => (
          <div key={f.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ color: s.color || "#ccc", fontSize: 11, fontWeight: "600" }}>{f.label}{f.required ? " *" : ""}</span>
            <div style={{ height: 32, borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)" }} />
          </div>
        ))}
        <div style={{ height: 40, borderRadius: 8, background: s.bg === "transparent" ? "#7c3aed" : s.bg || "#7c3aed",
          display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: "600", cursor: "pointer" }}>
          Отправить
        </div>
      </div>
    );
  }
  if (el.type === "path") {
    const pts = c.pathPoints || [];
    if (pts.length === 0) {
      return (
        <div style={{ ...baseStyle, border: "2px dashed rgba(124,58,237,0.4)", display: "flex", alignItems: "center", justifyContent: "center",
          color: "rgba(124,58,237,0.6)", fontSize: 12, flexDirection: "column", gap: 6 }}>
          <Pencil size={20} />
          <span>Нажмите «Редактировать» → рисуйте путь</span>
        </div>
      );
    }
    const { minX, minY, maxX, maxY } = getPathBounds(pts);
    const vbW = Math.max(maxX - minX, 1);
    const vbH = Math.max(maxY - minY, 1);
    const d = buildSVGPath(pts.map(p => ({ ...p, x: p.x - minX, y: p.y - minY,
      cp1: p.cp1 ? { x: p.cp1.x - minX, y: p.cp1.y - minY } : undefined,
      cp2: p.cp2 ? { x: p.cp2.x - minX, y: p.cp2.y - minY } : undefined,
    })), s.pathClosed);
    return (
      <div style={{ ...baseStyle }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${vbW} ${vbH}`} preserveAspectRatio="xMidYMid meet">
          <path d={d} fill={s.pathFill || "none"} stroke={s.pathStroke || "#7c3aed"} strokeWidth={s.pathStrokeW || 2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }
  if (el.type === "group") {
    return (
      <div style={{ ...baseStyle, background: s.bg && s.bg !== "transparent" ? s.bg : "rgba(124,58,237,0.04)",
        border: "1px dashed rgba(124,58,237,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 4 }}>
        <span style={{ color: "rgba(124,58,237,0.5)", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><Layers size={11} /> Группа ({(c.childIds || []).length} эл.)</span>
      </div>
    );
  }
  return <div style={{ ...baseStyle, background: "#333" }} />;
}

// ─── Resize Handles ───────────────────────────────────────────────────────────

const HANDLES: ResizeHandle[] = ["nw","n","ne","e","se","s","sw","w"];
const HANDLE_CURSORS: Record<ResizeHandle, string> = {
  nw: "nw-resize", n: "n-resize", ne: "ne-resize",
  e: "e-resize", se: "se-resize", s: "s-resize",
  sw: "sw-resize", w: "w-resize",
};
const HANDLE_POSITIONS: Record<ResizeHandle, React.CSSProperties> = {
  nw: { top: -4, left: -4 }, n: { top: -4, left: "50%", transform: "translateX(-50%)" }, ne: { top: -4, right: -4 },
  e: { top: "50%", right: -4, transform: "translateY(-50%)" }, se: { bottom: -4, right: -4 },
  s: { bottom: -4, left: "50%", transform: "translateX(-50%)" }, sw: { bottom: -4, left: -4 },
  w: { top: "50%", left: -4, transform: "translateY(-50%)" },
};

// ─── Properties Panel ─────────────────────────────────────────────────────────

const ANIM_PREVIEW_INITIAL: Record<string, React.CSSProperties> = {
  "fade":       { opacity: 0 },
  "slide-up":   { opacity: 0, transform: "translateY(30px)" },
  "slide-down": { opacity: 0, transform: "translateY(-30px)" },
  "slide-left": { opacity: 0, transform: "translateX(30px)" },
  "slide-right":{ opacity: 0, transform: "translateX(-30px)" },
  "zoom-in":    { opacity: 0, transform: "scale(0.7)" },
  "zoom-out":   { opacity: 0, transform: "scale(1.3)" },
};

function PropsPanel({ el, onChange, onDelete, onDuplicate, bp, popupBlocks }:
  { el: ZeroElement; onChange: (patch: Partial<ZeroElement>) => void; onDelete: () => void; onDuplicate: () => void; bp: Breakpoint; popupBlocks?: { id: string; popupId: string; title: string }[] }) {
  const bpData = getBPData(el, bp);
  const [tab, setTab] = useState<"layout"|"content"|"style"|"anim">("layout");
  const [animPreview, setAnimPreview] = useState(false);

  const upBP = (patch: Partial<BPData>) => {
    const existing = bp === "desktop" ? el.desktop : (el[bp] || {});
    onChange({ [bp]: { ...existing, ...patch } as any });
  };
  const upContent = (patch: Partial<ZeroElement["content"]>) => onChange({ content: { ...el.content, ...patch } });
  const upStyle = (patch: Partial<ZeroElement["styles"]>) => onChange({ styles: { ...el.styles, ...patch } });

  const inp = (label: string, val: any, onCh: (v: any) => void, type = "text", placeholder = "") => (
    <div>
      <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">{label}</label>
      <input type={type} value={val ?? ""} onChange={e => onCh(type === "number" ? Number(e.target.value) : e.target.value)}
        className="w-full bg-secondary border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary font-mono" placeholder={placeholder} />
    </div>
  );

  // Content-style text field — matches the F() helper in BuilderPage content popup
  const txt = (label: string, val: any, onCh: (v: any) => void, multiline = false, placeholder = "", mono = false) => (
    <div>
      <label className="text-[11px] text-muted-foreground font-medium block mb-1">{label}</label>
      {multiline
        ? <textarea value={val || ""} onChange={e => onCh(e.target.value)} rows={4} placeholder={placeholder}
            className={`w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground resize-none focus:outline-none focus:border-primary${mono ? " font-mono" : ""}`} />
        : <input type="text" value={val || ""} onChange={e => onCh(e.target.value)} placeholder={placeholder}
            className={`w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary${mono ? " font-mono" : ""}`} />
      }
    </div>
  );

  const tabs = [
    { id: "layout", label: "Позиция" },
    { id: "content", label: "Контент" },
    { id: "style", label: "Стиль" },
    { id: "anim", label: "Анимация" },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border flex-shrink-0">
        <span className="text-xs font-bold text-foreground uppercase tracking-wide">{TYPE_LABELS[el.type]}</span>
        <div className="flex gap-1">
          <button onClick={onDuplicate} title="Дублировать"
            className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition"><Clone size={11} /></button>
          <button onClick={onDelete} title="Удалить"
            className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition"><X size={11} /></button>
        </div>
      </div>

      <div className="flex border-b border-border flex-shrink-0">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`flex-1 py-1.5 text-[10px] font-semibold transition ${tab === t.id ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {tab === "layout" && (
          <>
            <div className="grid grid-cols-2 gap-2">
              {inp("X (px)", bpData.x, v => upBP({ x: v }), "number")}
              {inp("Y (px)", bpData.y, v => upBP({ y: v }), "number")}
              {inp("Ширина", bpData.w, v => upBP({ w: v }), "number")}
              {inp("Высота", bpData.h, v => upBP({ h: v }), "number")}
            </div>
            {inp("Z-слой", el.zIndex, v => onChange({ zIndex: v }), "number")}
            <div>
              <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">Контейнер</label>
              <select value={el.container} onChange={e => onChange({ container: e.target.value as any })}
                className="w-full bg-secondary border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none">
                <option value="grid">Grid (относительно сетки)</option>
                <option value="window">Window (фиксированный в окне)</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-medium">Видимость на {BP_LABELS[bp]}</span>
              <button onClick={() => upBP({ visible: !bpData.visible })}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${bpData.visible ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                {bpData.visible ? "Видим" : "Скрыт"}
              </button>
            </div>
          </>
        )}

        {tab === "content" && (
          <>
            {el.type === "text" && txt("Текст", el.content.text, v => upContent({ text: v }), true)}
            {el.type === "image" && (
              <>
                {txt("URL изображения", el.content.src, v => upContent({ src: v }), false, "https://")}
                {txt("Alt текст", el.content.alt, v => upContent({ alt: v }))}
              </>
            )}
            {el.type === "button" && (() => {
              const isPopup = typeof el.content.href === "string" && el.content.href.startsWith("#popup:");
              const currentPopupId = isPopup ? (el.content.href as string).slice(7) : "";
              return (
                <>
                  {txt("Текст кнопки", el.content.label, v => upContent({ label: v }))}
                  <div>
                    <label className="text-[11px] text-muted-foreground font-medium block mb-1">Действие кнопки</label>
                    <div className="grid grid-cols-2 gap-1 mb-2">
                      {([["link", "Ссылка"], ["popup", "Открыть попап"]] as [string, string][]).map(([v, l]) => (
                        <button key={v} type="button"
                          onClick={() => {
                            if (v === "popup") upContent({ href: currentPopupId ? `#popup:${currentPopupId}` : "" });
                            else upContent({ href: "" });
                          }}
                          className={`text-xs py-1.5 rounded-lg border transition ${(isPopup ? "popup" : "link") === v ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                          {l}
                        </button>
                      ))}
                    </div>
                    {isPopup ? (
                      popupBlocks && popupBlocks.length > 0 ? (
                        <select value={currentPopupId} onChange={e => upContent({ href: `#popup:${e.target.value}` })}
                          className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary">
                          <option value="">— выберите попап —</option>
                          {popupBlocks.map(p => (
                            <option key={p.id} value={p.popupId}>{p.title} (#{p.popupId})</option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-xs text-amber-400">Добавьте блок «Попап» на страницу</p>
                      )
                    ) : (
                      txt("Ссылка (href)", el.content.href, v => upContent({ href: v }), false, "https:// или #anchor")
                    )}
                  </div>
                  {!isPopup && (
                    <div>
                      <label className="text-[11px] text-muted-foreground font-medium block mb-1">Открыть в</label>
                      <select value={el.content.target || "_self"} onChange={e => upContent({ target: e.target.value })}
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary">
                        <option value="_self">Текущей вкладке</option>
                        <option value="_blank">Новой вкладке</option>
                      </select>
                    </div>
                  )}
                </>
              );
            })()}
            {el.type === "html" && txt("HTML-код", el.content.html, v => upContent({ html: v }), true, "<div style='color:white'>...</div>", true)}
            {el.type === "video" && txt("URL видео (YouTube/Vimeo)", el.content.videoUrl, v => upContent({ videoUrl: v }), false, "https://youtube.com/watch?v=...")}
            {el.type === "form" && (
              <div className="space-y-2">
                <div className="text-[10px] text-muted-foreground font-medium">Поля формы</div>
                {(el.content.formFields || []).map((f, i) => (
                  <div key={f.id} className="bg-secondary/50 rounded-lg p-2 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">Поле {i + 1}</span>
                      <button onClick={() => {
                        const ff = [...(el.content.formFields || [])];
                        ff.splice(i, 1);
                        upContent({ formFields: ff });
                      }} className="text-red-400/60 hover:text-red-400"><X size={10} /></button>
                    </div>
                    <input value={f.label} onChange={e => {
                      const ff = [...(el.content.formFields || [])];
                      ff[i] = { ...ff[i], label: e.target.value };
                      upContent({ formFields: ff });
                    }} className="w-full bg-secondary border border-border rounded px-2 py-0.5 text-xs text-foreground focus:outline-none" placeholder="Название поля" />
                    <select value={f.type} onChange={e => {
                      const ff = [...(el.content.formFields || [])];
                      ff[i] = { ...ff[i], type: e.target.value };
                      upContent({ formFields: ff });
                    }} className="w-full bg-secondary border border-border rounded px-2 py-0.5 text-xs text-foreground focus:outline-none">
                      <option value="text">Текст</option>
                      <option value="email">Email</option>
                      <option value="tel">Телефон</option>
                      <option value="textarea">Многострочный</option>
                      <option value="select">Выпадающий список</option>
                    </select>
                  </div>
                ))}
                <button onClick={() => upContent({ formFields: [...(el.content.formFields || []), { id: uid(), type: "text", label: "Поле", required: false }] })}
                  className="w-full py-1.5 border border-dashed border-border rounded-lg text-[11px] text-muted-foreground hover:border-primary/40 hover:text-primary transition">
                  + Добавить поле
                </button>
              </div>
            )}
            {el.type === "shape" && (
              <div>
                <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">Тип фигуры</label>
                <select value={el.styles.shapeType || "rect"} onChange={e => upStyle({ shapeType: e.target.value as ShapeType })}
                  className="w-full bg-secondary border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none">
                  <option value="rect">Прямоугольник</option>
                  <option value="circle">Круг / Овал</option>
                  <option value="triangle">Треугольник</option>
                  <option value="star">Звезда</option>
                  <option value="line">Линия</option>
                </select>
              </div>
            )}
            {el.type === "path" && (
              <div className="space-y-2">
                <div className="bg-primary/8 border border-primary/20 rounded-lg p-2.5 text-[11px] text-muted-foreground leading-tight">
                  <div className="font-bold text-foreground mb-1">🖊 Инструмент «Перо»</div>
                  <div>• <b>Клик</b> на холст — добавить точку (прямой отрезок)</div>
                  <div>• <b>Клик + тяни</b> — кривая Безье</div>
                  <div>• <b>Двойной клик</b> — завершить путь</div>
                  <div>• <b>Esc</b> или снова «Рисовать» — выйти</div>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Точек в пути: <b className="text-foreground">{(el.content.pathPoints || []).length}</b>
                </div>
                {(el.content.pathPoints || []).length > 0 && (
                  <button onClick={() => onChange({ content: { ...el.content, pathPoints: [] } })}
                    className="w-full py-1 border border-dashed border-red-500/30 rounded text-[11px] text-red-400/70 hover:text-red-400 hover:border-red-400/50 transition">
                    <X size={10} /> Очистить путь
                  </button>
                )}
              </div>
            )}
            {el.type === "group" && (
              <div className="text-[11px] text-muted-foreground space-y-1">
                <div>Группа содержит <b className="text-foreground">{(el.content.childIds || []).length}</b> элементов.</div>
                <div className="text-[10px]">Выделите группу и перетащите — все дочерние элементы переместятся вместе.</div>
              </div>
            )}
          </>
        )}

        {tab === "style" && (
          <>
            {(el.type === "text" || el.type === "button" || el.type === "form") && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">Цвет текста</label>
                    <div className="flex gap-1">
                      <input type="color" value={el.styles.color || "#ffffff"} onChange={e => upStyle({ color: e.target.value })}
                        className="w-8 h-7 rounded border border-border cursor-pointer bg-secondary p-0.5" />
                      <input value={el.styles.color || ""} onChange={e => upStyle({ color: e.target.value })}
                        className="flex-1 bg-secondary border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">Фон</label>
                    <div className="flex gap-1">
                      <input type="color" value={el.styles.bg && el.styles.bg !== "transparent" ? el.styles.bg : "#000000"}
                        onChange={e => upStyle({ bg: e.target.value })}
                        className="w-8 h-7 rounded border border-border cursor-pointer bg-secondary p-0.5" />
                      <input value={el.styles.bg || ""} onChange={e => upStyle({ bg: e.target.value })}
                        className="flex-1 bg-secondary border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none" placeholder="transparent" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {inp("Размер шрифта", el.styles.fontSize, v => upStyle({ fontSize: v }), "number")}
                  <div>
                    <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">Жирность</label>
                    <select value={el.styles.fontWeight || "400"} onChange={e => upStyle({ fontWeight: e.target.value })}
                      className="w-full bg-secondary border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none">
                      <option value="200">Thin 200</option>
                      <option value="300">Light 300</option>
                      <option value="400">Regular 400</option>
                      <option value="600">SemiBold 600</option>
                      <option value="700">Bold 700</option>
                      <option value="800">ExtraBold 800</option>
                      <option value="900">Black 900</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">Выравнивание</label>
                  <div className="flex gap-1">
                    {(["left","center","right"] as const).map(a => (
                      <button key={a} onClick={() => upStyle({ textAlign: a })}
                        className={`flex-1 py-1 text-xs rounded transition ${el.styles.textAlign === a ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>
                        {a === "left" ? "⟵" : a === "center" ? "⟺" : "⟶"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {inp("Межстрочный (lh)", el.styles.lineHeight, v => upStyle({ lineHeight: v }), "number", "1.5")}
                  {inp("Межбуквенный", el.styles.letterSpacing, v => upStyle({ letterSpacing: v }), "number", "0")}
                </div>
              </>
            )}
            {el.type === "shape" && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">Заливка</label>
                  <div className="flex gap-1">
                    <input type="color" value={el.styles.shapeFill || "#7c3aed"} onChange={e => upStyle({ shapeFill: e.target.value })}
                      className="w-8 h-7 rounded border border-border cursor-pointer bg-secondary p-0.5" />
                    <input value={el.styles.shapeFill || ""} onChange={e => upStyle({ shapeFill: e.target.value })}
                      className="flex-1 bg-secondary border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">Граница</label>
                  <div className="flex gap-1">
                    <input type="color" value={el.styles.shapeBorder || "#ffffff"} onChange={e => upStyle({ shapeBorder: e.target.value })}
                      className="w-8 h-7 rounded border border-border cursor-pointer bg-secondary p-0.5" />
                    <input type="number" value={el.styles.shapeBorderW || 0} onChange={e => upStyle({ shapeBorderW: Number(e.target.value) })}
                      className="flex-1 bg-secondary border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none" placeholder="0" />
                  </div>
                </div>
              </div>
            )}
            {el.type === "button" && (
              <div>
                <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">Вариант кнопки</label>
                <select value={el.styles.btnVariant || "filled"} onChange={e => upStyle({ btnVariant: e.target.value as any })}
                  className="w-full bg-secondary border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none">
                  <option value="filled">Filled (заливка)</option>
                  <option value="outline">Outline (контур)</option>
                  <option value="ghost">Ghost (без рамки)</option>
                </select>
              </div>
            )}
            {el.type === "path" && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">Заливка пути</label>
                    <div className="flex gap-1">
                      <input type="color" value={el.styles.pathFill && el.styles.pathFill !== "none" ? el.styles.pathFill : "#7c3aed"}
                        onChange={e => upStyle({ pathFill: e.target.value })}
                        className="w-8 h-7 rounded border border-border cursor-pointer bg-secondary p-0.5" />
                      <input value={el.styles.pathFill || ""} onChange={e => upStyle({ pathFill: e.target.value })}
                        className="flex-1 bg-secondary border border-border rounded-lg px-1.5 py-1 text-xs text-foreground focus:outline-none" placeholder="none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">Обводка</label>
                    <div className="flex gap-1">
                      <input type="color" value={el.styles.pathStroke && el.styles.pathStroke !== "transparent" ? el.styles.pathStroke : "#ffffff"}
                        onChange={e => upStyle({ pathStroke: e.target.value })}
                        className="w-8 h-7 rounded border border-border cursor-pointer bg-secondary p-0.5" />
                      <input type="number" value={el.styles.pathStrokeW || 2} onChange={e => upStyle({ pathStrokeW: Number(e.target.value) })}
                        className="flex-1 bg-secondary border border-border rounded-lg px-1.5 py-1 text-xs text-foreground focus:outline-none" placeholder="px" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground font-medium">Замкнутый путь</span>
                  <button onClick={() => upStyle({ pathClosed: !el.styles.pathClosed })}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${el.styles.pathClosed ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
                    {el.styles.pathClosed ? "Замкнут" : "Открыт"}
                  </button>
                </div>
              </>
            )}
            {el.type === "group" && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">Фон группы</label>
                  <div className="flex gap-1">
                    <input type="color" value={el.styles.bg && el.styles.bg !== "transparent" ? el.styles.bg : "#000000"}
                      onChange={e => upStyle({ bg: e.target.value })}
                      className="w-8 h-7 rounded border border-border cursor-pointer bg-secondary p-0.5" />
                    <input value={el.styles.bg || ""} onChange={e => upStyle({ bg: e.target.value })}
                      className="flex-1 bg-secondary border border-border rounded-lg px-1.5 py-1 text-xs text-foreground focus:outline-none" placeholder="transparent" />
                  </div>
                </div>
                {inp("Скругление (px)", el.styles.borderRadius, v => upStyle({ borderRadius: v }), "number")}
              </div>
            )}
            {el.type !== "path" && el.type !== "group" && (
            <div className="grid grid-cols-2 gap-2">
              {inp("Скругление (px)", el.styles.borderRadius, v => upStyle({ borderRadius: v }), "number")}
              {inp("Прозрачность (%)", el.styles.opacity, v => upStyle({ opacity: v }), "number", "100")}
            </div>
            )}
            {inp("Тень (box-shadow)", el.styles.boxShadow, v => upStyle({ boxShadow: v }), "text", "0 4px 24px rgba(0,0,0,0.4)")}
          </>
        )}

        {tab === "anim" && (
          <>
            <div>
              <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">Триггер анимации</label>
              <select value={el.styles.animTrigger || "none"} onChange={e => upStyle({ animTrigger: e.target.value as AnimTrigger })}
                className="w-full bg-secondary border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none">
                <option value="none">Без анимации</option>
                <option value="viewport">Появление в области видимости</option>
                <option value="scroll">При прокрутке / Параллакс</option>
                <option value="hover">При наведении мышкой</option>
                <option value="click">По клику</option>
              </select>
            </div>
            {el.styles.animTrigger && el.styles.animTrigger !== "none" && (
              <>
                <div>
                  <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">Эффект</label>
                  <select value={el.styles.animEffect || "fade"} onChange={e => { upStyle({ animEffect: e.target.value as AnimEffect }); setAnimPreview(false); }}
                    className="w-full bg-secondary border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none">
                    <option value="fade">Fade (появление/исчезание)</option>
                    <option value="slide-up">Slide Up — вылет снизу</option>
                    <option value="slide-down">Slide Down — вылет сверху</option>
                    <option value="slide-left">Slide Left — вылет справа</option>
                    <option value="slide-right">Slide Right — вылет слева</option>
                    <option value="zoom-in">Zoom In — увеличение</option>
                    <option value="zoom-out">Zoom Out — уменьшение</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {inp("Длительность (ms)", el.styles.animDuration, v => upStyle({ animDuration: v }), "number", "600")}
                  {inp("Задержка (ms)", el.styles.animDelay, v => upStyle({ animDelay: v }), "number", "0")}
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">Easing</label>
                  <select value={el.styles.animEasing || "cubic-bezier(0.4,0,0.2,1)"} onChange={e => upStyle({ animEasing: e.target.value })}
                    className="w-full bg-secondary border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none">
                    <option value="cubic-bezier(0.4,0,0.2,1)">Ease (Material — по умолчанию)</option>
                    <option value="ease-in-out">Ease In-Out (плавный)</option>
                    <option value="ease-out">Ease Out (замедление)</option>
                    <option value="ease-in">Ease In (разгон)</option>
                    <option value="linear">Linear (равномерный)</option>
                    <option value="cubic-bezier(0.34,1.56,0.64,1)">Spring (пружина)</option>
                    <option value="cubic-bezier(0.68,-0.55,0.27,1.55)">Back (отскок)</option>
                    <option value="cubic-bezier(0.87,0,0.13,1)">Expo (экспонента)</option>
                  </select>
                </div>
                {el.styles.animTrigger === "scroll" && (
                  inp("Скорость параллакса", el.styles.parallaxSpeed, v => upStyle({ parallaxSpeed: v }), "number", "0.3")
                )}
                {/* Preview button + mini box */}
                <div className="relative bg-secondary/40 rounded-lg overflow-hidden border border-border/50 p-2">
                  <div className="flex items-center justify-center h-12 mb-2">
                    <div
                      style={{
                        width: 40, height: 40, borderRadius: 8,
                        background: el.styles.shapeFill || (el.styles.bg && el.styles.bg !== "transparent" ? el.styles.bg : "#7c3aed"),
                        transition: animPreview
                          ? `all ${el.styles.animDuration || 600}ms ${el.styles.animEasing || "cubic-bezier(0.4,0,0.2,1)"} ${el.styles.animDelay || 0}ms`
                          : "none",
                        ...(animPreview
                          ? { opacity: 1, transform: "none" }
                          : (ANIM_PREVIEW_INITIAL[el.styles.animEffect || "fade"] || { opacity: 0.2 })),
                      }}
                    />
                  </div>
                  <button onClick={() => {
                      setAnimPreview(false);
                      requestAnimationFrame(() => requestAnimationFrame(() => {
                        setAnimPreview(true);
                        const total = (el.styles.animDuration || 600) + (el.styles.animDelay || 0) + 300;
                        setTimeout(() => setAnimPreview(false), total);
                      }));
                    }}
                    className="w-full py-1 border border-primary/30 bg-primary/8 hover:bg-primary/15 rounded text-[11px] text-primary font-semibold transition">
                    <Play size={10} className="inline-block mr-1" />{animPreview ? "воспроизводится..." : "Предпросмотр анимации"}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Canvas Settings Panel ────────────────────────────────────────────────────

function CanvasSettingsPanel({ data, onChange }: { data: ZeroBlockData; onChange: (patch: Partial<ZeroBlockData>) => void }) {
  return (
    <div className="p-3 space-y-3">
      <div>
        <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">Высота холста (px)</label>
        <input type="number" value={data.canvasHeight} onChange={e => onChange({ canvasHeight: Number(e.target.value) })}
          className="w-full bg-secondary border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary" />
      </div>
      <div>
        <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">Фон холста</label>
        <div className="flex gap-1">
          <input type="color" value={data.bg && data.bg !== "transparent" ? data.bg : "#0c0c1d"}
            onChange={e => onChange({ bg: e.target.value })}
            className="w-8 h-7 rounded border border-border cursor-pointer bg-secondary p-0.5" />
          <input value={data.bg || ""} onChange={e => onChange({ bg: e.target.value })}
            className="flex-1 bg-secondary border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none" placeholder="transparent" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground font-medium">Показать сетку</span>
        <button onClick={() => onChange({ showGrid: !data.showGrid })}
          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${data.showGrid ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
          {data.showGrid ? "Вкл" : "Выкл"}
        </button>
      </div>
      <div>
        <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">Колонок</label>
        <input type="number" value={data.gridCols || 12} onChange={e => onChange({ gridCols: Number(e.target.value) })}
          className="w-full bg-secondary border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none" min={1} max={24} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">Промежуток (px)</label>
          <input type="number" value={data.gridGutter || 24} onChange={e => onChange({ gridGutter: Number(e.target.value) })}
            className="w-full bg-secondary border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none" />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">Отступ (px)</label>
          <input type="number" value={data.gridMargin || 80} onChange={e => onChange({ gridMargin: Number(e.target.value) })}
            className="w-full bg-secondary border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none" />
        </div>
      </div>
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<ZeroElementType, string> = {
  text: "Текст", image: "Изображение", button: "Кнопка",
  shape: "Фигура", html: "HTML", video: "Видео", form: "Форма",
  path: "Путь (SVG)", group: "Группа",
};
const TYPE_ICONS: Record<ZeroElementType, ReactNode> = {
  text: <Type size={13} />, image: <Image size={13} />, button: <Square size={13} />,
  shape: <Star size={13} />, html: <Code size={13} />, video: <Play size={13} />,
  form: <FileText size={13} />, path: <Pencil size={13} />, group: <Layers size={13} />,
};

const BP_ICONS: Record<Breakpoint, ReactNode> = {
  desktop: <Monitor size={13} />, tablet: <Tablet size={13} />, mobile: <Smartphone size={13} />,
};

// ─── Main ZeroBlockEditor ─────────────────────────────────────────────────────

interface ZeroBlockEditorProps {
  data: ZeroBlockData;
  onChange: (data: ZeroBlockData) => void;
  onClose: () => void;
  blockName?: string;
  popupBlocks?: { id: string; popupId: string; title: string }[];
}

export default function ZeroBlockEditor({ data, onChange, onClose, blockName = "Zero Block", popupBlocks }: ZeroBlockEditorProps) {
  const [elements, setElements] = useState<ZeroElement[]>(data.elements);
  const [canvasH, setCanvasH] = useState(data.canvasHeight || 600);
  const [canvasBg, setCanvasBg] = useState(data.bg || "transparent");
  const [gridCols, setGridCols] = useState(data.gridCols || 12);
  const [gridGutter, setGridGutter] = useState(data.gridGutter || 24);
  const [gridMargin, setGridMargin] = useState(data.gridMargin || 80);
  const [showGrid, setShowGrid] = useState(data.showGrid || false);
  const [bp, setBp] = useState<Breakpoint>("desktop");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rightPanel, setRightPanel] = useState<"props"|"canvas">("props");
  const [dragging, setDragging] = useState<{
    id: string; startX: number; startY: number; origX: number; origY: number;
    allOrigPositions: Record<string, { x: number; y: number }>;
  } | null>(null);
  const [resizing, setResizing] = useState<{ id: string; handle: ResizeHandle; startX: number; startY: number; origX: number; origY: number; origW: number; origH: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasScale, setCanvasScale] = useState(1);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [saved, setSaved] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [drawingPathId, setDrawingPathId] = useState<string | null>(null);
  const [drawPreviewPoint, setDrawPreviewPoint] = useState<{ x: number; y: number } | null>(null);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [snapGuides, setSnapGuides] = useState<{ x?: number; y?: number }>({});
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editPointsPath, setEditPointsPath] = useState<string | null>(null);
  const [draggingPoint, setDraggingPoint] = useState<{
    pathId: string; ptIdx: number; type: "anchor" | "cp1" | "cp2";
    startCX: number; startCY: number; origPts: PathPoint[];
  } | null>(null);
  const clipboard = useRef<ZeroElement[]>([]);
  const drawPendingDown = useRef<{ canvasX: number; canvasY: number; clientX: number; clientY: number } | null>(null);

  const canvasWidth = CANVAS_WIDTHS[bp];

  // ── Derived data ──
  const buildData = useCallback((): ZeroBlockData => ({
    elements,
    canvasHeight: canvasH,
    bg: canvasBg,
    gridCols,
    gridGutter,
    gridMargin,
    showGrid,
  }), [elements, canvasH, canvasBg, gridCols, gridGutter, gridMargin, showGrid]);

  // ── Auto-save debounce ──
  const saveTimer = useRef<any>(null);
  const triggerSave = useCallback(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      onChange(buildData());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 800);
  }, [buildData, onChange]);

  useEffect(() => { triggerSave(); }, [elements, canvasH, canvasBg, gridCols, gridGutter, gridMargin, showGrid]);

  // ── Add element ──
  const addElement = (type: ZeroElementType) => {
    const el = makeElement(type, 60, 60);
    el.zIndex = Math.max(0, ...elements.map(e => e.zIndex)) + 1;
    setElements(prev => [...prev, el]);
    setSelectedIds([el.id]);
  };

  // ── Update element ──
  const updateElement = (id: string, patch: Partial<ZeroElement>) => {
    setElements(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
  };

  // ── Delete selected ──
  const deleteSelected = useCallback(() => {
    setElements(prev => prev.filter(e => !selectedIds.includes(e.id)));
    setSelectedIds([]);
  }, [selectedIds]);

  // ── Duplicate selected ──
  const duplicateSelected = useCallback(() => {
    const newEls: ZeroElement[] = [];
    selectedIds.forEach(id => {
      const el = elements.find(e => e.id === id);
      if (!el) return;
      const copy: ZeroElement = {
        ...JSON.parse(JSON.stringify(el)),
        id: uid(),
        desktop: { ...el.desktop, x: el.desktop.x + 20, y: el.desktop.y + 20 },
        zIndex: el.zIndex + 1,
      };
      newEls.push(copy);
    });
    setElements(prev => [...prev, ...newEls]);
    setSelectedIds(newEls.map(e => e.id));
  }, [selectedIds, elements]);

  // ── Group selected elements (Ctrl+G) ──
  const groupSelected = useCallback(() => {
    if (selectedIds.length < 2) return;
    const selected = elements.filter(e => selectedIds.includes(e.id));
    const minX = Math.min(...selected.map(e => getBPData(e, bp).x));
    const minY = Math.min(...selected.map(e => getBPData(e, bp).y));
    const maxX = Math.max(...selected.map(e => getBPData(e, bp).x + getBPData(e, bp).w));
    const maxY = Math.max(...selected.map(e => getBPData(e, bp).y + getBPData(e, bp).h));
    const group = makeElement("group", minX, minY);
    group.desktop = { x: minX, y: minY, w: maxX - minX, h: maxY - minY, visible: true };
    group.content = { ...group.content, childIds: selectedIds };
    group.zIndex = Math.max(...selected.map(e => e.zIndex)) + 1;
    setElements(prev => [...prev, group]);
    setSelectedIds([group.id]);
  }, [selectedIds, elements, bp]);

  // ── Align selected elements ──
  type AlignAxis = "left" | "center-h" | "right" | "top" | "center-v" | "bottom";
  const alignElements = useCallback((axis: AlignAxis) => {
    if (selectedIds.length === 0) return;
    const sel = elements.filter(e => selectedIds.includes(e.id));
    const multi = selectedIds.length > 1;
    const refLeft = multi ? Math.min(...sel.map(e => getBPData(e, bp).x)) : 0;
    const refTop = multi ? Math.min(...sel.map(e => getBPData(e, bp).y)) : 0;
    const refRight = multi ? Math.max(...sel.map(e => getBPData(e, bp).x + getBPData(e, bp).w)) : canvasWidth;
    const refBottom = multi ? Math.max(...sel.map(e => getBPData(e, bp).y + getBPData(e, bp).h)) : canvasH;
    const refW = refRight - refLeft;
    const refH = refBottom - refTop;
    setElements(prev => prev.map(el => {
      if (!selectedIds.includes(el.id)) return el;
      const d = getBPData(el, bp);
      let patch: Partial<BPData> = {};
      if (axis === "left")     patch.x = refLeft;
      if (axis === "center-h") patch.x = refLeft + (refW - d.w) / 2;
      if (axis === "right")    patch.x = refRight - d.w;
      if (axis === "top")      patch.y = refTop;
      if (axis === "center-v") patch.y = refTop + (refH - d.h) / 2;
      if (axis === "bottom")   patch.y = refBottom - d.h;
      return setBPData(el, bp, patch);
    }));
  }, [selectedIds, elements, bp, canvasWidth, canvasH]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        if (drawingPathId) return;
        deleteSelected();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "d") { e.preventDefault(); duplicateSelected(); }
      if ((e.metaKey || e.ctrlKey) && e.key === "a") { e.preventDefault(); setSelectedIds(elements.map(e => e.id)); }
      if ((e.metaKey || e.ctrlKey) && e.key === "g") { e.preventDefault(); groupSelected(); }
      // ── Copy / Paste ──
      if ((e.metaKey || e.ctrlKey) && e.key === "c" && selectedIds.length > 0) {
        e.preventDefault();
        clipboard.current = selectedIds
          .map(id => elements.find(el => el.id === id))
          .filter(Boolean)
          .map(el => JSON.parse(JSON.stringify(el))) as ZeroElement[];
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "v") {
        e.preventDefault();
        if (clipboard.current.length === 0) return;
        const maxZ = Math.max(0, ...elements.map(el => el.zIndex));
        const pasted = clipboard.current.map((el, i) => ({
          ...JSON.parse(JSON.stringify(el)),
          id: uid(),
          desktop: { ...el.desktop, x: el.desktop.x + 30, y: el.desktop.y + 30 },
          zIndex: maxZ + i + 1,
        })) as ZeroElement[];
        setElements(prev => [...prev, ...pasted]);
        setSelectedIds(pasted.map(el => el.id));
      }
      if (e.key === "Escape") {
        if (drawingPathId) { setDrawingPathId(null); setDrawPreviewPoint(null); drawPendingDown.current = null; }
        else if (editPointsPath) { setEditPointsPath(null); }
        else if (editingTextId) { setEditingTextId(null); }
        else setSelectedIds([]);
      }
      // ── Arrow key nudge ──
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key) && selectedIds.length > 0 && !drawingPathId) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        setElements(prev => prev.map(el => {
          if (!selectedIds.includes(el.id)) return el;
          const cur = getBPData(el, bp);
          return setBPData(el, bp, { x: Math.max(0, cur.x + dx), y: Math.max(0, cur.y + dy) });
        }));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [deleteSelected, duplicateSelected, elements, groupSelected, drawingPathId, selectedIds, bp, editPointsPath, editingTextId]);

  // ── Snap helper ──
  const snapX = useCallback((x: number): { snapped: number; guide?: number } => {
    if (!snapEnabled) return { snapped: x };
    const colW = (canvasWidth - 2 * gridMargin - Math.max(0, gridCols - 1) * gridGutter) / gridCols;
    const snapPoints: number[] = [0, gridMargin, canvasWidth - gridMargin, canvasWidth / 2];
    for (let i = 0; i <= gridCols; i++) {
      snapPoints.push(gridMargin + i * (colW + gridGutter));
    }
    const THRESHOLD = 8;
    let closest = x;
    let guide: number | undefined;
    let minDist = THRESHOLD;
    for (const pt of snapPoints) {
      const dist = Math.abs(x - pt);
      if (dist < minDist) { minDist = dist; closest = pt; guide = pt; }
    }
    return { snapped: closest, guide };
  }, [snapEnabled, canvasWidth, gridMargin, gridCols, gridGutter]);

  const snapY = useCallback((y: number): { snapped: number; guide?: number } => {
    if (!snapEnabled) return { snapped: y };
    const GRID = 8;
    const snapped = Math.round(y / GRID) * GRID;
    const guide = Math.abs(y - snapped) < 4 ? snapped : undefined;
    return { snapped, guide };
  }, [snapEnabled]);

  // ── Mouse drag on canvas ──
  const handleElementMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (drawingPathId) return;
    const el = elements.find(el => el.id === id);
    if (!el || el.locked) return;
    if (e.shiftKey) {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
      return;
    }
    const activeIds = selectedIds.includes(id) ? selectedIds : [id];
    if (!selectedIds.includes(id)) setSelectedIds([id]);
    const bpData = getBPData(el, bp);
    const allOrigPositions: Record<string, { x: number; y: number }> = {};
    activeIds.forEach(sid => {
      const sel = elements.find(e => e.id === sid);
      if (sel) { const d = getBPData(sel, bp); allOrigPositions[sid] = { x: d.x, y: d.y }; }
    });
    setDragging({ id, startX: e.clientX, startY: e.clientY, origX: bpData.x, origY: bpData.y, allOrigPositions });
  };

  const handleResizeMouseDown = (e: React.MouseEvent, id: string, handle: ResizeHandle) => {
    e.stopPropagation();
    e.preventDefault();
    const el = elements.find(el => el.id === id);
    if (!el) return;
    const bpData = getBPData(el, bp);
    setResizing({ id, handle, startX: e.clientX, startY: e.clientY, origX: bpData.x, origY: bpData.y, origW: bpData.w, origH: bpData.h });
  };

  useEffect(() => {
    if (!dragging && !resizing) return;
    const scale = zoom / 100;

    const onMove = (e: MouseEvent) => {
      if (dragging) {
        const dx = (e.clientX - dragging.startX) / scale;
        const dy = (e.clientY - dragging.startY) / scale;
        const rawX = Math.max(0, dragging.origX + dx);
        const rawY = Math.max(0, dragging.origY + dy);
        const { snapped: newX, guide: gx } = snapX(rawX);
        const { snapped: newY, guide: gy } = snapY(rawY);
        setSnapGuides({ x: gx, y: gy });

        const mainDx = newX - dragging.origX;
        const mainDy = newY - dragging.origY;

        setElements(prev => prev.map(el => {
          const origPos = dragging.allOrigPositions[el.id];
          if (!origPos) return el;
          const snapXr = snapX(Math.max(0, origPos.x + mainDx));
          const snapYr = snapY(Math.max(0, origPos.y + mainDy));
          return setBPData(el, bp, { x: snapXr.snapped, y: snapYr.snapped });
        }));
      }
      if (resizing) {
        const dx = (e.clientX - resizing.startX) / scale;
        const dy = (e.clientY - resizing.startY) / scale;
        let { origX: x, origY: y, origW: w, origH: h } = resizing;
        const h_ = resizing.handle;
        if (h_.includes("e")) w = Math.max(20, w + dx);
        if (h_.includes("s")) h = Math.max(20, h + dy);
        if (h_.includes("w")) { w = Math.max(20, w - dx); x = resizing.origX + resizing.origW - w; }
        if (h_.includes("n")) { h = Math.max(20, h - dy); y = resizing.origY + resizing.origH - h; }
        const sw = snapEnabled ? Math.round(w / 8) * 8 : w;
        const sh = snapEnabled ? Math.round(h / 8) * 8 : h;
        setElements(prev => prev.map(el => {
          if (el.id !== resizing.id) return el;
          return setBPData(el, bp, { x: Math.round(x), y: Math.round(y), w: Math.round(sw), h: Math.round(sh) });
        }));
      }
    };

    const onUp = () => { setDragging(null); setResizing(null); setSnapGuides({}); };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
  }, [dragging, resizing, bp, zoom, snapX, snapY, snapEnabled]);

  // ── Bezier point drag ──
  useEffect(() => {
    if (!draggingPoint) return;
    const scale = zoom / 100;
    const onMove = (e: MouseEvent) => {
      const dx = (e.clientX - draggingPoint.startCX) / scale;
      const dy = (e.clientY - draggingPoint.startCY) / scale;
      setElements(prev => prev.map(el => {
        if (el.id !== draggingPoint.pathId) return el;
        const pts = [...draggingPoint.origPts.map(p => ({ ...p, cp1: p.cp1 ? { ...p.cp1 } : undefined, cp2: p.cp2 ? { ...p.cp2 } : undefined }))];
        const pt = { ...pts[draggingPoint.ptIdx] };
        if (draggingPoint.type === "anchor") {
          pt.x = Math.round(draggingPoint.origPts[draggingPoint.ptIdx].x + dx);
          pt.y = Math.round(draggingPoint.origPts[draggingPoint.ptIdx].y + dy);
          if (pt.cp1) pt.cp1 = { x: pt.cp1.x + dx, y: pt.cp1.y + dy };
          if (pt.cp2) pt.cp2 = { x: pt.cp2.x + dx, y: pt.cp2.y + dy };
        } else if (draggingPoint.type === "cp1") {
          const orig = draggingPoint.origPts[draggingPoint.ptIdx];
          pt.cp1 = { x: Math.round((orig.cp1 || orig).x + dx), y: Math.round((orig.cp1 || orig).y + dy) };
        } else {
          const orig = draggingPoint.origPts[draggingPoint.ptIdx];
          pt.cp2 = { x: Math.round((orig.cp2 || orig).x + dx), y: Math.round((orig.cp2 || orig).y + dy) };
        }
        pts[draggingPoint.ptIdx] = pt;
        return { ...el, content: { ...el.content, pathPoints: pts } };
      }));
    };
    const onUp = () => setDraggingPoint(null);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
  }, [draggingPoint, zoom]);

  // ── Sort by zIndex ──
  const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
  const selectedEl = selectedIds.length === 1 ? elements.find(e => e.id === selectedIds[0]) : null;

  // ── Layer move ──
  const moveLayer = (id: string, dir: "up" | "down") => {
    setElements(prev => {
      const sorted = [...prev].sort((a, b) => a.zIndex - b.zIndex);
      const idx = sorted.findIndex(e => e.id === id);
      const swapIdx = dir === "up" ? idx + 1 : idx - 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) return prev;
      const temp = sorted[idx].zIndex;
      sorted[idx] = { ...sorted[idx], zIndex: sorted[swapIdx].zIndex };
      sorted[swapIdx] = { ...sorted[swapIdx], zIndex: temp };
      return prev.map(e => { const found = sorted.find(s => s.id === e.id); return found || e; });
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-[#0a0a12] text-foreground overflow-hidden">
      {/* ── Top Bar ── */}
      <div className="bg-card border-b border-border flex-shrink-0 z-10 overflow-x-auto">
        <div className="flex items-center gap-2 px-3 py-2.5 min-w-max">
          <button onClick={() => { onChange(buildData()); onClose(); }}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition px-2 py-1 rounded hover:bg-secondary flex-shrink-0">
            <ArrowLeft size={14} /> Назад
          </button>
          <div className="w-px h-5 bg-border flex-shrink-0" />
          <span className="text-sm font-bold text-foreground flex-shrink-0 max-w-[120px] truncate">{blockName}</span>
          <div className="w-px h-5 bg-border flex-shrink-0" />

          {/* Breakpoints */}
          <div className="flex gap-0.5 bg-secondary rounded-lg p-0.5 flex-shrink-0">
            {(["desktop","tablet","mobile"] as Breakpoint[]).map(b => (
              <button key={b} onClick={() => setBp(b)}
                className={`px-2 py-1 rounded text-xs font-medium transition flex items-center gap-1 ${bp === b ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}>
                {BP_ICONS[b]} <span className="hidden sm:inline">{BP_LABELS[b]}</span>
                <span className="text-[10px] opacity-60">{CANVAS_WIDTHS[b]}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
            {/* Snap toggle */}
            <button onClick={() => setSnapEnabled(s => !s)} title="Привязка к сетке"
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition ${snapEnabled ? "bg-primary/15 text-primary border border-primary/30" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              <Grid size={12} /> Snap
            </button>
            {/* Grid toggle */}
            <button onClick={() => setShowGrid(g => !g)} title="Показать/скрыть сетку"
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition ${showGrid ? "bg-primary/15 text-primary border border-primary/30" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              <Grid size={12} /> Сетка
            </button>
            {/* Zoom */}
            <div className="flex items-center gap-0.5 bg-secondary rounded-lg px-2 py-1">
              <button onClick={() => setZoom(z => Math.max(25, z - 10))} className="text-muted-foreground hover:text-foreground text-xs w-5">−</button>
              <span className="text-xs text-muted-foreground w-8 text-center">{zoom}%</span>
              <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="text-muted-foreground hover:text-foreground text-xs w-5">+</button>
            </div>
            {saved && <span className="text-[11px] text-emerald-400 hidden sm:flex items-center gap-1"><Check size={10} /> Сохранено</span>}
            <button onClick={() => { onChange(buildData()); onClose(); }}
              className="px-3 py-1.5 bg-primary rounded-lg text-white text-xs font-bold hover:bg-primary/80 transition">
              Готово
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Panel: Toolbox + Layers ── */}
        <div className="w-48 flex-shrink-0 bg-card border-r border-border flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            {/* Add elements */}
            <div className="px-2.5 pt-3 pb-2">
              <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2 px-0.5">Добавить</div>
              <div className="grid grid-cols-3 gap-1">
                {(Object.keys(TYPE_LABELS) as ZeroElementType[]).map(type => (
                  <button key={type} onClick={() => addElement(type)} title={TYPE_LABELS[type]}
                    className="flex flex-col items-center gap-0.5 px-1 py-2 bg-secondary/60 hover:bg-secondary border border-border/50 hover:border-primary/30 rounded-lg text-muted-foreground hover:text-foreground transition">
                    <span className="text-[15px] leading-none">{TYPE_ICONS[type]}</span>
                    <span className="text-[9px] leading-tight text-center truncate w-full">{TYPE_LABELS[type]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-border mx-2.5 my-1" />

            {/* Layers */}
            <div>
              <div className="px-2.5 py-2 text-[10px] text-muted-foreground font-bold uppercase tracking-wider flex items-center justify-between">
                <span>Слои ({elements.length})</span>
                {selectedIds.length > 0 && (
                  <button onClick={deleteSelected} className="text-red-400/60 hover:text-red-400"><X size={10} /></button>
                )}
              </div>
              <div className="space-y-0.5 px-2 pb-3">
                {[...sorted].reverse().map((el) => {
                  const bpD = getBPData(el, bp);
                  const isSel = selectedIds.includes(el.id);
                  return (
                    <div key={el.id} onClick={() => setSelectedIds([el.id])}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition text-xs group ${isSel ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
                      <span className="text-[12px] flex-shrink-0">{TYPE_ICONS[el.type]}</span>
                      <span className="flex-1 truncate text-[11px]">{TYPE_LABELS[el.type]} {el.id.slice(0, 4)}</span>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 flex-shrink-0">
                        <button onClick={e => { e.stopPropagation(); moveLayer(el.id, "up"); }} title="Выше" className="hover:text-foreground"><ChevronUp size={10} /></button>
                        <button onClick={e => { e.stopPropagation(); moveLayer(el.id, "down"); }} title="Ниже" className="hover:text-foreground"><ChevronDown size={10} /></button>
                        <button onClick={e => { e.stopPropagation(); updateElement(el.id, { locked: !el.locked }); }}
                          title={el.locked ? "Разблокировать" : "Заблокировать"}
                          className={el.locked ? "text-amber-400" : "hover:text-foreground"}>
                          {el.locked ? <Lock size={10} /> : <LockOpen size={10} />}
                        </button>
                        <button onClick={e => { e.stopPropagation(); updateElement(el.id, setBPData(el, bp, { visible: !bpD.visible })); }}
                          className={bpD.visible ? "hover:text-foreground" : "text-muted-foreground/40"}>
                          {bpD.visible ? <Eye size={10} /> : <EyeOff size={10} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
                {elements.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground/40 text-[11px]">
                    Нет элементов.<br />Добавьте выше ↑
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Center: Canvas ── */}
        <div className="flex-1 overflow-auto bg-[#0e0e18] flex items-start justify-center p-8"
          style={{ cursor: dragging ? "grabbing" : "default" }}
          onClick={() => { if (!drawingPathId) { setSelectedIds([]); setEditPointsPath(null); setEditingTextId(null); } }}>
          <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}>
            {/* Drawing mode banner */}
            {drawingPathId && (
              <div className="text-center py-1 mb-2 text-[11px] text-primary font-semibold bg-primary/10 border border-primary/20 rounded-lg">
                <Pencil size={11} className="inline-block mr-1" />Режим рисования — клик = прямой сегмент &nbsp;·&nbsp; <span className="text-emerald-400">клик+тяни = безье</span> &nbsp;·&nbsp;
                <span className="opacity-70">2× клик = завершить &nbsp;·&nbsp; Esc = выйти</span>
              </div>
            )}
            {/* Point editing mode banner */}
            {editPointsPath && (
              <div className="text-center py-1 mb-2 text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <Edit2 size={11} className="inline-block mr-1" />Редактор точек — тяни якоря (синий/фиолет.) &nbsp;·&nbsp; тяни ручки (зел./жёлт.) для безье &nbsp;·&nbsp;
                <span className="opacity-70">2× клик по точке = L/C &nbsp;·&nbsp; Esc = выйти</span>
              </div>
            )}
            <div ref={canvasRef} className="relative select-none shadow-2xl"
              style={{
                width: canvasWidth,
                height: canvasH,
                background: canvasBg && canvasBg !== "transparent" ? canvasBg : "#0c0c1d",
                outline: drawingPathId ? "2px solid rgba(124,58,237,0.5)" : "1px solid rgba(255,255,255,0.06)",
                cursor: drawingPathId ? "crosshair" : "default",
              }}
              onMouseDown={e => {
                if (!drawingPathId) return;
                const rect = canvasRef.current?.getBoundingClientRect();
                if (!rect) return;
                const scale = zoom / 100;
                const cx = Math.round((e.clientX - rect.left) / scale);
                const cy = Math.round((e.clientY - rect.top) / scale);
                drawPendingDown.current = { canvasX: cx, canvasY: cy, clientX: e.clientX, clientY: e.clientY };
              }}
              onMouseUp={e => {
                if (!drawingPathId || !drawPendingDown.current) return;
                e.stopPropagation();
                const rect = canvasRef.current?.getBoundingClientRect();
                if (!rect) return;
                const scale = zoom / 100;
                const { canvasX: x, canvasY: y, clientX: sx, clientY: sy } = drawPendingDown.current;
                const ddx = e.clientX - sx, ddy = e.clientY - sy;
                const dist = Math.sqrt(ddx * ddx + ddy * ddy);
                drawPendingDown.current = null;
                setElements(prev => prev.map(el => {
                  if (el.id !== drawingPathId) return el;
                  const pts = el.content.pathPoints || [];
                  const isFirst = pts.length === 0;
                  let newPt: PathPoint;
                  if (!isFirst && dist > 5) {
                    // Bezier point: drag defines tangent
                    const tdx = ddx / scale / 3, tdy = ddy / scale / 3;
                    newPt = {
                      x, y, type: "C",
                      cp2: { x: x - tdx, y: y - tdy },
                      cp1: { x: x + tdx, y: y + tdy },
                    };
                  } else {
                    newPt = { x, y, type: isFirst ? "M" : "L" };
                  }
                  return { ...el, content: { ...el.content, pathPoints: [...pts, newPt] } };
                }));
              }}
              onDoubleClick={e => {
                if (!drawingPathId) return;
                e.stopPropagation();
                drawPendingDown.current = null;
                setDrawingPathId(null);
                setDrawPreviewPoint(null);
              }}
              onMouseMove={e => {
                if (!drawingPathId) return;
                const rect = canvasRef.current?.getBoundingClientRect();
                if (!rect) return;
                const scale = zoom / 100;
                setDrawPreviewPoint({
                  x: Math.round((e.clientX - rect.left) / scale),
                  y: Math.round((e.clientY - rect.top) / scale),
                });
              }}
            >

              {/* Grid overlay */}
              {showGrid && (
                <GridOverlay cols={gridCols} gutter={gridGutter} margin={gridMargin}
                  width={canvasWidth} height={canvasH} />
              )}

              {/* Snap guides overlay */}
              {(dragging || resizing) && (snapGuides.x !== undefined || snapGuides.y !== undefined) && (
                <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 9998 }}>
                  {snapGuides.x !== undefined && (
                    <line x1={snapGuides.x} y1={0} x2={snapGuides.x} y2="100%"
                      stroke="#7c3aed" strokeWidth={1} strokeDasharray="4 3" opacity={0.7} />
                  )}
                  {snapGuides.y !== undefined && (
                    <line x1={0} y1={snapGuides.y} x2="100%" y2={snapGuides.y}
                      stroke="#7c3aed" strokeWidth={1} strokeDasharray="4 3" opacity={0.7} />
                  )}
                </svg>
              )}

              {/* Canvas center guide (always) */}
              {showGrid && (
                <div style={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: 1, background: "rgba(124,58,237,0.12)", pointerEvents: "none" }} />
              )}

              {/* Drawing mode path preview overlay */}
              {drawingPathId && (() => {
                const pathEl = elements.find(e => e.id === drawingPathId);
                if (!pathEl) return null;
                const pts = pathEl.content.pathPoints || [];
                if (pts.length === 0 && !drawPreviewPoint) return null;
                const previewPts = drawPreviewPoint && pts.length > 0
                  ? [...pts, { x: drawPreviewPoint.x, y: drawPreviewPoint.y, type: "L" as const }]
                  : pts;
                const pathD = buildSVGPath(previewPts);
                return (
                  <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 9999 }}>
                    <path d={pathD} fill="none" stroke="#7c3aed" strokeWidth={2} strokeDasharray="5 3" strokeLinecap="round" strokeLinejoin="round" />
                    {pts.map((pt, i) => (
                      <circle key={i} cx={pt.x} cy={pt.y} r={4} fill={i === 0 ? "#22c55e" : "#7c3aed"} stroke="#fff" strokeWidth={1.5} />
                    ))}
                    {drawPreviewPoint && <circle cx={drawPreviewPoint.x} cy={drawPreviewPoint.y} r={3} fill="rgba(124,58,237,0.4)" stroke="#7c3aed" strokeWidth={1} />}
                  </svg>
                );
              })()}

              {/* Elements */}
              {sorted.map(el => {
                const bpD = getBPData(el, bp);
                if (!bpD.visible) return null;
                const isSel = selectedIds.includes(el.id);
                const isFixed = el.container === "window";
                const isEditingText = editingTextId === el.id;

                return (
                  <div key={el.id}
                    data-zero-el-id={el.id}
                    onMouseDown={e => { if (isEditingText) return; handleElementMouseDown(e, el.id); }}
                    onClick={e => e.stopPropagation()}
                    onDoubleClick={e => {
                      e.stopPropagation();
                      if (el.type === "text" && !el.locked) { setEditingTextId(el.id); setSelectedIds([el.id]); }
                      if (el.type === "path" && !el.locked) { setEditPointsPath(el.id); setSelectedIds([el.id]); }
                    }}
                    style={{
                      position: "absolute",
                      left: bpD.x, top: bpD.y,
                      width: bpD.w, height: bpD.h,
                      zIndex: el.zIndex,
                      cursor: el.locked ? "not-allowed" : isEditingText ? "text" : "grab",
                      outline: isSel ? "2px solid #7c3aed" : "none",
                      outlineOffset: 1,
                      boxSizing: "border-box",
                    }}>
                    {/* Inline text editor overlay */}
                    {isEditingText ? (
                      <textarea
                        autoFocus
                        value={el.content.text || ""}
                        onChange={e2 => updateElement(el.id, { content: { ...el.content, text: e2.target.value } })}
                        onBlur={() => setEditingTextId(null)}
                        onKeyDown={e2 => { if (e2.key === "Escape") { e2.preventDefault(); setEditingTextId(null); } }}
                        onClick={e2 => e2.stopPropagation()}
                        style={{
                          position: "absolute", inset: 0,
                          background: "rgba(0,0,0,0.6)",
                          color: el.styles.color || "#fff",
                          fontSize: el.styles.fontSize || 18,
                          fontWeight: el.styles.fontWeight || "400",
                          fontFamily: el.styles.fontFamily || "inherit",
                          lineHeight: el.styles.lineHeight || 1.5,
                          textAlign: el.styles.textAlign || "left",
                          letterSpacing: el.styles.letterSpacing,
                          padding: "4px 8px",
                          resize: "none",
                          border: "none",
                          outline: "2px solid #7c3aed",
                          borderRadius: el.styles.borderRadius || 0,
                          zIndex: 10001,
                          width: "100%",
                          height: "100%",
                          boxSizing: "border-box",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      />
                    ) : <ElementPreview el={el} selected={isSel} />}

                    {/* Lock badge */}
                    {el.locked && (
                      <div className="absolute top-0.5 right-0.5 bg-amber-500/20 text-amber-400 rounded p-0.5"><Lock size={8} /></div>
                    )}

                    {/* Fixed badge */}
                    {isFixed && isSel && (
                      <div className="absolute bottom-0.5 left-0.5 text-[10px] bg-blue-500/20 text-blue-400 rounded px-1">win</div>
                    )}

                    {/* Position/size readout while dragging or resizing */}
                    {isSel && (dragging?.id === el.id || resizing?.id === el.id) && (
                      <div style={{
                        position: "absolute",
                        top: -22,
                        left: 0,
                        background: "rgba(124,58,237,0.92)",
                        color: "#fff",
                        fontSize: 10,
                        fontFamily: "monospace",
                        borderRadius: 4,
                        padding: "2px 6px",
                        whiteSpace: "nowrap",
                        pointerEvents: "none",
                        zIndex: 10000,
                        boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
                      }}>
                        x:{bpD.x} y:{bpD.y} · {bpD.w}×{bpD.h}
                      </div>
                    )}

                    {/* Resize handles */}
                    {isSel && !el.locked && HANDLES.map(h => (
                      <div key={h} onMouseDown={e => handleResizeMouseDown(e, el.id, h)}
                        style={{
                          position: "absolute",
                          width: 8, height: 8,
                          background: "#7c3aed",
                          border: "1px solid #fff",
                          borderRadius: 2,
                          cursor: HANDLE_CURSORS[h],
                          zIndex: 999,
                          ...HANDLE_POSITIONS[h],
                        }} />
                    ))}
                  </div>
                );
              })}

              {/* ── Bezier point editing overlay ── */}
              {editPointsPath && (() => {
                const pathEl = elements.find(e => e.id === editPointsPath);
                if (!pathEl) return null;
                const pts = pathEl.content.pathPoints || [];
                return (
                  <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 10002, overflow: "visible" }}
                    onClick={e => e.stopPropagation()}>
                    {/* Draw lines from anchors to control points */}
                    {pts.map((pt, i) => (
                      <g key={i}>
                        {pt.cp1 && <line x1={pt.x} y1={pt.y} x2={pt.cp1.x} y2={pt.cp1.y} stroke="#22c55e" strokeWidth={1} strokeDasharray="3 2" opacity={0.7} />}
                        {pt.cp2 && <line x1={pt.x} y1={pt.y} x2={pt.cp2.x} y2={pt.cp2.y} stroke="#f59e0b" strokeWidth={1} strokeDasharray="3 2" opacity={0.7} />}
                      </g>
                    ))}
                    {/* Control point handles */}
                    {pts.map((pt, i) => (
                      <g key={`cp-${i}`}>
                        {pt.cp1 && (
                          <rect x={pt.cp1.x - 4} y={pt.cp1.y - 4} width={8} height={8}
                            fill="#22c55e" stroke="#fff" strokeWidth={1} rx={1}
                            style={{ cursor: "move" }}
                            onMouseDown={e2 => { e2.stopPropagation(); setDraggingPoint({ pathId: editPointsPath, ptIdx: i, type: "cp1", startCX: e2.clientX, startCY: e2.clientY, origPts: [...pts] }); }} />
                        )}
                        {pt.cp2 && (
                          <rect x={pt.cp2.x - 4} y={pt.cp2.y - 4} width={8} height={8}
                            fill="#f59e0b" stroke="#fff" strokeWidth={1} rx={1}
                            style={{ cursor: "move" }}
                            onMouseDown={e2 => { e2.stopPropagation(); setDraggingPoint({ pathId: editPointsPath, ptIdx: i, type: "cp2", startCX: e2.clientX, startCY: e2.clientY, origPts: [...pts] }); }} />
                        )}
                      </g>
                    ))}
                    {/* Anchor point handles */}
                    {pts.map((pt, i) => (
                      <circle key={`a-${i}`} cx={pt.x} cy={pt.y} r={6}
                        fill={i === 0 ? "#22c55e" : pt.type === "C" ? "#7c3aed" : "#3b82f6"}
                        stroke="#fff" strokeWidth={1.5}
                        style={{ cursor: "move" }}
                        onMouseDown={e2 => { e2.stopPropagation(); setDraggingPoint({ pathId: editPointsPath, ptIdx: i, type: "anchor", startCX: e2.clientX, startCY: e2.clientY, origPts: [...pts] }); }}
                        onDoubleClick={e2 => {
                          e2.stopPropagation();
                          // Toggle between L and C — add/remove control points
                          setElements(prev => prev.map(el => {
                            if (el.id !== editPointsPath) return el;
                            const newPts = [...(el.content.pathPoints || [])];
                            const p = { ...newPts[i] };
                            if (p.type === "C") {
                              p.type = "L"; delete p.cp1; delete p.cp2;
                            } else if (p.type === "L") {
                              p.type = "C";
                              p.cp1 = { x: p.x - 30, y: p.y - 30 };
                              p.cp2 = { x: p.x + 30, y: p.y + 30 };
                            }
                            newPts[i] = p;
                            return { ...el, content: { ...el.content, pathPoints: newPts } };
                          }));
                        }}
                      />
                    ))}
                  </svg>
                );
              })()}
            </div>

            {/* Canvas size indicator */}
            <div className="flex justify-between mt-1.5 text-[10px] text-white/20 font-mono">
              <span>{canvasWidth}px × {canvasH}px</span>
              <span>{BP_LABELS[bp]}</span>
            </div>
          </div>
        </div>

        {/* ── Right Panel: Properties / Canvas Settings ── */}
        <div className="w-60 flex-shrink-0 bg-card border-l border-border flex flex-col">
          <div className="flex border-b border-border flex-shrink-0">
            <button onClick={() => setRightPanel("props")}
              className={`flex-1 py-2 text-xs font-semibold transition ${rightPanel === "props" ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"}`}>
              Свойства
            </button>
            <button onClick={() => setRightPanel("canvas")}
              className={`flex-1 py-2 text-xs font-semibold transition ${rightPanel === "canvas" ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"}`}>
              Холст
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {rightPanel === "canvas" ? (
              <CanvasSettingsPanel
                data={{ elements, canvasHeight: canvasH, bg: canvasBg, gridCols, gridGutter, gridMargin, showGrid }}
                onChange={patch => {
                  if (patch.canvasHeight !== undefined) setCanvasH(patch.canvasHeight);
                  if (patch.bg !== undefined) setCanvasBg(patch.bg);
                  if (patch.gridCols !== undefined) setGridCols(patch.gridCols);
                  if (patch.gridGutter !== undefined) setGridGutter(patch.gridGutter);
                  if (patch.gridMargin !== undefined) setGridMargin(patch.gridMargin);
                  if (patch.showGrid !== undefined) setShowGrid(patch.showGrid);
                }}
              />
            ) : selectedEl ? (
              <PropsPanel
                el={selectedEl}
                bp={bp}
                onChange={patch => updateElement(selectedEl.id, patch)}
                onDelete={deleteSelected}
                onDuplicate={duplicateSelected}
                popupBlocks={popupBlocks}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground/40 px-4 text-center">
                <ArrowLeft size={28} />
                <span className="text-xs">Кликните на элемент для редактирования<br /><br />или добавьте новый элемент из панели слева</span>
              </div>
            )}
          </div>

          {/* Quick actions */}
          {selectedIds.length > 0 && (
            <div className="border-t border-border p-2 space-y-1.5 flex-shrink-0">
              {/* Path drawing button */}
              {selectedEl?.type === "path" && (<>
                <button
                  onClick={() => {
                    if (drawingPathId === selectedEl.id) { setDrawingPathId(null); setDrawPreviewPoint(null); drawPendingDown.current = null; }
                    else { setDrawingPathId(selectedEl.id); setEditPointsPath(null); }
                  }}
                  className={`w-full py-1.5 rounded-lg text-[11px] font-bold transition ${drawingPathId === selectedEl.id ? "bg-primary text-white" : "bg-primary/15 text-primary hover:bg-primary/25"}`}>
                  {drawingPathId === selectedEl.id ? <><StopCircle size={11} className="inline-block mr-1" />Завершить путь</> : <><Pencil size={11} className="inline-block mr-1" />Рисовать путь</>}
                </button>
                <button
                  onClick={() => {
                    if (editPointsPath === selectedEl.id) { setEditPointsPath(null); }
                    else { setEditPointsPath(selectedEl.id); setDrawingPathId(null); drawPendingDown.current = null; }
                  }}
                  className={`w-full py-1.5 rounded-lg text-[11px] font-bold transition ${editPointsPath === selectedEl.id ? "bg-emerald-500/80 text-white" : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"}`}>
                  {editPointsPath === selectedEl.id ? <><Check size={11} className="inline-block mr-1" />Выйти из редактора точек</> : <><Edit2 size={11} className="inline-block mr-1" />Редактировать точки (Безье)</>}
                </button>
              </>)}
              {/* Inline text edit button */}
              {selectedEl?.type === "text" && (
                <button onClick={() => setEditingTextId(editingTextId === selectedEl.id ? null : selectedEl.id)}
                  className={`w-full py-1.5 rounded-lg text-[11px] font-bold transition ${editingTextId === selectedEl.id ? "bg-sky-500/80 text-white" : "bg-sky-500/10 text-sky-400 hover:bg-sky-500/20"}`}>
                  {editingTextId === selectedEl.id ? <><Check size={11} className="inline-block mr-1" />Выйти из редактора текста</> : <><Type size={11} className="inline-block mr-1" />Редактировать текст (2× клик)</>}
                </button>
              )}
              {/* Alignment buttons */}
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                  {selectedIds.length > 1 ? "Выравнивание группы" : "Выравнивание на холсте"}
                </p>
                <div className="grid grid-cols-3 gap-1">
                  {([
                    ["left",     <AlignLeft size={12} />,     "По левому краю"],
                    ["center-h", <AlignCenter size={12} />,   "По центру (гориз.)"],
                    ["right",    <AlignRight size={12} />,    "По правому краю"],
                    ["top",      <ArrowUp size={12} />,       "По верхнему краю"],
                    ["center-v", <ArrowUpDown size={12} />,   "По центру (верт.)"],
                    ["bottom",   <ArrowDown size={12} />,     "По нижнему краю"],
                  ] as [string, React.ReactNode, string][]).map(([axis, icon, title]) => (
                    <button key={axis} onClick={() => alignElements(axis as any)} title={title}
                      className="py-1.5 bg-secondary hover:bg-primary/15 hover:text-primary rounded-lg text-muted-foreground transition flex items-center justify-center">
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              {/* Group button */}
              {selectedIds.length >= 2 && (
                <button onClick={groupSelected} title="Ctrl+G"
                  className="w-full py-1.5 bg-violet-500/10 hover:bg-violet-500/20 rounded-lg text-[11px] text-violet-400 transition font-semibold flex items-center justify-center gap-1.5">
                  <ObjectGroup size={11} /> Сгруппировать (Ctrl+G)
                </button>
              )}
              <div className="flex gap-1">
                <button onClick={duplicateSelected} title="Ctrl+D"
                  className="flex-1 py-1.5 bg-secondary hover:bg-secondary/80 rounded-lg text-[11px] text-muted-foreground hover:text-foreground transition flex items-center justify-center gap-1">
                  <Clone size={11} /> Копия
                </button>
                <button onClick={deleteSelected} title="Delete"
                  className="flex-1 py-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-[11px] text-red-400 transition flex items-center justify-center gap-1">
                  <X size={11} /> Удалить
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
