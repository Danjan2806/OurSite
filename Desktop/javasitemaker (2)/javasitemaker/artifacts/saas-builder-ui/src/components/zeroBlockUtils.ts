// ─── Types ───────────────────────────────────────────────────────────────────

export type ZeroElementType = "text" | "image" | "button" | "shape" | "html" | "video" | "form" | "path" | "group";
export type Breakpoint = "desktop" | "tablet" | "mobile";
export type ResizeHandle = "nw"|"n"|"ne"|"e"|"se"|"s"|"sw"|"w";
export type ShapeType = "rect" | "circle" | "triangle" | "line" | "star";
export type AnimTrigger = "none" | "viewport" | "scroll" | "hover" | "click";
export type AnimEffect = "fade" | "slide-up" | "slide-down" | "slide-left" | "slide-right" | "zoom-in" | "zoom-out";

export interface PathPoint {
  x: number; y: number;
  type: "M" | "L" | "C";
  cp1?: { x: number; y: number };
  cp2?: { x: number; y: number };
  closed?: boolean;
}

export interface BPData { x: number; y: number; w: number; h: number; visible: boolean; }

export interface ZeroElement {
  id: string;
  type: ZeroElementType;
  locked: boolean;
  zIndex: number;
  container: "grid" | "window";
  desktop: BPData;
  tablet?: Partial<BPData>;
  mobile?: Partial<BPData>;
  content: {
    text?: string; html?: string; src?: string; alt?: string;
    label?: string; href?: string; target?: string;
    formFields?: { id: string; type: string; label: string; required: boolean }[];
    videoUrl?: string;
    pathPoints?: PathPoint[];
    childIds?: string[];
  };
  styles: {
    bg?: string; color?: string; fontSize?: number; fontWeight?: string;
    fontFamily?: string; textAlign?: "left"|"center"|"right";
    lineHeight?: number; letterSpacing?: number;
    borderRadius?: number; borderColor?: string; borderWidth?: number;
    opacity?: number; boxShadow?: string;
    shapeType?: ShapeType; shapeFill?: string; shapeBorder?: string; shapeBorderW?: number;
    btnVariant?: "filled"|"outline"|"ghost";
    pathFill?: string; pathStroke?: string; pathStrokeW?: number; pathClosed?: boolean;
    animTrigger?: AnimTrigger; animEffect?: AnimEffect;
    animDuration?: number; animDelay?: number; animEasing?: string;
    parallaxSpeed?: number;
  };
}

export interface ZeroBlockData {
  elements: ZeroElement[];
  canvasHeight: number;
  bg?: string;
  gridCols?: number;
  gridGutter?: number;
  gridMargin?: number;
  showGrid?: boolean;
}

// ─── Data Helpers ─────────────────────────────────────────────────────────────

export const defaultZeroBlockData = (): ZeroBlockData => ({
  elements: [],
  canvasHeight: 600,
  bg: "transparent",
  gridCols: 12,
  gridGutter: 24,
  gridMargin: 80,
  showGrid: false,
});

export const parseZeroData = (content: any): ZeroBlockData => {
  try {
    if (content?.zeroElements !== undefined) {
      return {
        elements: content.zeroElements || [],
        canvasHeight: content.zeroHeight || 600,
        bg: content.zeroBg || "transparent",
        gridCols: content.zeroGridCols || 12,
        gridGutter: content.zeroGridGutter || 24,
        gridMargin: content.zeroGridMargin || 80,
        showGrid: content.zeroShowGrid || false,
      };
    }
  } catch {}
  return defaultZeroBlockData();
};

export const serializeZeroData = (data: ZeroBlockData): Record<string, any> => ({
  zeroElements: data.elements,
  zeroHeight: data.canvasHeight,
  zeroBg: data.bg,
  zeroGridCols: data.gridCols,
  zeroGridGutter: data.gridGutter,
  zeroGridMargin: data.gridMargin,
  zeroShowGrid: data.showGrid,
});

// ─── SVG Path Builder ─────────────────────────────────────────────────────────

export function buildSVGPath(points: PathPoint[], closed: boolean = false): string {
  if (points.length === 0) return "";
  let d = "";
  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    if (pt.type === "M" || i === 0) {
      d += `M ${pt.x} ${pt.y} `;
    } else if (pt.type === "C" && (pt.cp1 || pt.cp2)) {
      const prev = points[i - 1];
      const cp1 = pt.cp1 || prev;
      const cp2 = pt.cp2 || pt;
      d += `C ${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${pt.x} ${pt.y} `;
    } else {
      d += `L ${pt.x} ${pt.y} `;
    }
  }
  if (closed) d += "Z";
  return d.trim();
}

export function getPathBounds(points: PathPoint[]): { minX: number; minY: number; maxX: number; maxY: number } {
  if (points.length === 0) return { minX: 0, minY: 0, maxX: 100, maxY: 100 };
  const xs = points.flatMap(p => [p.x, p.cp1?.x ?? p.x, p.cp2?.x ?? p.x]);
  const ys = points.flatMap(p => [p.y, p.cp1?.y ?? p.y, p.cp2?.y ?? p.y]);
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
}
