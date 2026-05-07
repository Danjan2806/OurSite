import { useEffect, useRef, useState } from "react";
import { ZeroElement, ZeroBlockData, Breakpoint, BPData, parseZeroData, buildSVGPath, getPathBounds } from "./zeroBlockUtils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getBreakpoint(width: number): Breakpoint {
  if (width <= 480) return "mobile";
  if (width <= 900) return "tablet";
  return "desktop";
}

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

// ─── Animation CSS ────────────────────────────────────────────────────────────

const ANIM_INITIAL: Record<string, React.CSSProperties> = {
  "fade":       { opacity: 0 },
  "slide-up":   { opacity: 0, transform: "translateY(40px)" },
  "slide-down": { opacity: 0, transform: "translateY(-40px)" },
  "slide-left": { opacity: 0, transform: "translateX(40px)" },
  "slide-right":{ opacity: 0, transform: "translateX(-40px)" },
  "zoom-in":    { opacity: 0, transform: "scale(0.8)" },
  "zoom-out":   { opacity: 0, transform: "scale(1.2)" },
};
const ANIM_FINAL: React.CSSProperties = { opacity: 1, transform: "none" };

// ─── Element Renderer ─────────────────────────────────────────────────────────

function RenderedElement({ el, bp, scrollY, containerRef }:
  { el: ZeroElement; bp: Breakpoint; scrollY: number; containerRef: React.RefObject<HTMLDivElement | null> }) {
  const bpD = getBPData(el, bp);
  const s = el.styles;
  const c = el.content;
  const elRef = useRef<HTMLDivElement>(null);

  // s.animation is a per-element shorthand (set from BuilderPage per-element panel).
  // It maps to: animEffect=s.animation, animTrigger="viewport".
  // s.animTrigger/s.animEffect are the full-featured fields used by the block-level system.
  const resolvedTrigger: string | undefined = s.animTrigger || (s.animation ? "viewport" : undefined);
  const resolvedEffect: string = s.animEffect || s.animation || "fade";

  const [visible, setVisible] = useState(
    !resolvedTrigger || (resolvedTrigger !== "viewport" && resolvedTrigger !== "scroll")
  );
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  // Viewport trigger
  useEffect(() => {
    if (resolvedTrigger !== "viewport") return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.15 });
    if (elRef.current) obs.observe(elRef.current);
    return () => obs.disconnect();
  }, [resolvedTrigger]);

  // Scroll trigger (parallax or scroll-based show)
  useEffect(() => {
    if (resolvedTrigger !== "scroll") return;
    if (!containerRef.current || !elRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const elRect = elRef.current.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (window.innerHeight - elRect.top + rect.top) / (window.innerHeight + elRect.height)));
    if (progress > 0.1) setVisible(true);
  }, [scrollY, resolvedTrigger]);

  if (!bpD.visible) return null;

  const dur = s.animDuration || 600;
  const delay = s.animDelay || 0;

  // Parallax scroll transform
  let parallaxY = 0;
  if (resolvedTrigger === "scroll" && s.parallaxSpeed && containerRef.current) {
    parallaxY = -(scrollY * (s.parallaxSpeed || 0.3));
  }

  const initialStyle = (!visible && resolvedTrigger && resolvedTrigger !== "none") ? (ANIM_INITIAL[resolvedEffect] || {}) : {};
  const hoverStyle: React.CSSProperties = (resolvedTrigger === "hover" && !hovered)
    ? (ANIM_INITIAL[resolvedEffect] || {}) : {};
  const clickStyle: React.CSSProperties = (resolvedTrigger === "click" && !clicked)
    ? (ANIM_INITIAL[resolvedEffect] || {}) : {};

  const transitionStyle: React.CSSProperties = {
    transition: resolvedTrigger && resolvedTrigger !== "none"
      ? `all ${dur}ms ${s.animEasing || "cubic-bezier(0.4,0,0.2,1)"} ${delay}ms`
      : undefined,
  };

  const posStyle: React.CSSProperties = el.container === "window"
    ? { position: "fixed", left: bpD.x, top: bpD.y }
    : { position: "absolute", left: bpD.x, top: bpD.y };

  const baseStyle: React.CSSProperties = {
    ...posStyle,
    width: bpD.w, height: bpD.h,
    zIndex: el.zIndex,
    opacity: (s.opacity !== undefined ? s.opacity / 100 : 1) * (initialStyle.opacity as number ?? 1) * (hoverStyle.opacity as number ?? 1) * (clickStyle.opacity as number ?? 1),
    borderRadius: s.borderRadius,
    boxShadow: s.boxShadow,
    fontFamily: s.fontFamily || "inherit",
    transform: `translateY(${parallaxY}px) ${initialStyle.transform || hoverStyle.transform || clickStyle.transform || ""}`.trim() || undefined,
    ...transitionStyle,
  };

  return (
    <div ref={elRef} style={baseStyle}
      onMouseEnter={() => { if (resolvedTrigger === "hover") setHovered(true); }}
      onMouseLeave={() => { if (resolvedTrigger === "hover") setHovered(false); }}
      onClick={() => { if (resolvedTrigger === "click") setClicked(c => !c); }}>

      {el.type === "text" && (
        <div style={{
          width: "100%", height: "100%",
          background: s.bg, color: s.color || "#fff",
          fontSize: s.fontSize, fontWeight: s.fontWeight,
          textAlign: s.textAlign, lineHeight: s.lineHeight || 1.5,
          letterSpacing: s.letterSpacing ? `${s.letterSpacing}px` : undefined,
          padding: "4px 8px", whiteSpace: "pre-wrap", wordBreak: "break-word",
          borderWidth: s.borderWidth, borderColor: s.borderColor, borderStyle: s.borderWidth ? "solid" : undefined,
          overflow: "hidden",
        }}>
          {c.text || ""}
        </div>
      )}

      {el.type === "image" && c.src && (
        <img src={c.src} alt={c.alt || ""} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: s.borderRadius, display: "block" }} />
      )}

      {el.type === "button" && (
        <a href={c.href || "#"} target={c.target || "_self"} rel="noopener noreferrer"
          style={{
            width: "100%", height: "100%",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: (s.btnVariant === "outline" || s.btnVariant === "ghost") ? "transparent" : (s.bg || "#7c3aed"),
            color: s.color || "#fff",
            fontSize: s.fontSize || 16,
            fontWeight: s.fontWeight || "600",
            borderRadius: s.borderRadius,
            border: s.btnVariant !== "ghost" ? `${s.borderWidth || 2}px solid ${s.borderColor || s.bg || "#7c3aed"}` : "none",
            textDecoration: "none",
            cursor: "pointer",
            gap: 8,
            transition: "opacity 0.2s",
          }}>
          {c.label || "Кнопка"}
        </a>
      )}

      {el.type === "shape" && (
        <div style={{ width: "100%", height: "100%" }}>
          {(!s.shapeType || s.shapeType === "rect") && (
            <div style={{ width: "100%", height: "100%", background: s.shapeFill || "#7c3aed", borderRadius: s.borderRadius, border: s.shapeBorderW ? `${s.shapeBorderW}px solid ${s.shapeBorder}` : "none" }} />
          )}
          {s.shapeType === "circle" && (
            <div style={{ width: "100%", height: "100%", background: s.shapeFill || "#7c3aed", borderRadius: "50%", border: s.shapeBorderW ? `${s.shapeBorderW}px solid ${s.shapeBorder}` : "none" }} />
          )}
          {s.shapeType === "triangle" && (
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polygon points="50,0 100,100 0,100" fill={s.shapeFill || "#7c3aed"} stroke={s.shapeBorder} strokeWidth={s.shapeBorderW || 0} />
            </svg>
          )}
          {s.shapeType === "star" && (
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" fill={s.shapeFill || "#7c3aed"} stroke={s.shapeBorder} strokeWidth={s.shapeBorderW || 0} />
            </svg>
          )}
          {s.shapeType === "line" && (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center" }}>
              <div style={{ width: "100%", height: s.shapeBorderW || 2, background: s.shapeFill || "#7c3aed" }} />
            </div>
          )}
        </div>
      )}

      {el.type === "html" && c.html && (
        <iframe
          srcDoc={`<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{background:transparent;color:inherit;font-family:inherit;font-size:${s.fontSize || 14}px}</style></head><body>${c.html}</body></html>`}
          sandbox="allow-same-origin allow-scripts"
          style={{ width: "100%", height: "100%", border: "none", background: "transparent" }}
        />
      )}

      {el.type === "video" && (() => {
        const url = c.videoUrl || "";
        const ytId = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/)([^&?]+)/)?.[1];
        const vimeoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
        if (ytId) return <iframe src={`https://www.youtube.com/embed/${ytId}`} style={{ width: "100%", height: "100%", border: "none" }} allowFullScreen />;
        if (vimeoId) return <iframe src={`https://player.vimeo.com/video/${vimeoId}`} style={{ width: "100%", height: "100%", border: "none" }} allowFullScreen />;
        if (url) return <video src={url} controls style={{ width: "100%", height: "100%", objectFit: "cover" }} />;
        return null;
      })()}

      {el.type === "form" && (
        <form onSubmit={e => e.preventDefault()}
          style={{ width: "100%", height: "100%", background: s.bg || "rgba(255,255,255,0.05)", borderRadius: s.borderRadius, padding: 20, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", boxSizing: "border-box" }}>
          {(c.formFields || []).map(f => (
            <div key={f.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ color: s.color || "#ccc", fontSize: 12, fontWeight: "600" }}>{f.label}{f.required ? " *" : ""}</label>
              {f.type === "textarea" ? (
                <textarea required={f.required} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: s.color || "#fff", resize: "vertical", minHeight: 80 }} />
              ) : f.type === "select" ? (
                <select required={f.required} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(20,20,40,0.9)", color: s.color || "#fff" }}>
                  <option value="">Выберите...</option>
                </select>
              ) : (
                <input type={f.type} required={f.required} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: s.color || "#fff" }} />
              )}
            </div>
          ))}
          <button type="submit" style={{ padding: "12px 24px", borderRadius: s.borderRadius || 8, background: s.bg === "transparent" ? "#7c3aed" : s.bg || "#7c3aed", color: "#fff", fontWeight: "600", border: "none", cursor: "pointer", marginTop: 4 }}>
            Отправить
          </button>
        </form>
      )}

      {el.type === "path" && (() => {
        const pts = c.pathPoints || [];
        if (pts.length === 0) return null;
        const { minX, minY, maxX, maxY } = getPathBounds(pts);
        const vbW = Math.max(maxX - minX, 1);
        const vbH = Math.max(maxY - minY, 1);
        const d = buildSVGPath(pts.map(p => ({
          ...p,
          x: p.x - minX, y: p.y - minY,
          cp1: p.cp1 ? { x: p.cp1.x - minX, y: p.cp1.y - minY } : undefined,
          cp2: p.cp2 ? { x: p.cp2.x - minX, y: p.cp2.y - minY } : undefined,
        })), s.pathClosed);
        return (
          <svg width="100%" height="100%" viewBox={`0 0 ${vbW} ${vbH}`} preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
            <path d={d}
              fill={s.pathFill || "none"}
              stroke={s.pathStroke || "#7c3aed"}
              strokeWidth={s.pathStrokeW || 2}
              strokeLinecap="round"
              strokeLinejoin="round" />
          </svg>
        );
      })()}

      {el.type === "group" && (
        <div style={{
          width: "100%", height: "100%",
          background: s.bg && s.bg !== "transparent" ? s.bg : undefined,
          borderRadius: s.borderRadius,
        }} />
      )}
    </div>
  );
}

// ─── Main ZeroBlockRenderer ───────────────────────────────────────────────────

export default function ZeroBlockRenderer({ content, styles }: { content: any; styles?: any }) {
  const data: ZeroBlockData = parseZeroData(content);
  const containerRef = useRef<HTMLDivElement>(null);
  const [bp, setBp] = useState<Breakpoint>("desktop");
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setBp(getBreakpoint(width));
      }
      setScrollY(window.scrollY);
    };
    update();
    const resizeObs = new ResizeObserver(update);
    if (containerRef.current) resizeObs.observe(containerRef.current);
    window.addEventListener("scroll", update, { passive: true });
    return () => { resizeObs.disconnect(); window.removeEventListener("scroll", update); };
  }, []);

  const sorted = [...data.elements].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div ref={containerRef} style={{ width: "100%", height: data.canvasHeight, position: "relative", overflow: "hidden", background: data.bg && data.bg !== "transparent" ? data.bg : undefined }}>
      {sorted.map(el => (
        <RenderedElement key={el.id} el={el} bp={bp} scrollY={scrollY} containerRef={containerRef} />
      ))}
    </div>
  );
}
