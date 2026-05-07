import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

export default function InfoTooltip({ content }: { content: string }) {
  const [show, setShow] = useState(false);
  const [isLight, setIsLight] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const TIP_W = 256;

  const readTheme = () =>
    document.documentElement.classList.contains("light-mode");

  const calcPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const centerX = r.left + r.width / 2;
    const vw = window.innerWidth;
    let left = centerX;
    if (centerX - TIP_W / 2 < 12) left = 12 + TIP_W / 2;
    else if (centerX + TIP_W / 2 > vw - 12) left = vw - 12 - TIP_W / 2;
    setCoords({ top: r.top - 8, left });
  }, []);

  const open = useCallback(() => {
    calcPosition();
    setIsLight(readTheme());
    setShow(true);
  }, [calcPosition]);

  const close = useCallback(() => setShow(false), []);

  useEffect(() => {
    if (!show) return;
    window.addEventListener("scroll", calcPosition, true);
    window.addEventListener("resize", calcPosition);
    return () => {
      window.removeEventListener("scroll", calcPosition, true);
      window.removeEventListener("resize", calcPosition);
    };
  }, [show, calcPosition]);

  const bg     = isLight ? "#ffffff" : "#18182b";
  const fg     = isLight ? "#111827" : "#ffffff";
  const border = isLight ? "1px solid rgba(0,0,0,0.15)" : "1px solid rgba(255,255,255,0.14)";
  const shadow = isLight ? "0 8px 30px rgba(0,0,0,0.15)" : "0 8px 30px rgba(0,0,0,0.45)";

  return (
    <span className="relative inline-flex" onMouseEnter={open} onMouseLeave={close}>
      <span
        ref={triggerRef}
        className="tooltip-trigger w-5 h-5 rounded-full border flex items-center justify-center text-[11px] font-bold cursor-help transition ml-1 select-none"
      >
        ?
      </span>

      {show && coords && createPortal(
        <div
          role="tooltip"
          style={{
            position: "fixed",
            top: coords.top,
            left: coords.left,
            transform: "translate(-50%, -100%)",
            width: TIP_W,
            zIndex: 2147483647,
            background: bg,
            color: fg,
            border,
            boxShadow: shadow,
            borderRadius: "0.75rem",
            padding: "14px",
            fontSize: "12px",
            fontWeight: 500,
            lineHeight: 1.6,
            pointerEvents: "none",
            fontFamily: "inherit",
          }}
        >
          <span style={{ color: fg, display: "block" }}>{content}</span>
          <span
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: `6px solid ${bg}`,
            }}
          />
        </div>,
        document.body
      )}
    </span>
  );
}
