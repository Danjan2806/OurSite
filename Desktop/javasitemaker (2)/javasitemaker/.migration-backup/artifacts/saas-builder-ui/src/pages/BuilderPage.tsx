import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { sitesApi, Block, Page, Site, FormSubmission, uploadImage, analyzeScreenshot, type AiScreenshotResult } from "@/lib/api";
import ZeroBlockEditor from "@/components/ZeroBlockEditor";
import { ZeroBlockData, parseZeroData, serializeZeroData } from "@/components/zeroBlockUtils";
import ZeroBlockRenderer from "@/components/ZeroBlockRenderer";
import {
  ArrowLeft, Eye, Globe, Plus, Settings2, Trash2, ChevronUp, ChevronDown,
  GripVertical, Type, Image, ShoppingBag, Zap, BarChart2, Users,
  MessageSquare, Video, Music, Calendar, Phone, FileText, HelpCircle,
  Star, Layout, Layers, Check, Monitor, Tablet, Smartphone,
  ChevronRight, LayoutTemplate, SplitSquareHorizontal, Rows, Maximize2, X,
  MapPin, Code2, Hash, Copy, Inbox, Send, Undo2, Redo2, PopupIcon, EyeOff,
  LinkIcon, ArrowSquareOut
} from "@/lib/icons";

// ─── Block type definitions ───────────────────────
const BLOCK_CATEGORIES = [
  {
    id: "structure", label: "Структура", icon: Layout,
    blocks: [
      { type: "HEADER_MENU", label: "Шапка сайта", icon: Layout, desc: "Навигационное меню" },
      { type: "FOOTER", label: "Подвал", icon: Rows, desc: "Футер с ссылками" },
    ]
  },
  {
    id: "hero", label: "Главный экран", icon: Maximize2,
    blocks: [
      { type: "HERO", label: "Главный экран", icon: Maximize2, desc: "Заголовок + CTA кнопка" },
      { type: "CTA", label: "CTA блок", icon: Zap, desc: "Призыв к действию" },
    ]
  },
  {
    id: "content", label: "Контент", icon: Type,
    blocks: [
      { type: "TEXT", label: "Текст", icon: Type, desc: "Заголовок и параграф" },
      { type: "STATS", label: "Статистика", icon: BarChart2, desc: "Ключевые цифры" },
      { type: "FAQ", label: "FAQ", icon: HelpCircle, desc: "Вопросы и ответы" },
      { type: "BLOG", label: "Блог", icon: FileText, desc: "Список статей" },
    ]
  },
  {
    id: "social", label: "Команда и отзывы", icon: Users,
    blocks: [
      { type: "FEATURES", label: "Преимущества", icon: Star, desc: "Иконки с описанием" },
      { type: "TESTIMONIALS", label: "Отзывы", icon: MessageSquare, desc: "Цитаты клиентов" },
      { type: "TEAM", label: "Команда", icon: Users, desc: "Карточки участников" },
      { type: "PRICING", label: "Тарифы", icon: Layers, desc: "Сравнение планов" },
    ]
  },
  {
    id: "media", label: "Медиа", icon: Image,
    blocks: [
      { type: "GALLERY", label: "Галерея", icon: Image, desc: "Сетка изображений" },
      { type: "VIDEO", label: "Видео", icon: Video, desc: "Встроенное видео" },
      { type: "MUSIC_PLAYER", label: "Музыкальный плеер", icon: Music, desc: "Трек с обложкой" },
      { type: "DISCOGRAPHY", label: "Дискография", icon: Music, desc: "Список альбомов" },
    ]
  },
  {
    id: "ecom", label: "E-commerce", icon: ShoppingBag,
    blocks: [
      { type: "PRODUCTS", label: "Товары", icon: ShoppingBag, desc: "Каталог продуктов" },
    ]
  },
  {
    id: "contacts", label: "Контакты и формы", icon: Phone,
    blocks: [
      { type: "CONTACTS", label: "Контакты", icon: Phone, desc: "Адрес, email, карта" },
      { type: "FORM", label: "Форма заявки", icon: MessageSquare, desc: "Сбор заявок" },
      { type: "SCHEDULE", label: "Расписание", icon: Calendar, desc: "Расписание занятий" },
      { type: "COACHES", label: "Тренеры", icon: Users, desc: "Карточки тренеров" },
      { type: "MAP", label: "Карта", icon: MapPin, desc: "Google / Yandex карта" },
    ]
  },
  {
    id: "advanced", label: "Расширенные", icon: Code2,
    blocks: [
      { type: "ZERO_BLOCK", label: "Zero Block", icon: Code2, desc: "Свободный холст — drag & drop, анимации, адаптивность" },
    ]
  },
  {
    id: "interactive", label: "Интерактивные", icon: PopupIcon,
    blocks: [
      { type: "POPUP", label: "Попап", icon: PopupIcon, desc: "Всплывающее окно по триггеру" },
    ]
  },
];

// ─── Block templates ──────────────────────────────
const BLOCK_TEMPLATES: Record<string, { id: string; label: string; desc: string; styles?: Record<string, any> }[]> = {
  HEADER_MENU: [
    { id: "header_split",       label: "Классический",    desc: "Лого слева · меню по центру · CTA справа", styles: { variant: "split" } },
    { id: "header_logo_center", label: "Лого по центру",  desc: "Логотип по центру, меню снизу",             styles: { variant: "logo_center" } },
    { id: "header_minimal",     label: "Минимальный",     desc: "Только лого и CTA, без меню",               styles: { variant: "minimal" } },
  ],
  HERO: [
    { id: "hero_centered", label: "По центру",      desc: "Текст и кнопки по центру",            styles: { variant: "centered" } },
    { id: "hero_split",    label: "Разделённый",    desc: "Текст слева, цветовая зона справа",   styles: { variant: "split" } },
    { id: "hero_minimal",  label: "Минималистичный",desc: "Светлый фон, лёгкий и чистый",        styles: { variant: "minimal", bg: "#f9fafb", textColor: "#111111" } },
    { id: "hero_dark",     label: "Тёмный",         desc: "Тёмный фон, крупный заголовок",       styles: { variant: "dark", bg: "#050510", textColor: "#f5f5f5" } },
  ],
  FEATURES: [
    { id: "features_cards", label: "Карточки",  desc: "Сетка карточек с иконками",            styles: { variant: "cards" } },
    { id: "features_list",  label: "Список",    desc: "Горизонтальные строки с иконками",      styles: { variant: "list" } },
    { id: "features_alt",   label: "Секции",    desc: "Чередующиеся блоки слева / справа",     styles: { variant: "alternating" } },
  ],
  TESTIMONIALS: [
    { id: "test_grid",  label: "Сетка",        desc: "3 колонки карточек",             styles: { variant: "grid" } },
    { id: "test_quote", label: "Большая цитата",desc: "Одна большая цитата по центру", styles: { variant: "quote" } },
    { id: "test_list",  label: "Список",        desc: "Строки с аватаром и текстом",   styles: { variant: "list" } },
  ],
  CTA: [
    { id: "cta_centered", label: "По центру",  desc: "Заголовок и кнопки по центру",  styles: { variant: "centered" } },
    { id: "cta_banner",   label: "Баннер",     desc: "Градиентная полоса во всю ширину", styles: { variant: "banner" } },
    { id: "cta_split",    label: "Разделённый",desc: "Текст слева, кнопки справа",     styles: { variant: "split" } },
  ],
  FOOTER: [
    { id: "footer_columns",  label: "Колонки",     desc: "Лого + описание + ссылки",  styles: { variant: "columns" } },
    { id: "footer_minimal",  label: "Минимальный", desc: "Ссылки в ряд + копирайт",   styles: { variant: "minimal" } },
    { id: "footer_centered", label: "По центру",   desc: "Всё по центру",              styles: { variant: "centered" } },
  ],
  PRICING: [
    { id: "pricing_cards", label: "Карточки", desc: "Планы в виде карточек",           styles: { variant: "cards" } },
    { id: "pricing_table", label: "Таблица",  desc: "Горизонтальное сравнение",        styles: { variant: "table" } },
  ],
  STATS: [
    { id: "stats_row",   label: "Строка",   desc: "Цифры в ряд по центру",            styles: { variant: "row" } },
    { id: "stats_cards", label: "Карточки", desc: "Цифры в карточках с фоном",        styles: { variant: "cards" } },
  ],
  FAQ: [
    { id: "faq_accordion", label: "Аккордеон", desc: "Раскрывающиеся вопросы",        styles: { variant: "accordion" } },
    { id: "faq_grid",      label: "Сетка",     desc: "Два столбца Q&A",               styles: { variant: "grid" } },
  ],
  BLOG: [
    { id: "blog_grid", label: "Карточки", desc: "Статьи в сетке карточек",            styles: { variant: "grid" } },
    { id: "blog_list", label: "Список",   desc: "Статьи в виде строк с картинкой",   styles: { variant: "list" } },
  ],
  TEAM: [
    { id: "team_cards", label: "Карточки", desc: "Аватары в карточках сеткой",        styles: { variant: "cards" } },
    { id: "team_list",  label: "Список",   desc: "Горизонтальные строки с фото",      styles: { variant: "list" } },
  ],
  GALLERY: [
    { id: "gallery_grid",    label: "Сетка",   desc: "Равномерная сетка изображений", styles: { variant: "grid" } },
    { id: "gallery_masonry", label: "Мозаика", desc: "Колонки разной высоты",         styles: { variant: "masonry" } },
  ],
  POPUP: [
    { id: "popup_centered",    label: "По центру",     desc: "Классический центрированный попап",  styles: { variant: "centered" } },
    { id: "popup_image_left",  label: "Картинка слева",desc: "Изображение слева, текст справа",    styles: { variant: "image-left" } },
    { id: "popup_fullscreen",  label: "Полноэкранный", desc: "Попап на весь экран",                styles: { variant: "fullscreen" } },
    { id: "popup_bottom",      label: "Снизу",         desc: "Всплывает снизу (drawer-стиль)",     styles: { variant: "bottom-sheet" } },
  ],
};

function BlockThumb({ id }: { id: string }) {
  const d = "#0d0d1e", mu = "#334155", ac = "#7c3aed", li = "#1a1a3e";
  const T = (props: React.SVGProps<SVGRectElement>) => <rect {...props} />;
  const thumbs: Record<string, React.ReactNode> = {
    header_split: <><T x="8" y="14" width="18" height="6" fill={ac} rx="2"/><T x="34" y="16" width="8" height="3" fill={mu} rx="1"/><T x="46" y="16" width="8" height="3" fill={mu} rx="1"/><T x="58" y="16" width="8" height="3" fill={mu} rx="1"/><T x="88" y="12" width="24" height="11" fill={ac} rx="3"/></>,
    header_logo_center: <><T x="44" y="9" width="32" height="7" fill={ac} rx="2"/><T x="22" y="22" width="8" height="3" fill={mu} rx="1"/><T x="34" y="22" width="8" height="3" fill={mu} rx="1"/><T x="46" y="22" width="8" height="3" fill={mu} rx="1"/><T x="58" y="22" width="8" height="3" fill={mu} rx="1"/><T x="82" y="20" width="22" height="8" fill={ac} rx="3"/></>,
    header_minimal: <><T x="8" y="14" width="18" height="6" fill={ac} rx="2"/><T x="88" y="12" width="24" height="11" fill={ac} rx="3"/></>,
    hero_centered: <><T x="20" y="10" width="80" height="10" fill="#4338ca" rx="2"/><T x="30" y="24" width="60" height="4" fill={mu} rx="2"/><T x="35" y="42" width="22" height="9" fill={ac} rx="3"/><T x="62" y="42" width="22" height="9" fill={mu} rx="3"/></>,
    hero_split: <><T x="4" y="8" width="50" height="9" fill="#4338ca" rx="2"/><T x="4" y="21" width="40" height="4" fill={mu} rx="2"/><T x="4" y="40" width="20" height="9" fill={ac} rx="3"/><T x="28" y="40" width="20" height="9" fill={mu} rx="3"/><T x="62" y="2" width="58" height="66" fill="#4338ca" rx="4" fillOpacity="0.25"/><T x="74" y="16" width="34" height="30" fill={ac} rx="6" fillOpacity="0.35"/></>,
    hero_minimal: <><T x="20" y="14" width="80" height="8" fill="#1e293b" rx="2"/><T x="30" y="26" width="60" height="4" fill="#94a3b8" rx="2"/><T x="38" y="40" width="18" height="8" fill="#7c3aed" rx="3"/><T x="60" y="40" width="18" height="8" fill="#e2e8f0" rx="3"/></>,
    hero_dark: <><T x="15" y="8" width="90" height="12" fill="#6d28d9" rx="2"/><T x="25" y="24" width="70" height="5" fill={mu} rx="2"/><T x="38" y="42" width="22" height="10" fill={ac} rx="3"/><T x="64" y="42" width="22" height="10" fill={li} rx="3"/></>,
    features_cards: <>{[0,1,2].map(i=><g key={i}><T x={5+i*38} y="14" width="34" height="48" fill={li} rx="4"/><T x={14+i*38} y="20" width="16" height="10" fill={ac} rx="3" fillOpacity="0.5"/><T x={10+i*38} y="35" width="22" height="3" fill={mu} rx="2"/><T x={12+i*38} y="42" width="18" height="3" fill={mu} rx="2" fillOpacity="0.4"/></g>)}</>,
    features_list: <>{[0,1,2,3].map(i=><g key={i}><T x="5" y={12+i*14} width="9" height="9" fill={ac} rx="2" fillOpacity="0.5"/><T x="18" y={13+i*14} width="35" height="3" fill={mu} rx="2"/><T x="18" y="19" width="55" height="2" fill={mu} rx="2" fillOpacity="0.4"/></g>)}</>,
    features_alt: <><T x="5" y="5" width="32" height="28" fill={ac} rx="4" fillOpacity="0.25"/><T x="43" y="8" width="42" height="4" fill={mu} rx="2"/><T x="43" y="16" width="66" height="3" fill={mu} rx="2" fillOpacity="0.5"/><T x="43" y="38" width="32" height="28" fill={ac} rx="4" fillOpacity="0.25"/><T x="5" y="38" width="42" height="4" fill={mu} rx="2"/><T x="5" y="46" width="30" height="3" fill={mu} rx="2" fillOpacity="0.4"/></>,
    test_grid: <>{[0,1,2].map(i=><g key={i}><T x={4+i*40} y="16" width="36" height="50" fill={li} rx="4"/><T x={10+i*40} y="22" width="24" height="3" fill="gold" rx="1" fillOpacity="0.6"/><T x={10+i*40} y="29" width="24" height="10" fill={mu} rx="2" fillOpacity="0.5"/><circle key={`c${i}`} cx={14+i*40} cy="52" r="5" fill={mu} fillOpacity="0.5"/></g>)}</>,
    test_quote: <><text x="10" y="26" fill={ac} fontSize="22" fillOpacity="0.4">"</text><T x="18" y="18" width="84" height="5" fill={mu} rx="2"/><T x="22" y="27" width="76" height="5" fill={mu} rx="2" fillOpacity="0.7"/><T x="28" y="36" width="64" height="4" fill={mu} rx="2" fillOpacity="0.5"/><circle cx="44" cy="55" r="6" fill={mu} fillOpacity="0.5"/><T x="54" y="51" width="25" height="3" fill={mu} rx="2" fillOpacity="0.6"/></>,
    test_list: <>{[0,1,2].map(i=><g key={i}><circle cx="14" cy={16+i*20} r="6" fill={mu} fillOpacity="0.5"/><T x="23" y={12+i*20} width="48" height="3" fill={mu} rx="2"/><T x="23" y="18" width="68" height="3" fill={mu} rx="2" fillOpacity="0.4"/><line key={`l${i}`} x1="5" y1={28+i*20} x2="115" y2={28+i*20} stroke={mu} strokeWidth="0.5" strokeOpacity="0.3"/></g>)}</>,
    cta_centered: <><T x="22" y="10" width="76" height="8" fill={mu} rx="2"/><T x="32" y="22" width="56" height="4" fill={mu} rx="2" fillOpacity="0.5"/><T x="28" y="36" width="26" height="11" fill={ac} rx="3"/><T x="58" y="36" width="26" height="11" fill={mu} rx="3" fillOpacity="0.6"/></>,
    cta_banner: <><defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#7c3aed"/><stop offset="100%" stopColor="#4f46e5"/></linearGradient></defs><T x="5" y="12" width="110" height="46" fill="url(#g1)" rx="6"/><T x="18" y="22" width="50" height="8" fill="white" rx="2" fillOpacity="0.3"/><T x="80" y="20" width="28" height="16" fill="white" rx="3" fillOpacity="0.7"/></>,
    cta_split: <><T x="5" y="14" width="58" height="8" fill={mu} rx="2"/><T x="5" y="26" width="42" height="4" fill={mu} rx="2" fillOpacity="0.5"/><T x="78" y="24" width="28" height="11" fill={ac} rx="3"/><T x="78" y="40" width="28" height="11" fill={mu} rx="3" fillOpacity="0.6"/></>,
    footer_columns: <><T x="5" y="7" width="20" height="7" fill={ac} rx="2"/><T x="5" y="18" width="42" height="3" fill={mu} rx="2" fillOpacity="0.5"/><T x="5" y="25" width="32" height="2.5" fill={mu} rx="2" fillOpacity="0.3"/><T x="72" y="7" width="14" height="3" fill={mu} rx="2" fillOpacity="0.6"/><T x="72" y="14" width="14" height="3" fill={mu} rx="2" fillOpacity="0.5"/><T x="72" y="21" width="14" height="3" fill={mu} rx="2" fillOpacity="0.4"/><T x="92" y="7" width="20" height="3" fill={mu} rx="2" fillOpacity="0.6"/><T x="92" y="14" width="16" height="3" fill={mu} rx="2" fillOpacity="0.5"/><line x1="5" y1="40" x2="115" y2="40" stroke={mu} strokeWidth="0.5" strokeOpacity="0.3"/><T x="5" y="45" width="50" height="3" fill={mu} rx="2" fillOpacity="0.3"/></>,
    footer_minimal: <><T x="18" y="20" width="14" height="3" fill={mu} rx="2" fillOpacity="0.5"/><T x="36" y="20" width="14" height="3" fill={mu} rx="2" fillOpacity="0.5"/><T x="54" y="20" width="14" height="3" fill={mu} rx="2" fillOpacity="0.5"/><T x="72" y="20" width="14" height="3" fill={mu} rx="2" fillOpacity="0.5"/><line x1="18" y1="34" x2="102" y2="34" stroke={mu} strokeWidth="0.5" strokeOpacity="0.3"/><T x="28" y="40" width="64" height="3" fill={mu} rx="2" fillOpacity="0.3"/></>,
    footer_centered: <><T x="44" y="6" width="32" height="8" fill={ac} rx="2" fillOpacity="0.7"/><T x="34" y="18" width="52" height="3" fill={mu} rx="2" fillOpacity="0.5"/><T x="28" y="28" width="12" height="3" fill={mu} rx="2" fillOpacity="0.5"/><T x="44" y="28" width="12" height="3" fill={mu} rx="2" fillOpacity="0.5"/><T x="60" y="28" width="12" height="3" fill={mu} rx="2" fillOpacity="0.5"/><line x1="18" y1="40" x2="102" y2="40" stroke={mu} strokeWidth="0.5" strokeOpacity="0.3"/><T x="30" y="46" width="60" height="3" fill={mu} rx="2" fillOpacity="0.3"/></>,
    pricing_cards: <>{[0,1,2].map(i=><g key={i}><T x={4+i*39} y="6" width="35" height="58" fill={i===1?ac:li} rx="4" fillOpacity={i===1?0.75:1}/><T x={9+i*39} y="13" width="22" height="4" fill="white" rx="2" fillOpacity={i===1?0.9:0.3}/><T x={9+i*39} y="21" width="16" height="9" fill="white" rx="2" fillOpacity={i===1?0.7:0.2}/><T x={9+i*39} y="34" width="22" height="2.5" fill="white" rx="1" fillOpacity="0.3"/><T x={9+i*39} y="40" width="22" height="2.5" fill="white" rx="1" fillOpacity="0.25"/><T x={9+i*39} y="50" width="22" height="9" fill="white" rx="3" fillOpacity={i===1?0.5:0.15}/></g>)}</>,
    pricing_table: <><T x="5" y="5" width="110" height="9" fill={li} rx="2"/>{[0,1,2,3].map(i=><g key={i}><T x="5" y={17+i*13} width="110" height="11" fill={i%2===0?li:"transparent"} rx="2" fillOpacity="0.5"/><T x="9" y={20+i*13} width="26" height="3" fill={mu} rx="1" fillOpacity="0.6"/><T x="48" y={20+i*13} width="10" height="3" fill={ac} rx="1" fillOpacity="0.6"/><T x="72" y={20+i*13} width="10" height="3" fill={ac} rx="1" fillOpacity="0.6"/><T x="96" y={20+i*13} width="10" height="3" fill={ac} rx="1" fillOpacity="0.3"/></g>)}</>,
    stats_row: <>{[0,1,2,3].map(i=><g key={i}><T x={7+i*29} y="18" width="24" height="14" fill={ac} rx="3" fillOpacity="0.6"/><T x={9+i*29} y="36" width="18" height="3" fill={mu} rx="2" fillOpacity="0.5"/></g>)}</>,
    stats_cards: <>{[0,1,2,3].map(i=><g key={i}><T x={4+i*30} y="10" width="26" height="50" fill={li} rx="4"/><T x={8+i*30} y="18" width="18" height="12" fill={ac} rx="3" fillOpacity="0.5"/><T x={8+i*30} y="34" width="15" height="3" fill={mu} rx="2" fillOpacity="0.5"/></g>)}</>,
    faq_accordion: <>{[0,1,2,3].map(i=><g key={i}><T x="5" y={7+i*16} width="110" height="13" fill={li} rx="3"/><T x="9" y={11+i*16} width="65" height="3" fill={mu} rx="2" fillOpacity="0.6"/><text x="104" y={17+i*16} fill={ac} fontSize="10" textAnchor="middle">+</text></g>)}</>,
    faq_grid: <>{[0,1].map(col=>[0,1,2].map(row=><g key={`${col}${row}`}><T x={5+col*58} y={5+row*22} width="52" height="18" fill={li} rx="3"/><T x={9+col*58} y={9+row*22} width="36" height="3" fill={mu} rx="2" fillOpacity="0.7"/><T x={9+col*58} y={15+row*22} width="42" height="2.5" fill={mu} rx="2" fillOpacity="0.4"/></g>))}</>,
    blog_grid: <>{[0,1,2].map(i=><g key={i}><T x={4+i*40} y="5" width="36" height="60" fill={li} rx="4"/><T x={4+i*40} y="5" width="36" height="21" fill={mu} rx="4" fillOpacity="0.4"/><T x={9+i*40} y="30" width="26" height="3" fill={mu} rx="2" fillOpacity="0.7"/><T x={9+i*40} y="37" width="26" height="3" fill={mu} rx="2" fillOpacity="0.5"/></g>)}</>,
    blog_list: <>{[0,1,2].map(i=><g key={i}><T x="5" y={5+i*22} width="28" height="18" fill={mu} rx="3" fillOpacity="0.5"/><T x="37" y={7+i*22} width="48" height="4" fill={mu} rx="2" fillOpacity="0.7"/><T x="37" y={15+i*22} width="64" height="3" fill={mu} rx="2" fillOpacity="0.4"/><line key={`l${i}`} x1="5" y1={27+i*22} x2="115" y2={27+i*22} stroke={mu} strokeWidth="0.5" strokeOpacity="0.3"/></g>)}</>,
    team_cards: <>{[0,1,2,3].map(i=><g key={i}><T x={4+i*30} y="8" width="26" height="56" fill={li} rx="4"/><circle cx={17+i*30} cy="28" r="9" fill={mu} fillOpacity="0.5"/><T x={8+i*30} y="41" width="18" height="3" fill={mu} rx="2" fillOpacity="0.6"/><T x={10+i*30} y="48" width="14" height="2.5" fill={mu} rx="2" fillOpacity="0.3"/></g>)}</>,
    team_list: <>{[0,1,2].map(i=><g key={i}><circle cx="14" cy={17+i*22} r="8" fill={mu} fillOpacity="0.5"/><T x="26" y={13+i*22} width="32" height="3" fill={mu} rx="2" fillOpacity="0.7"/><T x="26" y={20+i*22} width="55" height="2.5" fill={mu} rx="2" fillOpacity="0.4"/><line key={`l${i}`} x1="5" y1={30+i*22} x2="115" y2={30+i*22} stroke={mu} strokeWidth="0.5" strokeOpacity="0.3"/></g>)}</>,
    gallery_grid: <>{[0,1,2].map(r=>[0,1,2].map(c=><T key={`${r}${c}`} x={5+c*39} y={5+r*22} width="35" height="18" fill={mu} rx="3" fillOpacity="0.5"/>))}</>,
    gallery_masonry: <><T x="5" y="5" width="34" height="28" fill={mu} rx="3" fillOpacity="0.5"/><T x="5" y="37" width="34" height="18" fill={mu} rx="3" fillOpacity="0.4"/><T x="43" y="5" width="34" height="16" fill={mu} rx="3" fillOpacity="0.5"/><T x="43" y="25" width="34" height="30" fill={mu} rx="3" fillOpacity="0.4"/><T x="81" y="5" width="34" height="22" fill={mu} rx="3" fillOpacity="0.5"/><T x="81" y="31" width="34" height="24" fill={mu} rx="3" fillOpacity="0.4"/></>,
  };
  const bg = id.startsWith("hero_minimal") ? "#f8fafc" : d;
  return (
    <svg viewBox="0 0 120 70" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="70" fill={bg} rx="4"/>
      {thumbs[id] ?? <><rect x="20" y="22" width="80" height="6" fill={mu} rx="2" fillOpacity="0.5"/><rect x="30" y="34" width="60" height="4" fill={mu} rx="2" fillOpacity="0.3"/></>}
    </svg>
  );
}

const WIDTH_OPTIONS = [
  { v: 100, label: "1/1" }, { v: 75, label: "3/4" }, { v: 66, label: "2/3" },
  { v: 50, label: "1/2" }, { v: 33, label: "1/3" }, { v: 25, label: "1/4" },
];

function parseContent(block: Block) { try { return JSON.parse(block.content); } catch { return {}; } }
function parseStyles(block: Block) { try { return JSON.parse(block.styles); } catch { return {}; } }
/** Safely coerce AI-generated values to string — prevents "Objects are not valid as React child" crashes */
function safeStr(v: unknown, fallback = ""): string {
  if (v === null || v === undefined) return fallback;
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map((item) => (typeof item === "object" && item !== null ? (item as any).label ?? "" : String(item))).filter(Boolean).join(" · ");
  if (typeof v === "object") return (v as any).label ?? (v as any).text ?? fallback;
  return fallback;
}
function genRowId() { return "row-" + Math.random().toString(36).slice(2); }

// ─── Per-element animation config ──────────────────
const ELEM_ANIM_OPTS = [
  { v: "",           label: "— Нет" },
  { v: "fade-up",    label: "↑ Снизу" },
  { v: "fade-down",  label: "↓ Сверху" },
  { v: "fade-left",  label: "← Слева" },
  { v: "fade-right", label: "→ Справа" },
  { v: "zoom-in",    label: "⊕ Зум" },
];
const BLOCK_ANIM_ELEMS: Record<string, { id: string; label: string }[]> = {
  HERO:         [{ id: "badge", label: "Бейдж" }, { id: "title", label: "Заголовок" }, { id: "subtitle", label: "Подзаголовок" }, { id: "cta", label: "Кнопки" }, { id: "image", label: "Изображение" }],
  CTA:          [{ id: "title", label: "Заголовок" }, { id: "subtitle", label: "Подзаголовок" }, { id: "cta", label: "Кнопки" }],
  FEATURES:     [{ id: "title", label: "Заголовок" }, { id: "subtitle", label: "Подзаголовок" }, { id: "items", label: "Карточки" }],
  TEXT:         [{ id: "title", label: "Заголовок" }, { id: "body", label: "Текст" }, { id: "link", label: "Ссылка" }],
  STATS:        [{ id: "title", label: "Заголовок" }, { id: "items", label: "Цифры" }],
  FAQ:          [{ id: "title", label: "Заголовок" }, { id: "items", label: "Вопросы" }],
  TESTIMONIALS: [{ id: "title", label: "Заголовок" }, { id: "items", label: "Отзывы" }],
  TEAM:         [{ id: "title", label: "Заголовок" }, { id: "items", label: "Участники" }],
  PRICING:      [{ id: "title", label: "Заголовок" }, { id: "items", label: "Тарифы" }],
  PRODUCTS:     [{ id: "title", label: "Заголовок" }, { id: "items", label: "Товары" }],
  GALLERY:      [{ id: "title", label: "Заголовок" }, { id: "items", label: "Изображения" }],
  CONTACTS:     [{ id: "title", label: "Заголовок" }, { id: "items", label: "Контакты" }],
  BLOG:         [{ id: "title", label: "Заголовок" }, { id: "items", label: "Статьи" }],
  FORM:         [{ id: "title", label: "Заголовок" }, { id: "fields", label: "Поля" }],
  HEADER_MENU:  [{ id: "logo", label: "Логотип" }, { id: "menu", label: "Меню" }],
  FOOTER:       [{ id: "logo", label: "Логотип" }, { id: "links", label: "Ссылки" }],
};

// ─── Rich Text Editor ──────────────

function RichTextEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isComposing = useRef(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const exec = (cmd: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const TOOLS = [
    { label: "B", cmd: "bold", title: "Жирный (Ctrl+B)", cls: "font-bold" },
    { label: "I", cmd: "italic", title: "Курсив (Ctrl+I)", cls: "italic" },
    { label: "U", cmd: "underline", title: "Подчёркнутый (Ctrl+U)", cls: "underline" },
    { label: "S̶", cmd: "strikeThrough", title: "Зачёркнутый", cls: "line-through" },
    { label: "|", cmd: "separator" },
    { label: "H1", cmd: "formatBlock", val: "h2", title: "Заголовок H1" },
    { label: "H2", cmd: "formatBlock", val: "h3", title: "Заголовок H2" },
    { label: "¶", cmd: "formatBlock", val: "p", title: "Абзац" },
    { label: "|", cmd: "separator" },
    { label: "⌦L", cmd: "justifyLeft", title: "По левому краю" },
    { label: "⌦C", cmd: "justifyCenter", title: "По центру" },
    { label: "⌦R", cmd: "justifyRight", title: "По правому краю" },
    { label: "|", cmd: "separator" },
    { label: "• ", cmd: "insertUnorderedList", title: "Маркированный список" },
    { label: "1.", cmd: "insertOrderedList", title: "Нумерованный список" },
    { label: "→", cmd: "indent", title: "Увеличить отступ" },
    { label: "←", cmd: "outdent", title: "Уменьшить отступ" },
    { label: "|", cmd: "separator" },
    { label: "🔗", cmd: "createLink", title: "Ссылка" },
    { label: "✕", cmd: "removeFormat", title: "Убрать форматирование" },
  ];

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-secondary">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border bg-secondary/60">
        {TOOLS.map((t, i) => {
          if (t.cmd === "separator") return <span key={i} className="w-px h-4 bg-border/60 mx-0.5 flex-shrink-0" />;
          return (
            <button key={t.cmd + (t.val || "") + i} type="button" title={t.title}
              onMouseDown={e => {
                e.preventDefault();
                if (t.cmd === "createLink") {
                  const url = prompt("URL ссылки:");
                  if (url) exec(t.cmd, url);
                } else {
                  exec(t.cmd, t.val);
                }
              }}
              className={`px-2 py-0.5 text-[11px] rounded hover:bg-primary/20 hover:text-primary text-muted-foreground transition ${t.cls || ""}`}>
              {t.label}
            </button>
          );
        })}
        <span className="w-px h-4 bg-border/60 mx-0.5 flex-shrink-0" />
        <input type="color" title="Цвет текста" defaultValue="#ffffff"
          onInput={e => { exec("foreColor", (e.target as HTMLInputElement).value); }}
          className="w-5 h-5 rounded cursor-pointer border border-border/50 flex-shrink-0" style={{ padding: "1px" }} />
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onCompositionStart={() => { isComposing.current = true; }}
        onCompositionEnd={() => {
          isComposing.current = false;
          if (editorRef.current) onChange(editorRef.current.innerHTML);
        }}
        onInput={() => {
          if (!isComposing.current && editorRef.current) onChange(editorRef.current.innerHTML);
        }}
        className="min-h-[120px] px-3 py-2.5 text-sm text-foreground focus:outline-none prose-sm rich-editor"
        style={{ lineHeight: "1.7" }}
      />
    </div>
  );
}

// ─── Block Preview ─────────────────

function BlockPreview({ block, viewport = "desktop" }: { block: Block; viewport?: string }) {
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
    ...(s.fontFamily ? { fontFamily: s.fontFamily } : {}),
  };

  switch (block.type) {
    case "HERO": {
      const hv2 = s.variant || "centered";
      if (hv2 === "split") return (
        <div style={{ ...bgStyle, color: s.textColor || "#fff" }} className="w-full flex min-h-[220px]">
          <div className="flex-1 flex flex-col justify-center px-8 py-10">
            <div className="text-2xl font-black mb-3 leading-tight">{safeStr(c.title, "Заголовок")}</div>
            <div className="text-sm opacity-60 mb-6 max-w-xs">{safeStr(c.subtitle, "Подзаголовок")}</div>
            <div className="flex gap-3">
              <span className="text-sm px-5 py-2 rounded-lg font-semibold" style={{ backgroundColor: s.ctaColor || "#7C3AED", color: "#fff" }}>{safeStr(c.cta, "Начать")}</span>
              {c.ctaSecondary && <span className="text-sm px-5 py-2 rounded-lg border border-white/20">{safeStr(c.ctaSecondary)}</span>}
            </div>
          </div>
          <div className="w-2/5 flex-shrink-0 bg-gradient-to-br from-purple-700 to-indigo-800 flex items-center justify-center relative overflow-hidden min-h-[220px]">
            {c.heroImage ? <img src={c.heroImage} className="w-full h-full object-cover absolute inset-0" /> : <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm" />}
          </div>
        </div>
      );
      if (hv2 === "minimal") return (
        <div style={{ ...bgStyle, color: s.textColor || "#111", background: s.bg || "#f9fafb" }} className="w-full py-12 px-8 flex flex-col items-center text-center">
          <div className="text-2xl font-bold mb-3 leading-tight">{safeStr(c.title, "Заголовок")}</div>
          <div className="text-sm mb-6 max-w-sm" style={{ opacity: 0.5 }}>{safeStr(c.subtitle, "Подзаголовок")}</div>
          <div className="flex gap-3">
            <span className="text-sm px-6 py-2 rounded-lg font-semibold" style={{ backgroundColor: s.ctaColor || "#7C3AED", color: "#fff" }}>{safeStr(c.cta, "Начать")}</span>
            {c.ctaSecondary && <span className="text-sm px-6 py-2 rounded-lg border border-black/15">{safeStr(c.ctaSecondary)}</span>}
          </div>
        </div>
      );
      return (
        <div style={{ ...bgStyle, color: s.textColor || "#fff" }} className="w-full py-12 px-8 flex flex-col items-center text-center">
          <div className="text-2xl font-black mb-3 leading-tight">{safeStr(c.title, "Заголовок")}</div>
          <div className="text-sm opacity-60 mb-6 max-w-sm">{safeStr(c.subtitle, "Подзаголовок")}</div>
          <div className="flex gap-3">
            <span className="text-sm px-6 py-2 rounded-lg font-semibold" style={{ backgroundColor: s.ctaColor || "#7C3AED", color: "#fff" }}>{safeStr(c.cta, "Начать")}</span>
            {c.ctaSecondary && <span className="text-sm px-6 py-2 rounded-lg border border-white/20">{safeStr(c.ctaSecondary)}</span>}
          </div>
        </div>
      );
    }
    case "FEATURES": {
      const fv2 = s.variant || "cards";
      if (fv2 === "list") return (
        <div style={{ ...bgStyle, color: s.textColor || "#e2e8f0" }} className="w-full py-8 px-6">
          <div className="text-base font-bold text-center mb-2">{c.title}</div>
          <div className="text-sm opacity-50 text-center mb-5">{c.subtitle}</div>
          <div className="divide-y divide-white/8">
            {(c.items || []).slice(0, 5).map((it: any, i: number) => (
              <div key={i} className="flex items-center gap-4 py-3">
                <div className="w-8 h-8 flex-shrink-0 bg-purple-600/20 rounded-lg flex items-center justify-center text-purple-400 text-sm">
                  {it.iconUrl ? <img src={it.iconUrl} className="w-5 h-5 object-contain" /> : (it.icon || "◆")}
                </div>
                <div><div className="text-xs font-bold">{it.title}</div><div className="text-xs opacity-40">{it.desc}</div></div>
              </div>
            ))}
          </div>
        </div>
      );
      if (fv2 === "alternating") return (
        <div style={{ ...bgStyle, color: s.textColor || "#e2e8f0" }} className="w-full py-8 px-6">
          <div className="text-base font-bold text-center mb-2">{c.title}</div>
          <div className="text-sm opacity-50 text-center mb-5">{c.subtitle}</div>
          <div className="space-y-5">
            {(c.items || []).slice(0, 3).map((it: any, i: number) => (
              <div key={i} className={`flex items-center gap-5 ${i % 2 === 1 ? "flex-row-reverse" : ""}`}>
                <div className="w-14 h-14 flex-shrink-0 bg-purple-600/15 rounded-xl flex items-center justify-center text-2xl border border-purple-500/20">
                  {it.iconUrl ? <img src={it.iconUrl} className="w-8 h-8 object-contain" /> : (it.icon || "◆")}
                </div>
                <div className="flex-1"><div className="text-sm font-bold mb-1">{it.title}</div><div className="text-xs opacity-40">{it.desc}</div></div>
              </div>
            ))}
          </div>
        </div>
      );
      return (
        <div style={{ ...bgStyle, color: s.textColor || "#e2e8f0" }} className="w-full py-8 px-6">
          <div className="text-base font-bold text-center mb-2">{c.title}</div>
          <div className="text-sm opacity-50 text-center mb-5">{c.subtitle}</div>
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min((c.items || []).length || 1, s.columns || 3)}, 1fr)` }}>
            {(c.items || []).slice(0, 6).map((it: any, i: number) => (
              <div key={i} className="bg-white/5 rounded-xl p-4 text-center" style={s.cardBg ? { backgroundColor: s.cardBg } : {}}>
                {it.iconUrl ? <img src={it.iconUrl} className="w-8 h-8 mx-auto mb-2 object-contain" /> : <div className="w-8 h-8 bg-purple-600/30 rounded-lg mx-auto mb-2 flex items-center justify-center text-purple-400 text-base">{it.icon || "◆"}</div>}
                <div className="text-xs font-bold mb-1">{it.title}</div>
                <div className="text-xs opacity-50">{it.desc}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "PRICING": {
      const pv2 = s.variant || "cards";
      if (pv2 === "table") {
        const plans2 = c.plans || [];
        const allF = Array.from(new Set(plans2.flatMap((p: any) => p.features || []))) as string[];
        return (
          <div style={{ ...bgStyle, color: s.textColor || "#fff" }} className="w-full py-8 px-6 overflow-x-auto">
            <div className="text-base font-bold text-center mb-1">{c.title}</div>
            <div className="text-sm opacity-50 text-center mb-5">{c.subtitle}</div>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="p-2 text-left opacity-40">Функции</th>
                  {plans2.map((p: any, i: number) => (
                    <th key={i} className={`p-2 text-center ${p.highlighted ? "bg-purple-600/40 rounded-t-lg" : "bg-white/5"}`}>
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-lg font-black">{p.price}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allF.slice(0, 4).map((f, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td className="p-2 opacity-60">{f}</td>
                    {plans2.map((p: any, j: number) => (
                      <td key={j} className={`p-2 text-center ${p.highlighted ? "bg-purple-600/20" : ""}`}>
                        {(p.features || []).includes(f) ? <span className="text-green-400">✓</span> : <span className="opacity-20">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      return (
        <div style={{ ...bgStyle, color: s.textColor || "#fff" }} className="w-full py-8 px-6">
          <div className="text-base font-bold text-center mb-1">{c.title}</div>
          <div className="text-sm opacity-50 text-center mb-5">{c.subtitle}</div>
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${(c.plans || []).length}, 1fr)` }}>
            {(c.plans || []).map((p: any, i: number) => (
              <div key={i} className={`rounded-xl p-4 ${p.highlighted ? "bg-purple-600 ring-2 ring-purple-400" : "bg-white/6"}`}>
                <div className="text-xs font-semibold opacity-60 mb-1">{p.name}</div>
                <div className="text-2xl font-black">{p.price}</div>
                <div className="text-xs opacity-40">/{p.period}</div>
                <div className="mt-3 space-y-1">
                  {(p.features || []).map((f: string, j: number) => <div key={j} className="text-xs opacity-70">✓ {f}</div>)}
                </div>
                <div className={`mt-3 text-xs text-center py-1.5 rounded-lg font-semibold ${p.highlighted ? "bg-white text-purple-700" : "bg-white/10"}`}>{p.cta}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "TESTIMONIALS": {
      const tv2 = s.variant || "grid";
      if (tv2 === "quote") {
        const it0 = (c.items || [])[0] || {};
        return (
          <div style={{ ...bgStyle, color: s.textColor || "#cbd5e1" }} className="w-full py-10 px-8 flex flex-col items-center text-center">
            <div className="text-yellow-400 text-lg mb-4">★★★★★</div>
            <div className="text-base italic mb-5 max-w-md opacity-80">"{it0.text}"</div>
            <div className="flex items-center gap-3">
              {it0.avatar ? <img src={it0.avatar} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-purple-600/30 flex items-center justify-center text-xs font-bold text-purple-300">{(it0.author || "?")[0]}</div>}
              <div className="text-left"><div className="text-sm font-semibold">{it0.author}</div><div className="text-xs opacity-40">{it0.role}</div></div>
            </div>
          </div>
        );
      }
      if (tv2 === "list") return (
        <div style={{ ...bgStyle, color: s.textColor || "#cbd5e1" }} className="w-full py-8 px-6">
          <div className="text-base font-bold text-center mb-5">{c.title}</div>
          <div className="space-y-3">
            {(c.items || []).slice(0, 3).map((it: any, i: number) => (
              <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/5" style={s.cardBg ? { backgroundColor: s.cardBg } : {}}>
                <div className="text-yellow-400 text-xs mb-1">★★★★★</div>
                <div className="text-xs italic mb-2 opacity-80">"{it.text}"</div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-600/30 flex items-center justify-center text-xs font-bold text-purple-300 flex-shrink-0">{(it.author || "?")[0]}</div>
                  <div className="text-xs font-semibold">{it.author}</div>
                  <div className="text-xs opacity-40">{it.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
      return (
        <div style={{ ...bgStyle, color: s.textColor || "#cbd5e1" }} className="w-full py-8 px-6">
          <div className="text-base font-bold text-center mb-1">{c.title}</div>
          <div className="text-sm opacity-50 text-center mb-5">{c.subtitle || "\u00a0"}</div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {(c.items || []).slice(0, 4).map((it: any, i: number) => (
              <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/5" style={s.cardBg ? { backgroundColor: s.cardBg } : {}}>
                <div className="text-yellow-400 text-xs mb-2">★★★★★</div>
                <div className="text-sm italic mb-3 opacity-80">"{it.text}"</div>
                <div className="flex items-center gap-2 mt-2">
                  {it.avatar ? <img src={it.avatar} className="w-8 h-8 rounded-full object-cover flex-shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden"); }} /> : null}
                  <div className={`w-8 h-8 rounded-full bg-purple-600/30 flex items-center justify-center text-xs font-bold text-purple-300 flex-shrink-0 ${it.avatar ? "hidden" : ""}`}>{(it.author || "?")[0]}</div>
                  <div><div className="text-xs font-semibold">{it.author}</div><div className="text-xs opacity-40">{it.role}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "STATS": {
      const stv2 = s.variant || "row";
      if (stv2 === "cards") return (
        <div style={{ ...bgStyle, color: s.textColor || "#fff" }} className="w-full py-8 px-6">
          <div className="text-base font-bold text-center mb-5">{c.title}</div>
          <div className="grid grid-cols-2 gap-3">
            {(c.items || []).map((it: any, i: number) => (
              <div key={i} className="bg-white/5 rounded-xl p-5 text-center border border-white/5" style={s.cardBg ? { backgroundColor: s.cardBg } : {}}>
                <div className="text-3xl font-black text-purple-400 mb-1">{it.value}</div>
                <div className="text-xs opacity-50">{it.label}</div>
              </div>
            ))}
          </div>
        </div>
      );
      return (
        <div style={{ ...bgStyle, color: s.textColor || "#fff" }} className="w-full py-8 px-6">
          <div className="text-base font-bold text-center mb-5">{c.title}</div>
          <div className="grid grid-cols-4 gap-3">
            {(c.items || []).map((it: any, i: number) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-black text-purple-400 mb-1">{it.value}</div>
                <div className="text-xs opacity-50">{it.label}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "TEAM": {
      const tmv2 = s.variant || "cards";
      if (tmv2 === "list") return (
        <div style={{ ...bgStyle, color: s.textColor || "#fff" }} className="w-full py-8 px-6">
          <div className="text-base font-bold text-center mb-1">{c.title}</div>
          {c.subtitle && <div className="text-sm opacity-50 text-center mb-4">{c.subtitle}</div>}
          <div className="divide-y divide-white/8">
            {(c.members || []).slice(0, 4).map((m: any, i: number) => (
              <div key={i} className="flex items-center gap-4 py-3">
                {m.avatar ? <img src={m.avatar} className="w-11 h-11 rounded-full object-cover flex-shrink-0" /> : <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold">{(m.name || "?")[0]}</div>}
                <div><div className="text-xs font-bold">{m.name}</div><div className="text-xs opacity-40">{m.role}</div></div>
              </div>
            ))}
          </div>
        </div>
      );
      return (
        <div style={{ ...bgStyle, color: s.textColor || "#fff" }} className="w-full py-8 px-6">
          <div className="text-base font-bold text-center mb-1">{c.title}</div>
          {c.subtitle && <div className="text-sm opacity-50 text-center mb-4">{c.subtitle}</div>}
          <div className="flex gap-3 justify-center mt-4">
            {(c.members || []).slice(0, 4).map((m: any, i: number) => (
              <div key={i} className="bg-white/6 rounded-xl p-4 text-center flex-1 max-w-[150px]" style={s.cardBg ? { backgroundColor: s.cardBg } : {}}>
                {m.avatar ? <img src={m.avatar} className="w-14 h-14 rounded-full object-cover mx-auto mb-2" /> : <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-lg">{(m.name || "?")[0]}</div>}
                <div className="text-xs font-semibold">{m.name}</div>
                <div className="text-xs opacity-40 mt-0.5">{m.role}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "FAQ": {
      const faqv2 = s.variant || "accordion";
      if (faqv2 === "grid") return (
        <div style={{ ...bgStyle, color: s.textColor || "#e2e8f0" }} className="w-full py-8 px-6">
          <div className="text-base font-bold text-center mb-5">{c.title}</div>
          <div className="grid grid-cols-2 gap-3">
            {(c.items || []).slice(0, 4).map((it: any, i: number) => (
              <div key={i} className="bg-white/4 rounded-xl p-4 border border-white/5">
                <div className="text-xs font-bold mb-1">{it.q}</div>
                <div className="text-xs opacity-40">{it.a}</div>
              </div>
            ))}
          </div>
        </div>
      );
      return (
        <div style={{ ...bgStyle, color: s.textColor || "#e2e8f0" }} className="w-full py-8 px-8">
          <div className="text-base font-bold mb-5">{c.title}</div>
          <div className="space-y-3">
            {(c.items || []).slice(0, 4).map((it: any, i: number) => (
              <div key={i} className="border border-white/8 rounded-xl p-3">
                <div className="text-sm font-semibold flex justify-between items-center">{it.q}<span className="text-purple-400">+</span></div>
                <div className="text-xs opacity-50 mt-1">{it.a}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "CTA": {
      const cv2 = s.variant || "centered";
      if (cv2 === "banner") return (
        <div style={{ ...bgStyle, color: s.textColor || "#fff" }} className="w-full py-6 px-8">
          <div className="flex items-center justify-between gap-8">
            <div>
              <div className="text-xl font-black">{safeStr(c.title)}</div>
              <div className="text-sm opacity-60 mt-0.5">{safeStr(c.subtitle)}</div>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <span className="text-sm px-5 py-2 rounded-lg font-bold" style={{ backgroundColor: s.ctaColor || "#7C3AED", color: "#fff" }}>{safeStr(c.cta)}</span>
              {c.ctaSecondary && <span className="text-sm px-5 py-2 border border-white/40 rounded-lg">{safeStr(c.ctaSecondary)}</span>}
            </div>
          </div>
        </div>
      );
      if (cv2 === "split") return (
        <div style={{ ...bgStyle, color: s.textColor || "#fff" }} className="w-full py-10 px-8 flex items-center gap-10">
          <div className="flex-1">
            <div className="text-2xl font-black mb-2">{safeStr(c.title)}</div>
            <div className="text-sm opacity-60">{safeStr(c.subtitle)}</div>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            <span className="text-sm px-6 py-2 rounded-lg font-bold text-center" style={{ backgroundColor: s.ctaColor || "#7C3AED", color: "#fff" }}>{safeStr(c.cta)}</span>
            {c.ctaSecondary && <span className="text-sm px-6 py-2 border border-white/40 rounded-lg text-center">{safeStr(c.ctaSecondary)}</span>}
          </div>
        </div>
      );
      return (
        <div style={{ ...bgStyle, color: s.textColor || "#fff" }} className="w-full py-12 px-8 flex flex-col items-center text-center">
          <div className="text-2xl font-black mb-2">{safeStr(c.title)}</div>
          <div className="text-sm opacity-60 mb-6">{safeStr(c.subtitle)}</div>
          <div className="flex gap-3">
            <span className="text-sm px-6 py-2 rounded-lg font-bold" style={{ backgroundColor: s.ctaColor || "#7C3AED", color: "#fff" }}>{safeStr(c.cta)}</span>
            {c.ctaSecondary && <span className="text-sm px-6 py-2 border border-white/40 rounded-lg">{safeStr(c.ctaSecondary)}</span>}
          </div>
        </div>
      );
    }
    case "TEXT":
      return (
        <div style={{ ...bgStyle, color: s.textColor || "#e2e8f0", textAlign: (s.align as any) || "left" }} className="w-full py-8 px-8">
          {c.title && <div className="text-xl font-bold mb-3">{c.title}</div>}
          {c.bodyHtml ? (
            <div className="text-sm leading-relaxed rich-content" dangerouslySetInnerHTML={{ __html: c.bodyHtml }} />
          ) : (
            <div className="text-sm opacity-60 leading-relaxed whitespace-pre-wrap">{c.body}</div>
          )}
          {c.link && <a href={c.link} className="text-sm text-purple-400 mt-3 inline-flex items-center gap-1 font-semibold">{c.linkLabel || "Подробнее"} →</a>}
        </div>
      );
    case "GALLERY": {
      const allImages: { url: string; caption?: string }[] = [
        ...(c.galleryItems || []).filter((g: any) => g.url),
        ...(c.images || []).map((url: string) => ({ url })),
      ];
      const cols = c.columns || 3;
      const galv2 = s.variant || "grid";
      if (galv2 === "masonry") return (
        <div style={bgStyle} className="w-full py-8 px-6">
          <div style={{ color: s.textColor || "#fff" }} className="text-base font-bold text-center mb-5">{c.title}</div>
          <div style={{ columnCount: cols, columnGap: "0.5rem" }}>
            {allImages.length > 0 ? allImages.slice(0, 9).map((img, i) => (
              <div key={i} className="mb-2 break-inside-avoid">
                <img src={img.url} className="w-full rounded-lg object-cover" style={{ height: i % 2 === 0 ? "96px" : "128px" }} />
              </div>
            )) : Array.from({ length: cols * 2 }).map((_, i) => (
              <div key={i} className="mb-2 break-inside-avoid" style={{ height: i % 2 === 0 ? "96px" : "128px" }}>
                <div className="h-full bg-white/5 rounded-lg border border-dashed border-white/10 flex items-center justify-center">
                  <Image size={16} className="text-white/20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
      return (
        <div style={bgStyle} className="w-full py-8 px-6">
          <div style={{ color: s.textColor || "#fff" }} className="text-base font-bold text-center mb-5">{c.title}</div>
          {allImages.length > 0 ? (
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
              {allImages.slice(0, 12).map((img, i: number) => (
                <div key={i}>
                  <img src={img.url} className="w-full h-24 object-cover rounded-lg" />
                  {img.caption && <div style={{ color: s.textColor || "#fff" }} className="text-xs opacity-50 text-center mt-1">{img.caption}</div>}
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
              {Array.from({ length: cols }).map((_, i) => (
                <div key={i} className="h-24 bg-white/5 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-1">
                  <Image size={18} className="text-white/20" />
                  <span className="text-xs text-white/20">Изображение</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    case "VIDEO":
      return (
        <div style={bgStyle} className="w-full py-8 px-6">
          <div style={{ color: s.textColor || "#fff" }} className="text-base font-bold text-center mb-3">{c.title}</div>
          <div className="bg-black/50 rounded-xl overflow-hidden" style={{ paddingTop: "42%" , position: "relative" }}>
            {c.url
              ? <iframe src={c.url} className="absolute inset-0 w-full h-full" allowFullScreen />
              : <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20 gap-2"><Video size={32} /><span className="text-xs">Вставьте URL видео</span></div>
            }
          </div>
          {c.description && <div style={{ color: s.textColor || "#fff" }} className="text-sm opacity-60 text-center mt-3 max-w-lg mx-auto">{c.description}</div>}
        </div>
      );
    case "PRODUCTS": {
      const cur = s.currency || "₽";
      const fmtP = (raw: string) => {
        const n = parseFloat(raw?.replace(/[^\d.,]/g, "").replace(",", "."));
        return isNaN(n) ? raw || "0" : `${n.toLocaleString("ru-RU")} ${cur}`;
      };
      return (
        <div style={bgStyle} className="w-full py-8 px-6">
          {c.title && <div style={{ color: s.textColor || "#fff" }} className="text-base font-bold text-center mb-2">{c.title}</div>}
          {c.subtitle && <div style={{ color: s.textColor || "#fff" }} className="text-sm opacity-50 text-center mb-5">{c.subtitle}</div>}
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min((c.items||[]).length || 1, s.columns||3)}, 1fr)` }}>
            {(c.items || []).slice(0, 6).map((p: any, i: number) => (
              <div key={i} className="bg-white/6 rounded-xl overflow-hidden border border-white/5 hover:border-purple-500/30 transition">
                <div className="h-28 bg-white/4 flex items-center justify-center border-b border-white/5 relative overflow-hidden">
                  {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <ShoppingBag size={24} className="text-white/15" />}
                  {p.badge && <span className="absolute top-2 left-2 text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full font-semibold">{p.badge}</span>}
                </div>
                <div className="p-3">
                  <div style={{ color: s.textColor || "#fff" }} className="text-sm font-semibold leading-snug mb-0.5">{p.name}</div>
                  {p.description && <div className="text-xs opacity-40 mb-1 truncate" style={{ color: s.textColor || "#fff" }}>{p.description}</div>}
                  <div className="text-purple-400 font-bold text-base">{fmtP(p.price)}</div>
                  <div className="mt-2 text-xs py-1.5 bg-purple-600 text-white rounded-lg text-center font-semibold cursor-pointer">В корзину</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "CONTACTS":
      return (
        <div style={{ ...bgStyle, color: s.textColor || "#e2e8f0" }} className="w-full py-8 px-8">
          <div className="text-base font-bold mb-2">{c.title}</div>
          <div className="text-sm opacity-50 mb-5">{c.subtitle}</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              {c.email && <div className="flex items-center gap-2 text-sm"><span className="text-purple-400">✉</span>{c.email}</div>}
              {c.phone && <div className="flex items-center gap-2 text-sm"><span className="text-purple-400">☎</span>{c.phone}</div>}
              {c.address && <div className="flex items-center gap-2 text-sm"><span className="text-purple-400">📍</span>{c.address}</div>}
              {c.telegram && <div className="flex items-center gap-2 text-sm"><span className="text-purple-400">✈</span>{c.telegram}</div>}
            </div>
          </div>
        </div>
      );
    case "FORM":
      return (
        <div style={{ ...bgStyle, color: s.textColor || "#e2e8f0" }} className="w-full py-8 px-8">
          <div className="text-base font-bold mb-5">{c.title}</div>
          <div className="space-y-3">
            {(c.fields || []).slice(0, 3).map((f: any, i: number) => (
              <div key={i} className="bg-white/5 rounded-xl px-4 py-2.5 text-sm opacity-50 border border-white/8">{f.placeholder || f.label}</div>
            ))}
            <div className="text-sm text-center py-2.5 rounded-xl font-semibold" style={{ backgroundColor: s.ctaColor || "#7C3AED", color: "#fff" }}>{c.ctaLabel}</div>
          </div>
        </div>
      );
    case "HEADER_MENU": {
      const hmv = s.variant || "split";
      if (viewport === "mobile") return (
        <div style={{ ...bgStyle, color: s.textColor || "#e2e8f0" }} className="w-full px-4 py-3 flex items-center justify-between border-b border-white/5">
          <div className="text-base font-bold">{safeStr(c.logo)}</div>
          <div className="flex flex-col gap-1 cursor-pointer p-1">
            <div className="w-5 h-0.5 rounded" style={{ backgroundColor: s.textColor || "#e2e8f0" }} />
            <div className="w-5 h-0.5 rounded" style={{ backgroundColor: s.textColor || "#e2e8f0" }} />
            <div className="w-5 h-0.5 rounded" style={{ backgroundColor: s.textColor || "#e2e8f0" }} />
          </div>
        </div>
      );
      // normalise links — AI may return them as "menuItems" or other field names
      const hmLinks: any[] = Array.isArray(c.links) ? c.links : Array.isArray(c.menuItems) ? c.menuItems : [];
      if (hmv === "logo_center") return (
        <div style={{ ...bgStyle, color: s.textColor || "#e2e8f0" }} className="w-full border-b border-white/5">
          <div className="flex items-center justify-center px-8 py-3 border-b border-white/5">
            <div className="text-base font-bold">{safeStr(c.logo)}</div>
          </div>
          <div className="flex items-center justify-between px-8 py-2">
            <div className="flex gap-5 flex-1 justify-center">
              {hmLinks.slice(0, 6).map((l: any, i: number) => (
                <span key={i} className={`text-sm ${l.active ? "text-purple-400 font-semibold" : "opacity-60"} cursor-pointer`}>{safeStr(l.label ?? l)}</span>
              ))}
            </div>
            {!c.hideCta && <span className="text-sm px-4 py-1.5 rounded-lg font-semibold flex-shrink-0" style={{ backgroundColor: s.ctaColor || "#7C3AED", color: "#fff" }}>{safeStr(c.cta)}</span>}
          </div>
        </div>
      );
      if (hmv === "minimal") return (
        <div style={{ ...bgStyle, color: s.textColor || "#e2e8f0" }} className="w-full px-8 py-4 flex items-center justify-between border-b border-white/5">
          <div className="text-base font-bold">{safeStr(c.logo)}</div>
          {!c.hideCta && <span className="text-sm px-4 py-1.5 rounded-lg font-semibold" style={{ backgroundColor: s.ctaColor || "#7C3AED", color: "#fff" }}>{safeStr(c.cta)}</span>}
        </div>
      );
      return (
        <div style={{ ...bgStyle, color: s.textColor || "#e2e8f0" }} className="w-full px-8 py-4 flex items-center justify-between border-b border-white/5">
          <div className="text-base font-bold flex-shrink-0">{safeStr(c.logo)}</div>
          <div className="flex gap-5 flex-1 justify-center">
            {hmLinks.slice(0, 6).map((l: any, i: number) => (
              <span key={i} className={`text-sm ${l.active ? "text-purple-400 font-semibold" : "opacity-60 hover:opacity-100"} cursor-pointer transition`}>{safeStr(l.label ?? l)}</span>
            ))}
          </div>
          {!c.hideCta && <span className="text-sm px-4 py-1.5 rounded-lg font-semibold flex-shrink-0" style={{ backgroundColor: s.ctaColor || "#7C3AED", color: "#fff" }}>{safeStr(c.cta)}</span>}
        </div>
      );
    }
    case "FOOTER": {
      const fv3 = s.variant || "columns";
      const footerLinks: any[] = Array.isArray(c.links) ? c.links : [];
      if (fv3 === "minimal") return (
        <div style={{ ...bgStyle, color: s.textColor || "#475569" }} className="w-full py-4 px-8 border-t border-white/5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="text-xs font-bold text-white/50">{safeStr(c.company)}</div>
            <div className="flex gap-4 flex-wrap">
              {footerLinks.map((l: any, i: number) => <span key={i} className="text-xs opacity-50">{safeStr(l.label ?? l)}</span>)}
            </div>
            <div className="text-xs opacity-30">{safeStr(c.copyright)}</div>
          </div>
        </div>
      );
      if (fv3 === "centered") return (
        <div style={{ ...bgStyle, color: s.textColor || "#475569" }} className="w-full py-8 px-8 text-center">
          <div className="text-sm font-bold text-white/60 mb-1">{safeStr(c.company)}</div>
          <div className="text-xs opacity-50 mb-3">{safeStr(c.slogan)}</div>
          <div className="flex gap-4 justify-center flex-wrap mb-3">
            {footerLinks.map((l: any, i: number) => <span key={i} className="text-xs opacity-50">{safeStr(l.label ?? l)}</span>)}
          </div>
          <div className="border-t border-white/5 pt-3 text-xs opacity-30">{safeStr(c.copyright)}</div>
        </div>
      );
      return (
        <div style={{ ...bgStyle, color: s.textColor || "#475569" }} className="w-full py-8 px-8">
          <div className="flex flex-col sm:flex-row justify-between gap-6 mb-6">
            <div>
              <div className="text-sm font-bold text-white/60 mb-1">{safeStr(c.company)}</div>
              <div className="text-xs opacity-50">{safeStr(c.slogan)}</div>
            </div>
            <div className="flex gap-4 flex-wrap">
              {footerLinks.map((l: any, i: number) => <span key={i} className="text-xs hover:text-white/70 cursor-pointer transition">{safeStr(l.label ?? l)}</span>)}
            </div>
          </div>
          <div className="border-t border-white/5 pt-4 text-xs opacity-40">{safeStr(c.copyright)}</div>
        </div>
      );
    }
    case "SCHEDULE":
      return (
        <div style={{ ...bgStyle, color: s.textColor || "#e2e8f0" }} className="w-full py-8 px-8">
          <div className="text-base font-bold mb-5">{c.title}</div>
          <div className="space-y-2">
            {(c.items || []).map((it: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-white/8">
                <div className="text-sm font-semibold">{it.type}</div>
                <div className="text-xs opacity-50">{it.trainer}</div>
                <div className="text-xs opacity-60">{it.day}</div>
                <div className="text-xs text-purple-400 font-semibold">{it.time}</div>
                <span className="text-xs bg-purple-600/20 text-purple-400 px-2 py-0.5 rounded-full">Записаться</span>
              </div>
            ))}
          </div>
        </div>
      );
    case "BLOG": {
      const bv2 = s.variant || "grid";
      if (bv2 === "list") return (
        <div style={{ ...bgStyle, color: s.textColor || "#e2e8f0" }} className="w-full py-8 px-6">
          <div className="text-base font-bold mb-2">{c.title}</div>
          <div className="text-sm opacity-50 mb-5">{c.subtitle}</div>
          <div className="space-y-3">
            {(c.items || []).slice(0, 4).map((it: any, i: number) => (
              <div key={i} className="flex gap-3 bg-white/5 rounded-xl overflow-hidden border border-white/5">
                <div className="w-24 h-18 flex-shrink-0 bg-white/4 flex items-center justify-center overflow-hidden">
                  {it.image ? <img src={it.image} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} /> : <FileText size={16} className="text-white/15" />}
                </div>
                <div className="p-3 flex flex-col justify-center">
                  {it.tag && <span className="text-xs bg-purple-600/20 text-purple-400 px-2 py-0.5 rounded-full font-semibold self-start mb-1">{it.tag}</span>}
                  <div className="text-xs font-bold">{it.title}</div>
                  <div className="text-xs opacity-40 mt-0.5">{it.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
      return (
        <div style={{ ...bgStyle, color: s.textColor || "#e2e8f0" }} className="w-full py-8 px-6">
          <div className="text-base font-bold mb-2">{c.title}</div>
          <div className="text-sm opacity-50 mb-5">{c.subtitle}</div>
          <div className="grid grid-cols-2 gap-3">
            {(c.items || []).slice(0, 4).map((it: any, i: number) => (
              <div key={i} className="bg-white/5 rounded-xl overflow-hidden border border-white/5">
                <div className="h-24 bg-white/4 border-b border-white/5 flex items-center justify-center overflow-hidden">
                  {it.image ? (
                    <img src={it.image} className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <FileText size={20} className="text-white/15" />
                  )}
                </div>
                <div className="p-3">
                  {it.tag && <span className="text-xs bg-purple-600/20 text-purple-400 px-2 py-0.5 rounded-full font-semibold">{it.tag}</span>}
                  <div className="text-xs font-bold mt-2">{it.title}</div>
                  {it.preview && <div className="text-xs opacity-40 mt-1 line-clamp-2">{it.preview}</div>}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs opacity-40">{it.date}</span>
                    <span className="text-xs text-purple-400 font-semibold cursor-pointer hover:opacity-80">
                      {it.ctaLabel || "Читать →"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "MUSIC_PLAYER": {
      const mp = c;
      return (
        <div style={{ ...bgStyle, color: s.textColor || "#f1f5f9" }} className="w-full py-8 px-8 flex items-center gap-6">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl flex items-center justify-center flex-shrink-0">
            <Music size={28} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="text-base font-bold">{mp.title}</div>
            <div className="text-sm opacity-60">{mp.artist} · {mp.album}</div>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-1 flex-1 bg-white/10 rounded-full"><div className="h-full w-1/3 bg-purple-400 rounded-full" /></div>
              <span className="text-xs opacity-40">1:23</span>
            </div>
            <div className="flex gap-2 mt-3">
              {mp.spotifyUrl && <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-lg">Spotify</span>}
              {mp.youtubeUrl && <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-lg">YouTube</span>}
            </div>
          </div>
        </div>
      );
    }
    case "DISCOGRAPHY":
      return (
        <div style={{ ...bgStyle, color: s.textColor || "#e2e8f0" }} className="w-full py-8 px-6">
          <div className="text-base font-bold mb-5">{c.title}</div>
          <div className="grid grid-cols-3 gap-3">
            {(c.albums || []).map((a: any, i: number) => (
              <div key={i} className="bg-white/6 rounded-xl overflow-hidden">
                <div className="h-24 bg-gradient-to-br from-purple-800 to-indigo-900 flex items-center justify-center">
                  {a.cover ? <img src={a.cover} className="w-full h-full object-cover" /> : <Music size={24} className="text-white/30" />}
                </div>
                <div className="p-2">
                  <div className="text-xs font-bold">{a.title}</div>
                  <div className="text-xs opacity-40">{a.year} · {a.tracks} треков</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    case "COACHES":
      return (
        <div style={{ ...bgStyle, color: s.textColor || "#fff" }} className="w-full py-8 px-6">
          <div className="text-base font-bold text-center mb-5">{c.title}</div>
          <div className="grid grid-cols-3 gap-3">
            {(c.members || []).map((m: any, i: number) => (
              <div key={i} className="bg-white/6 rounded-xl p-4 text-center">
                {m.avatar ? (
                  <img src={m.avatar} className="w-14 h-14 rounded-full object-cover mx-auto mb-3" />
                ) : (
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-lg font-bold">{(m.name || "?")[0]}</div>
                )}
                <div className="text-sm font-bold">{m.name}</div>
                <div className="text-xs opacity-50">{m.role}</div>
                <div className="text-xs opacity-40 mt-1">{m.bio}</div>
              </div>
            ))}
          </div>
        </div>
      );
    case "MAP":
      return (
        <div style={bgStyle} className="w-full py-8 px-6">
          {c.title && <div style={{ color: s.textColor || "#fff" }} className="text-base font-bold text-center mb-3">{c.title}</div>}
          <div className="bg-black/30 rounded-xl overflow-hidden" style={{ height: c.height || "300px" }}>
            {c.embedUrl ? (
              <iframe src={c.embedUrl} className="w-full h-full border-0" allowFullScreen loading="lazy" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-white/20 gap-2">
                <MapPin size={32} />
                <span className="text-xs">Вставьте URL карты (Google Maps / Yandex)</span>
              </div>
            )}
          </div>
        </div>
      );
    case "ZERO_BLOCK": {
      const zData = parseZeroData(c);
      const hasElements = zData.elements.length > 0;
      return (
        <div className="w-full relative" style={{ minHeight: zData.canvasHeight || 400 }}>
          {hasElements ? (
            <ZeroBlockRenderer content={c} styles={s} />
          ) : (
            <div style={{ ...bgStyle, minHeight: zData.canvasHeight || 400 }} className="flex flex-col items-center justify-center text-white/20 gap-3">
              <Code2 size={36} />
              <span className="text-sm font-medium">Zero Block</span>
              <span className="text-xs opacity-60">Откройте редактор чтобы добавить элементы</span>
            </div>
          )}
        </div>
      );
    }
    case "POPUP": {
      const popV = s.variant || "centered";
      const popId = c.popupId || block.id.slice(0, 8);
      return (
        <div className="w-full border-2 border-dashed border-purple-500/30 bg-purple-950/10 rounded-lg p-4 flex items-start gap-4" style={{ opacity: 0.85 }}>
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex-shrink-0 flex items-center justify-center">
            <PopupIcon size={18} className="text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-sm font-bold text-white/80">{c.title || "Попап"}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-600/20 text-purple-300 font-mono">#{popId}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-600/20 text-amber-300">скрыт · по триггеру</span>
            </div>
            <div className="text-xs text-white/30 mb-2">Вариант: {popV} {c.showForm ? "· с формой" : ""}</div>
            {c.body && <div className="text-xs text-white/40 line-clamp-2" dangerouslySetInnerHTML={{ __html: c.body }} />}
            {c.image && <div className="mt-2 h-10 w-16 rounded bg-white/5 overflow-hidden"><img src={c.image} className="w-full h-full object-cover" /></div>}
          </div>
        </div>
      );
    }
    default:
      return (
        <div style={{ ...bgStyle, color: s.textColor || "#e2e8f0" }} className="w-full py-8 px-6 text-center">
          <div className="text-sm opacity-40">{block.type}</div>
        </div>
      );
  }
}

// ─── Settings Panel ────────────────────────────────

const BLOCK_LABEL: Record<string, string> = {
  HERO: "Главный экран", CTA: "Призыв к действию", TEXT: "Текстовый блок", HEADER_MENU: "Шапка сайта",
  FOOTER: "Подвал", FEATURES: "Преимущества", STATS: "Статистика", TESTIMONIALS: "Отзывы",
  FAQ: "FAQ", TEAM: "Команда", PRICING: "Тарифы", PRODUCTS: "Товары", GALLERY: "Галерея",
  VIDEO: "Видео", MUSIC_PLAYER: "Плеер", DISCOGRAPHY: "Дискография", SCHEDULE: "Расписание",
  COACHES: "Тренеры", CONTACTS: "Контакты", FORM: "Форма заявки", BLOG: "Блог",
  ZERO_BLOCK: "Zero Block", MAP: "Карта", POPUP: "Попап",
};

const CONTENT_SUB_TABS: Partial<Record<string, { id: string; label: string }[]>> = {
  HERO:        [{ id: "text", label: "Текст" }, { id: "buttons", label: "Кнопки" }, { id: "media", label: "Медиа" }],
  CTA:         [{ id: "text", label: "Текст" }, { id: "buttons", label: "Кнопки" }, { id: "media", label: "Медиа" }],
  HEADER_MENU: [{ id: "main", label: "Основное" }, { id: "menu", label: "Меню" }],
  FOOTER:      [{ id: "main", label: "Основное" }, { id: "links", label: "Ссылки" }, { id: "social", label: "Соцсети" }],
  CONTACTS:    [{ id: "contacts", label: "Контакты" }, { id: "social", label: "Соцсети" }],
  FEATURES:    [{ id: "header", label: "Заголовок" }, { id: "items", label: "Элементы" }],
  STATS:       [{ id: "header", label: "Заголовок" }, { id: "items", label: "Показатели" }],
  TESTIMONIALS:[{ id: "header", label: "Заголовок" }, { id: "items", label: "Отзывы" }],
  FAQ:         [{ id: "header", label: "Заголовок" }, { id: "items", label: "Вопросы" }],
  TEAM:        [{ id: "header", label: "Заголовок" }, { id: "items", label: "Участники" }],
  PRICING:     [{ id: "header", label: "Заголовок" }, { id: "items", label: "Планы" }],
  PRODUCTS:    [{ id: "header", label: "Заголовок" }, { id: "items", label: "Товары" }],
  GALLERY:     [{ id: "header", label: "Заголовок" }, { id: "items", label: "Фото" }],
  BLOG:        [{ id: "header", label: "Заголовок" }, { id: "items", label: "Статьи" }],
  SCHEDULE:    [{ id: "header", label: "Заголовок" }, { id: "items", label: "Занятия" }],
  COACHES:     [{ id: "header", label: "Заголовок" }, { id: "items", label: "Тренеры" }],
  DISCOGRAPHY: [{ id: "header", label: "Заголовок" }, { id: "items", label: "Альбомы" }],
  POPUP: [{ id: "content", label: "Контент" }, { id: "form", label: "Форма" }, { id: "trigger", label: "Триггер" }],
};

function SettingsPanel({ block, siteId, onUpdate, onDelete, onMoveUp, onMoveDown, onAddColumn, onDuplicate, onToggleVisibility, blocks, pages, onBeforeSave, onOpenZeroBlock }: {
  block: Block; siteId: string;
  onUpdate: (b: Block) => void; onDelete: () => void;
  onMoveUp: () => void; onMoveDown: () => void; onAddColumn: () => void;
  onDuplicate: () => void; onToggleVisibility: () => void;
  blocks: Block[]; pages: Page[];
  onBeforeSave?: () => void;
  onOpenZeroBlock?: (id: string) => void;
}) {
  const [c, setC_] = useState(() => parseContent(block));
  const [s, setS_] = useState(() => parseStyles(block));
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [stylesTab, setStylesTab] = useState<string | null>(null);
  const [contentTab, setContentTab] = useState<string>("main");
  const cRef = useRef(c);
  const sRef = useRef(s);
  const contentDrag = useDraggable();
  const stylesDrag = useDraggable();

  useEffect(() => {
    const nc = parseContent(block); const ns = parseStyles(block);
    cRef.current = nc; sRef.current = ns;
    setC_(nc); setS_(ns); setDirty(false); setStylesTab(null);
    const tabs = CONTENT_SUB_TABS[block.type];
    setContentTab(tabs ? tabs[0].id : "main");
  }, [block.id]);

  const setC = (v: any) => { cRef.current = v; setC_(v); setDirty(true); };
  const setS = (v: any) => { sRef.current = v; setS_(v); setDirty(true); };
  const uc = (k: string, v: any) => setC({ ...cRef.current, [k]: v });
  const us = (k: string, v: any) => setS({ ...sRef.current, [k]: v });
  const ue = (elemId: string, field: string, v: any) => {
    const prevElems = sRef.current.elemAnims || {};
    const prevElem = prevElems[elemId] || {};
    if (field === "animation" && !v) {
      const { [elemId]: _, ...rest } = prevElems;
      us("elemAnims", Object.keys(rest).length ? rest : undefined);
      return;
    }
    us("elemAnims", { ...prevElems, [elemId]: { ...prevElem, [field]: v } });
  };

  const setWidth = async (w: number) => {
    onUpdate({ ...block, width: w });
    await sitesApi.updateBlock(siteId, block.id, { width: w });
  };

  const autoSaveContent = async (newC: any) => {
    onBeforeSave?.();
    cRef.current = newC; setC_(newC); setDirty(false);
    const updated = await sitesApi.updateBlock(siteId, block.id, { content: JSON.stringify(newC), styles: JSON.stringify(sRef.current), width: block.width });
    onUpdate(updated);
  };

  const autoSaveStyles = async (newS: any) => {
    sRef.current = newS; setS_(newS); setDirty(false);
    const updated = await sitesApi.updateBlock(siteId, block.id, { content: JSON.stringify(cRef.current), styles: JSON.stringify(newS), width: block.width });
    onUpdate(updated);
  };

  const save = async () => {
    onBeforeSave?.();
    setSaving(true);
    try {
      const updated = await sitesApi.updateBlock(siteId, block.id, { content: JSON.stringify(cRef.current), styles: JSON.stringify(sRef.current), width: block.width });
      onUpdate(updated); setDirty(false);
    } finally { setSaving(false); }
  };

  const blocksInRow = block.rowId ? blocks.filter(b => b.rowId === block.rowId) : [block];
  const canAdd = blocksInRow.length < 4;

  // ── Field helpers ──────────────────────────────────────────────────
  const F = (label: string, val: any, onChange: (v: any) => void, type = "text") => (
    <div>
      <label className="text-[11px] text-muted-foreground font-medium block mb-1">{label}</label>
      {type === "textarea"
        ? <textarea value={val || ""} onChange={e => onChange(e.target.value)} rows={3}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground resize-none focus:outline-none focus:border-primary" />
        : <input type={type} value={val || ""} onChange={e => onChange(e.target.value)}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary" />
      }
    </div>
  );

  const CF = (label: string, val: any, onChange: (v: any) => void) => (
    <div>
      <label className="text-[11px] text-muted-foreground font-medium block mb-1">{label}</label>
      <div className="flex gap-2 items-center">
        <input type="color" value={val && !val.startsWith("linear") ? val : "#1a1a2e"} onChange={e => onChange(e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-border flex-shrink-0" />
        <input type="text" value={val || ""} onChange={e => onChange(e.target.value)} className="flex-1 bg-secondary border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none" />
      </div>
    </div>
  );

  const [imgUploading, setImgUploading] = useState<string | null>(null);
  const IF = (label: string, val: any, onChange: (v: any) => void, fieldKey = label) => (
    <div>
      <label className="text-[11px] text-muted-foreground font-medium block mb-1">{label}</label>
      <div className="flex gap-1 items-center">
        <input type="text" value={val || ""} onChange={e => onChange(e.target.value)} placeholder="https://"
          className="flex-1 bg-secondary border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary" />
        <label title="Загрузить файл" className={`cursor-pointer flex-shrink-0 w-7 h-7 rounded-lg border ${imgUploading === fieldKey ? "border-primary bg-primary/15" : "border-border hover:border-primary/50 hover:bg-white/5"} flex items-center justify-center transition`}>
          {imgUploading === fieldKey
            ? <span className="animate-spin text-primary" style={{ fontSize: 11 }}>⟳</span>
            : <Image size={11} className="text-muted-foreground" />}
          <input type="file" accept="image/*" className="hidden" disabled={!!imgUploading} onChange={async e => {
            const file = e.target.files?.[0]; if (!file) return;
            setImgUploading(fieldKey);
            try { const url = await uploadImage(file); onChange(url); }
            catch { }
            finally { setImgUploading(null); e.target.value = ""; }
          }} />
        </label>
      </div>
      {val && <img src={val} alt="" className="mt-1.5 w-full h-16 object-cover rounded-lg border border-border/50 opacity-70" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />}
    </div>
  );

  const PP = (label: string, val: any, onChange: (v: any) => void) => (
    <LinkPickerInput label={label} val={val || ""} onChange={onChange} blocks={blocks} pages={pages} />
  );

  // ── Generic items list editor ──────────────────────────────────────
  const Items = (key: string, label: string, emptyItem: any, fields: [string, string, string?][]) => {
    const items: any[] = c[key] || [];
    const upd = (next: any[]) => uc(key, next);
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] text-muted-foreground font-medium">{label}</label>
          <button onClick={() => upd([...items, { ...emptyItem }])}
            className="text-xs text-primary px-2 py-0.5 rounded border border-primary/30 hover:bg-primary/10 transition">+ Добавить</button>
        </div>
        {items.map((item, idx) => (
          <div key={idx} className="bg-secondary/40 border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-2.5 py-1.5 bg-secondary/60 border-b border-border">
              <span className="text-[11px] font-semibold text-foreground">{label} {idx + 1}</span>
              <button onClick={() => upd(items.filter((_, i) => i !== idx))} className="text-red-400 text-xs hover:text-red-300 leading-none">✕</button>
            </div>
            <div className="p-2.5 space-y-2">
              {fields.map(([fk, fl, ft = "text"]) => {
                const fieldKey = `item-${idx}-${fk}`;
                const setVal = (v: any) => { const n = [...items]; n[idx] = { ...n[idx], [fk]: v }; upd(n); };
                return (
                  <div key={fk}>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">{fl}</label>
                    {ft === "textarea"
                      ? <textarea value={item[fk] || ""} onChange={e => setVal(e.target.value)} rows={2}
                          className="w-full bg-secondary border border-border rounded-lg px-2 py-1 text-xs text-foreground resize-none focus:outline-none focus:border-primary" />
                      : ft === "checkbox"
                      ? <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={!!item[fk]} onChange={e => setVal(e.target.checked)} className="rounded" />
                          <span className="text-xs text-muted-foreground">Включить</span>
                        </label>
                      : ft === "image"
                      ? <div>
                          <div className="flex gap-1 items-center">
                            <input type="text" value={item[fk] || ""} onChange={e => setVal(e.target.value)} placeholder="https://"
                              className="flex-1 bg-secondary border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary" />
                            <label title="Загрузить" className={`cursor-pointer flex-shrink-0 w-6 h-6 rounded-lg border ${imgUploading === fieldKey ? "border-primary bg-primary/15" : "border-border hover:border-primary/50"} flex items-center justify-center transition`}>
                              {imgUploading === fieldKey ? <span className="animate-spin text-primary" style={{ fontSize: 10 }}>⟳</span> : <Image size={10} className="text-muted-foreground" />}
                              <input type="file" accept="image/*" className="hidden" disabled={!!imgUploading} onChange={async e => {
                                const file = e.target.files?.[0]; if (!file) return;
                                setImgUploading(fieldKey);
                                try { setVal(await uploadImage(file)); } catch {}
                                finally { setImgUploading(null); e.target.value = ""; }
                              }} />
                            </label>
                          </div>
                          {item[fk] && <img src={item[fk]} alt="" className="mt-1 w-full h-12 object-cover rounded-lg border border-border/50 opacity-70" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                        </div>
                      : <input type={ft} value={item[fk] || ""} onChange={e => setVal(e.target.value)}
                          className="w-full bg-secondary border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary" />
                    }
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border flex-shrink-0">
        <span className="text-sm font-bold text-foreground">{BLOCK_LABEL[block.type] || block.type}</span>
        {dirty
          ? <span className="text-[11px] text-amber-400 font-medium flex items-center gap-1">● Не сохранено</span>
          : <span className="text-[11px] text-green-400 flex items-center gap-1"><Check size={11} /> Сохранено</span>
        }
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Width grid - hide for full-width structure blocks */}
        {block.type !== "HEADER_MENU" && block.type !== "FOOTER" && (
          <>
            <div>
              <label className="text-[11px] text-muted-foreground font-medium block mb-1.5">Ширина колонки</label>
              <div className="grid grid-cols-3 gap-1">
                {WIDTH_OPTIONS.map(o => (
                  <button key={o.v} onClick={() => setWidth(o.v)}
                    className={`text-xs py-1.5 rounded-lg border transition font-mono font-semibold ${block.width === o.v ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={onAddColumn} disabled={!canAdd}
              className="w-full flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition disabled:opacity-30 disabled:cursor-not-allowed">
              <SplitSquareHorizontal size={12} /> Добавить колонку рядом
            </button>
          </>
        )}

        {/* Block anchor ID */}
        <div className="border border-border/40 rounded-xl p-3 space-y-2 bg-secondary/20">
          <div className="flex items-center gap-1.5">
            <Hash size={10} className="text-primary" />
            <span className="text-[11px] text-foreground font-semibold">ID блока (якорь)</span>
          </div>
          {s.anchorId ? (
            <div className="bg-secondary rounded-lg px-2.5 py-1.5 flex items-center gap-2">
              <Hash size={10} className="text-primary flex-shrink-0" />
              <span className="text-xs font-mono text-primary font-medium flex-1">#{s.anchorId}</span>
              <button onClick={() => { navigator.clipboard.writeText("#" + s.anchorId); }} title="Скопировать"
                className="text-muted-foreground hover:text-foreground transition focus:outline-none">
                <Copy size={11} />
              </button>
            </div>
          ) : (
            <div className="bg-secondary/50 rounded-lg px-2.5 py-1.5 text-[11px] text-muted-foreground">
              Задайте ID ниже — он станет якорем для ссылок
            </div>
          )}
          <input value={s.anchorId || ""} onChange={e => us("anchorId", e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
            placeholder="например: about, contacts, hero" />
          <p className="text-[10px] text-muted-foreground leading-tight">
            Укажите <span className="font-mono text-primary/70">#id</span> в поле ссылки любой кнопки — при клике страница прокрутится к этому блоку
          </p>
        </div>

        {/* ═══ CONTENT popup ═══ */}
        {stylesTab === "content" && <div className="fixed inset-0 z-[48]" onClick={() => setStylesTab(null)} />}
        {stylesTab === "content" && (
          <div className="fixed z-[49] w-72 max-h-[calc(100vh-56px)] flex flex-col bg-card border border-border/80 rounded-xl shadow-2xl shadow-black/70"
            style={{ backdropFilter: "blur(12px)", left: contentDrag.pos.x, top: contentDrag.pos.y }}>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 flex-shrink-0 bg-secondary/40 rounded-t-xl cursor-grab active:cursor-grabbing select-none"
              onMouseDown={contentDrag.onHeaderMouseDown}>
              <div className="flex items-center gap-2">
                <span className="text-sm leading-none font-bold text-muted-foreground">≡</span>
                <span className="text-sm font-bold text-foreground">Контент блока</span>
                <span className="text-[10px] text-muted-foreground/30 ml-0.5">⠿</span>
              </div>
              <button onClick={() => setStylesTab(null)} className="w-6 h-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition text-xl leading-none">×</button>
            </div>
            {(() => {
              const subTabs = CONTENT_SUB_TABS[block.type];
              if (!subTabs) return null;
              return (
                <div className="flex border-b border-border/60 px-3 gap-0.5 flex-shrink-0 bg-secondary/20 overflow-x-auto">
                  {subTabs.map(t => (
                    <button key={t.id} onClick={() => setContentTab(t.id)}
                      className={`text-xs px-3 py-2 font-semibold transition whitespace-nowrap flex-shrink-0 border-b-2 ${contentTab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              );
            })()}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* HERO / CTA */}
          {(block.type === "HERO" || block.type === "CTA") && <>
            {contentTab === "text" && <>
              {F("Бейдж / пилюля (над заголовком)", c.badge, v => uc("badge", v))}
              {F("Заголовок", c.title, v => uc("title", v))}
              {F("Подзаголовок", c.subtitle, v => uc("subtitle", v), "textarea")}
            </>}
            {contentTab === "buttons" && <>
              {F("Текст кнопки 1", c.cta, v => uc("cta", v))}
              {PP("Ссылка кнопки 1", c.ctaUrl, v => uc("ctaUrl", v))}
              <div>
                <label className="text-[11px] text-muted-foreground font-medium block mb-1">Действие кнопки 1</label>
                <div className="grid grid-cols-2 gap-1 mb-2">
                  {[["link","Ссылка"],["popup","Открыть попап"]].map(([v,l]) => (
                    <button key={v} onClick={() => uc("ctaAction", v)}
                      className={`text-[10px] py-1.5 rounded-lg border transition ${(c.ctaAction||"link")===v?"border-primary bg-primary/15 text-primary":"border-border text-muted-foreground hover:border-primary/40"}`}>{l}</button>
                  ))}
                </div>
                {c.ctaAction === "popup" && (() => {
                  const popupBlocks = blocks.filter(b => b.type === "POPUP");
                  return popupBlocks.length > 0 ? (
                    <select value={c.ctaPopupId || ""} onChange={e => uc("ctaPopupId", e.target.value)}
                      className="w-full bg-secondary border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary">
                      <option value="">— выберите попап —</option>
                      {popupBlocks.map(pb => {
                        const pc = parseContent(pb);
                        return <option key={pb.id} value={pc.popupId || pb.id.slice(0, 8)}>{pc.title || "Попап"} (#{pc.popupId || pb.id.slice(0, 8)})</option>;
                      })}
                    </select>
                  ) : (
                    <p className="text-[10px] text-amber-400">Сначала добавьте блок «Попап» на страницу</p>
                  );
                })()}
              </div>
              <div className="border-t border-border/50 pt-3 mt-1">
                {F("Текст кнопки 2", c.ctaSecondary, v => uc("ctaSecondary", v))}
                {PP("Ссылка кнопки 2", c.ctaSecondaryUrl, v => uc("ctaSecondaryUrl", v))}
                <div>
                  <label className="text-[11px] text-muted-foreground font-medium block mb-1">Действие кнопки 2</label>
                  <div className="grid grid-cols-2 gap-1 mb-2">
                    {[["link","Ссылка"],["popup","Открыть попап"]].map(([v,l]) => (
                      <button key={v} onClick={() => uc("ctaSecondaryAction", v)}
                        className={`text-[10px] py-1.5 rounded-lg border transition ${(c.ctaSecondaryAction||"link")===v?"border-primary bg-primary/15 text-primary":"border-border text-muted-foreground hover:border-primary/40"}`}>{l}</button>
                    ))}
                  </div>
                  {c.ctaSecondaryAction === "popup" && (() => {
                    const popupBlocks = blocks.filter(b => b.type === "POPUP");
                    return popupBlocks.length > 0 ? (
                      <select value={c.ctaSecondaryPopupId || ""} onChange={e => uc("ctaSecondaryPopupId", e.target.value)}
                        className="w-full bg-secondary border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary">
                        <option value="">— выберите попап —</option>
                        {popupBlocks.map(pb => {
                          const pc = parseContent(pb);
                          return <option key={pb.id} value={pc.popupId || pb.id.slice(0, 8)}>{pc.title || "Попап"} (#{pc.popupId || pb.id.slice(0, 8)})</option>;
                        })}
                      </select>
                    ) : (
                      <p className="text-[10px] text-amber-400">Сначала добавьте блок «Попап» на страницу</p>
                    );
                  })()}
                </div>
              </div>
            </>}
            {contentTab === "media" && <>
              {IF("Фоновое изображение", c.heroImage, v => uc("heroImage", v), "heroImage")}
            </>}
          </>}

          {/* TEXT */}
          {block.type === "TEXT" && <>
            {F("Заголовок", c.title, v => uc("title", v))}
            <div>
              <label className="text-[11px] text-muted-foreground font-medium block mb-1.5">Текст (Rich Text)</label>
              <RichTextEditor
                value={c.bodyHtml || (c.body ? `<p>${c.body.replace(/\n/g, "<br/>")}</p>` : "")}
                onChange={html => { uc("bodyHtml", html); }}
              />
            </div>
            {F("Текст ссылки", c.linkLabel, v => uc("linkLabel", v))}
            {PP("URL ссылки", c.link, v => uc("link", v))}
          </>}

          {/* HEADER_MENU */}
          {block.type === "HEADER_MENU" && <>
            {contentTab === "main" && <>
              {F("Логотип / название", c.logo, v => uc("logo", v))}
              {F("Кнопка CTA", c.cta, v => uc("cta", v))}
              {PP("Ссылка CTA", c.ctaUrl, v => uc("ctaUrl", v))}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={c.hideCta === true} onChange={e => uc("hideCta", e.target.checked)} className="rounded" />
                <span className="text-xs text-muted-foreground">Скрыть кнопку CTA</span>
              </label>
            </>}
            {contentTab === "menu" && <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-muted-foreground font-medium">Пункты меню</label>
                  <button onClick={() => uc("links", [...(c.links||[]), { label: "Страница", url: "#", active: false }])}
                    className="text-xs text-primary px-2 py-0.5 rounded border border-primary/30 hover:bg-primary/10 transition">+ Добавить</button>
                </div>
                {(c.links || []).map((link: any, idx: number) => (
                  <div key={idx} className="bg-secondary/40 border border-border rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-2.5 py-1.5 bg-secondary/60 border-b border-border">
                      <span className="text-[11px] font-semibold text-foreground">{link.label || `Пункт ${idx+1}`}</span>
                      <button onClick={() => { const n=[...(c.links||[])]; n.splice(idx,1); uc("links",n); }} className="text-red-400 text-xs hover:text-red-300">✕</button>
                    </div>
                    <div className="p-2.5 space-y-2">
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-0.5">Название</label>
                        <input value={link.label||""} onChange={e => { const n=[...(c.links||[])]; n[idx]={...n[idx], label: e.target.value}; uc("links",n); }}
                          className="w-full bg-secondary border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary" />
                      </div>
                      <LinkPickerInput
                        label="Ссылка"
                        val={link.url || ""}
                        onChange={v => { const n=[...(c.links||[])]; n[idx]={...n[idx], url: v}; uc("links",n); }}
                        blocks={blocks}
                        pages={pages}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>}
          </>}

          {/* FOOTER */}
          {block.type === "FOOTER" && <>
            {contentTab === "main" && <>
              {IF("Логотип", c.logo, v => uc("logo", v), "logo")}
              {F("Название компании", c.company, v => uc("company", v))}
              {F("Слоган / описание", c.slogan, v => uc("slogan", v))}
              {F("Copyright", c.copyright, v => uc("copyright", v))}
            </>}
            {contentTab === "links" && <>
              {Items("links", "Ссылки в подвале", { label: "Страница", url: "#" },
                [["label", "Название"], ["url", "URL"]]
              )}
            </>}
            {contentTab === "social" && <>
              {F("Instagram", c.instagram, v => uc("instagram", v))}
              {F("Telegram", c.telegram, v => uc("telegram", v))}
              {F("VK", c.vk, v => uc("vk", v))}
              {F("YouTube", c.youtube, v => uc("youtube", v))}
              {F("Facebook", c.facebook, v => uc("facebook", v))}
            </>}
          </>}

          {/* FEATURES */}
          {block.type === "FEATURES" && <>
            {contentTab === "header" && <>
              {F("Заголовок секции", c.title, v => uc("title", v))}
              {F("Подзаголовок", c.subtitle, v => uc("subtitle", v))}
            </>}
            {contentTab === "items" && <>
              {Items("items", "Преимущества", { icon: "⭐", title: "Преимущество", desc: "Описание", iconUrl: "" },
                [["icon", "Иконка (emoji)"], ["iconUrl", "Или URL картинки", "image"], ["title", "Заголовок"], ["desc", "Описание", "textarea"]]
              )}
            </>}
          </>}

          {/* STATS */}
          {block.type === "STATS" && <>
            {contentTab === "header" && <>
              {F("Заголовок", c.title, v => uc("title", v))}
              {F("Подзаголовок", c.subtitle, v => uc("subtitle", v))}
            </>}
            {contentTab === "items" && <>
              {Items("items", "Показатели", { value: "100+", label: "Клиентов" },
                [["value", "Значение (100+, 99%)"], ["label", "Подпись"]]
              )}
            </>}
          </>}

          {/* TESTIMONIALS */}
          {block.type === "TESTIMONIALS" && <>
            {contentTab === "header" && <>
              {F("Заголовок", c.title, v => uc("title", v))}
              {F("Подзаголовок", c.subtitle, v => uc("subtitle", v))}
            </>}
            {contentTab === "items" && <>
              {Items("items", "Отзывы", { text: "Отличный сервис!", author: "Имя Фамилия", role: "Должность, Компания", avatar: "" },
                [["text", "Текст отзыва", "textarea"], ["author", "Автор"], ["role", "Должность / компания"], ["avatar", "Фото (URL)", "image"]]
              )}
            </>}
          </>}

          {/* FAQ */}
          {block.type === "FAQ" && <>
            {contentTab === "header" && <>
              {F("Заголовок", c.title, v => uc("title", v))}
              {F("Подзаголовок", c.subtitle, v => uc("subtitle", v))}
            </>}
            {contentTab === "items" && <>
              {Items("items", "Вопросы и ответы", { q: "Вопрос?", a: "Ответ" },
                [["q", "Вопрос"], ["a", "Ответ", "textarea"]]
              )}
            </>}
          </>}

          {/* TEAM */}
          {block.type === "TEAM" && <>
            {contentTab === "header" && <>
              {F("Заголовок", c.title, v => uc("title", v))}
              {F("Подзаголовок", c.subtitle, v => uc("subtitle", v))}
            </>}
            {contentTab === "items" && <>
              {Items("members", "Участники команды", { name: "Имя", role: "Должность", bio: "О сотруднике", avatar: "", linkedin: "" },
                [["name", "Имя"], ["role", "Должность"], ["bio", "О сотруднике", "textarea"], ["avatar", "Фото (URL)", "image"], ["linkedin", "LinkedIn URL"]]
              )}
            </>}
          </>}

          {/* PRICING */}
          {block.type === "PRICING" && <>
            {contentTab === "header" && <>
              {F("Заголовок", c.title, v => uc("title", v))}
              {F("Подзаголовок", c.subtitle, v => uc("subtitle", v))}
            </>}
            {contentTab === "items" && <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-muted-foreground font-medium">Тарифные планы</label>
                  <button onClick={() => uc("plans", [...(c.plans||[]), { name: "Новый", price: "0₽", period: "мес", cta: "Выбрать", features: ["Функция 1"], highlighted: false }])}
                    className="text-xs text-primary px-2 py-0.5 rounded border border-primary/30 hover:bg-primary/10 transition">+ Добавить</button>
                </div>
                {(c.plans || []).map((plan: any, idx: number) => (
                  <div key={idx} className="bg-secondary/40 border border-border rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-2.5 py-1.5 bg-secondary/60 border-b border-border">
                      <span className="text-[11px] font-semibold text-foreground">{plan.name || `Тариф ${idx+1}`}</span>
                      <button onClick={() => { const p=[...(c.plans||[])]; p.splice(idx,1); uc("plans",p); }} className="text-red-400 text-xs hover:text-red-300">✕</button>
                    </div>
                    <div className="p-2.5 space-y-2">
                      {[["name","Название"],["price","Цена (1990₽)"],["period","Период (мес)"],["cta","Кнопка"]].map(([fk,fl])=>(
                        <div key={fk}>
                          <label className="text-[10px] text-muted-foreground block mb-0.5">{fl}</label>
                          <input value={plan[fk]||""} onChange={e=>{const p=[...(c.plans||[])];p[idx]={...p[idx],[fk]:e.target.value};uc("plans",p);}}
                            className="w-full bg-secondary border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary"/>
                        </div>
                      ))}
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-0.5">Функции (каждая с новой строки)</label>
                        <textarea value={(plan.features||[]).join("\n")} onChange={e=>{const p=[...(c.plans||[])];p[idx]={...p[idx],features:e.target.value.split("\n")};uc("plans",p);}} rows={3}
                          className="w-full bg-secondary border border-border rounded-lg px-2 py-1 text-xs text-foreground resize-none focus:outline-none focus:border-primary"/>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={!!plan.highlighted} onChange={e=>{const p=[...(c.plans||[])];p[idx]={...p[idx],highlighted:e.target.checked};uc("plans",p);}} className="rounded"/>
                        <span className="text-xs text-muted-foreground">Выделить (рекомендуемый)</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </>}
          </>}

          {/* PRODUCTS */}
          {block.type === "PRODUCTS" && <>
            {contentTab === "header" && <>
              {F("Заголовок", c.title, v => uc("title", v))}
              {F("Подзаголовок", c.subtitle, v => uc("subtitle", v))}
            </>}
            {contentTab === "items" && <>
              {Items("items", "Товары", { name: "Новый товар", price: "0", image: "", badge: "", description: "" },
                [["name","Название"],["price","Цена (число)"],["description","Описание","textarea"],["image","Изображение","image"],["badge","Бейдж (Хит, Новинка)"]]
              )}
              <div>
                <label className="text-[11px] text-muted-foreground font-medium block mb-2">Символ валюты</label>
                <div className="flex gap-1">
                  {["₽","$","€","£","₸","₴"].map(cur => (
                    <button key={cur} onClick={() => autoSaveStyles({ ...sRef.current, currency: cur })}
                      className={`flex-1 text-xs py-1.5 rounded-lg border transition font-mono ${(s.currency||"₽")===cur?"border-primary bg-primary/15 text-primary":"border-border text-muted-foreground"}`}>{cur}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground font-medium block mb-2">Колонок в сетке</label>
                <div className="flex gap-1">
                  {[2,3,4].map(n => (
                    <button key={n} onClick={() => autoSaveStyles({ ...sRef.current, columns: n })}
                      className={`flex-1 text-xs py-1.5 rounded-lg border transition font-mono ${(s.columns||3)===n?"border-primary bg-primary/15 text-primary":"border-border text-muted-foreground"}`}>{n}</button>
                  ))}
                </div>
              </div>
            </>}
          </>}

          {/* GALLERY */}
          {block.type === "GALLERY" && <>
            {contentTab === "header" && <>
              {F("Заголовок", c.title, v => uc("title", v))}
              {F("Подзаголовок", c.subtitle, v => uc("subtitle", v))}
            </>}
            {contentTab === "items" && <>
              {Items("galleryItems", "Изображения", { url: "", caption: "" },
                [["url", "Изображение", "image"], ["caption", "Подпись (необязательно)"]]
              )}
              <div>
                <label className="text-[11px] text-muted-foreground font-medium block mb-1">Или вставьте URL (каждый с новой строки)</label>
                <textarea value={(c.images || []).join("\n")} onChange={e => uc("images", e.target.value.split("\n").filter(Boolean))} rows={3}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground resize-none focus:outline-none focus:border-primary"
                  placeholder="https://example.com/photo1.jpg" />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground font-medium block mb-1">Колонок в сетке</label>
                <div className="flex gap-1">
                  {[2,3,4,5].map(n => (
                    <button key={n} onClick={() => autoSaveContent({ ...cRef.current, columns: n })}
                      className={`flex-1 text-xs py-1.5 rounded-lg border transition font-mono ${(c.columns||3)===n?"border-primary bg-primary/15 text-primary":"border-border text-muted-foreground"}`}>{n}</button>
                  ))}
                </div>
              </div>
            </>}
          </>}

          {/* VIDEO */}
          {block.type === "VIDEO" && <>
            {F("Заголовок", c.title, v => uc("title", v))}
            {F("YouTube / Vimeo Embed URL", c.url, v => uc("url", v))}
            {F("Описание под видео", c.description, v => uc("description", v), "textarea")}
          </>}

          {/* MUSIC_PLAYER */}
          {block.type === "MUSIC_PLAYER" && <>
            {F("Название трека", c.title, v => uc("title", v))}
            {F("Исполнитель", c.artist, v => uc("artist", v))}
            {F("Альбом", c.album, v => uc("album", v))}
            {IF("Обложка", c.coverUrl, v => uc("coverUrl", v), "coverUrl")}
            {F("Spotify URL", c.spotifyUrl, v => uc("spotifyUrl", v))}
            {F("YouTube URL", c.youtubeUrl, v => uc("youtubeUrl", v))}
            {F("Apple Music URL", c.appleUrl, v => uc("appleUrl", v))}
          </>}

          {/* DISCOGRAPHY */}
          {block.type === "DISCOGRAPHY" && <>
            {contentTab === "header" && <>
              {F("Заголовок", c.title, v => uc("title", v))}
            </>}
            {contentTab === "items" && <>
              {Items("albums", "Альбомы", { title: "Новый альбом", year: "2025", cover: "", tracks: "10", spotifyUrl: "" },
                [["title","Название альбома"],["year","Год"],["tracks","Кол-во треков"],["cover","Обложка","image"],["spotifyUrl","Spotify URL"]]
              )}
            </>}
          </>}

          {/* SCHEDULE */}
          {block.type === "SCHEDULE" && <>
            {contentTab === "header" && <>
              {F("Заголовок", c.title, v => uc("title", v))}
              {F("Подзаголовок", c.subtitle, v => uc("subtitle", v))}
            </>}
            {contentTab === "items" && <>
              {Items("items", "Занятия", { day: "Пн, Ср, Пт", time: "10:00–12:00", type: "Занятие", trainer: "Тренер", ctaUrl: "#" },
                [["type","Тип занятия"],["day","Дни"],["time","Время"],["trainer","Тренер"],["ctaUrl","Ссылка для записи"]]
              )}
            </>}
          </>}

          {/* COACHES */}
          {block.type === "COACHES" && <>
            {contentTab === "header" && <>
              {F("Заголовок", c.title, v => uc("title", v))}
              {F("Подзаголовок", c.subtitle, v => uc("subtitle", v))}
            </>}
            {contentTab === "items" && <>
              {Items("members", "Тренеры", { name: "Тренер", role: "Специализация", bio: "О тренере", avatar: "", instagram: "" },
                [["name","Имя"],["role","Специализация"],["bio","Краткое bio","textarea"],["avatar","Фото","image"],["instagram","Instagram"]]
              )}
            </>}
          </>}

          {/* CONTACTS */}
          {block.type === "CONTACTS" && <>
            {contentTab === "contacts" && <>
              {F("Заголовок", c.title, v => uc("title", v))}
              {F("Подзаголовок", c.subtitle, v => uc("subtitle", v), "textarea")}
              {F("Email", c.email, v => uc("email", v))}
              {F("Телефон", c.phone, v => uc("phone", v))}
              {F("Адрес", c.address, v => uc("address", v))}
            </>}
            {contentTab === "social" && <>
              {F("Telegram", c.telegram, v => uc("telegram", v))}
              {F("WhatsApp", c.whatsapp, v => uc("whatsapp", v))}
              {F("Instagram", c.instagram, v => uc("instagram", v))}
              {F("VK", c.vk, v => uc("vk", v))}
              {F("YouTube", c.youtube, v => uc("youtube", v))}
            </>}
          </>}

          {/* FORM */}
          {block.type === "FORM" && <>
            {F("Заголовок формы", c.title, v => uc("title", v))}
            {F("Подзаголовок", c.subtitle, v => uc("subtitle", v))}
            {Items("fields", "Поля формы", { label: "Поле", type: "text", placeholder: "Введите...", required: false },
              [["label","Название поля"],["placeholder","Placeholder"],["type","Тип (text, email, tel, textarea)"]]
            )}
            {F("Текст кнопки", c.ctaLabel, v => uc("ctaLabel", v))}
            {F("Сообщение при успехе", c.successText, v => uc("successText", v))}
          </>}

          {/* BLOG */}
          {block.type === "BLOG" && <>
            {contentTab === "header" && <>
              {F("Заголовок", c.title, v => uc("title", v))}
              {F("Подзаголовок", c.subtitle, v => uc("subtitle", v))}
            </>}
            {contentTab === "items" && <>
              {Items("items", "Статьи", { title: "Заголовок статьи", date: "01.01.2025", tag: "Категория", preview: "Описание...", image: "", url: "#", ctaLabel: "Читать →" },
                [["title","Заголовок"],["date","Дата"],["tag","Тег/категория"],["preview","Краткое описание","textarea"],["image","Фото","image"],["url","Ссылка на статью"],["ctaLabel","Текст кнопки (Читать →)"]]
              )}
            </>}
          </>}

          {/* MAP */}
          {block.type === "MAP" && <>
            {F("Заголовок", c.title, v => uc("title", v))}
            {F("Embed URL карты", c.embedUrl, v => uc("embedUrl", v))}
            <div>
              <label className="text-[11px] text-muted-foreground font-medium block mb-1">Высота карты</label>
              <div className="flex gap-1">
                {["200px","300px","400px","500px"].map(h => (
                  <button key={h} onClick={() => uc("height", h)}
                    className={`flex-1 text-xs py-1.5 rounded-lg border transition ${(c.height||"300px")===h ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"}`}>{h}</button>
                ))}
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">Откройте Google Maps → Поделиться → Встроить карту → скопируйте URL из src=""</p>
          </>}

          {/* POPUP */}
          {block.type === "POPUP" && <>
            {contentTab === "content" && <>
              <div>
                <label className="text-[11px] text-muted-foreground font-medium block mb-1">Заголовок попапа</label>
                <input value={c.title || ""} onChange={e => uc("title", e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                  placeholder="Свяжитесь с нами" />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground font-medium block mb-1.5">Тело попапа (форматированный текст)</label>
                <RichTextEditor value={c.body || ""} onChange={v => uc("body", v)} />
              </div>
              {IF("Изображение", c.image, v => uc("image", v), "popupImage")}
              <div>
                <label className="text-[11px] text-muted-foreground font-medium block mb-1">Позиция изображения</label>
                <div className="grid grid-cols-2 gap-1">
                  {[["top","Сверху"],["left","Слева"],["right","Справа"],["background","Фон"]].map(([v,l]) => (
                    <button key={v} onClick={() => uc("imagePosition", v)}
                      className={`text-[10px] py-1.5 rounded-lg border transition ${(c.imagePosition||"top")===v?"border-primary bg-primary/15 text-primary":"border-border text-muted-foreground hover:border-primary/40"}`}>{l}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground font-medium block mb-1">Максимальная ширина попапа</label>
                <div className="grid grid-cols-4 gap-1">
                  {[["400","400px"],["500","500px"],["640","640px"],["800","800px"]].map(([v,l]) => (
                    <button key={v} onClick={() => us("maxWidth", v)}
                      className={`text-[10px] py-1.5 rounded-lg border transition ${(s.maxWidth||"500")===v?"border-primary bg-primary/15 text-primary":"border-border text-muted-foreground hover:border-primary/40"}`}>{l}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground font-medium block mb-1">Анимация появления</label>
                <div className="grid grid-cols-3 gap-1">
                  {[["fade","Плавно"],["slide-up","Снизу"],["scale","Масштаб"],["slide-left","Слева"],["slide-right","Справа"],["none","Без"]].map(([v,l]) => (
                    <button key={v} onClick={() => us("animation", v)}
                      className={`text-[10px] py-1.5 rounded-lg border transition ${(s.animation||"fade")===v?"border-primary bg-primary/15 text-primary":"border-border text-muted-foreground hover:border-primary/40"}`}>{l}</button>
                  ))}
                </div>
              </div>
            </>}

            {contentTab === "form" && <>
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input type="checkbox" checked={!!c.showForm} onChange={e => uc("showForm", e.target.checked)} className="rounded" />
                <span className="text-xs text-foreground font-medium">Показывать форму в попапе</span>
              </label>
              {c.showForm && <>
                {F("Заголовок формы", c.formTitle, v => uc("formTitle", v))}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] text-muted-foreground font-medium">Поля формы</label>
                    <button onClick={() => uc("formFields", [...(c.formFields||[]), { label: "Новое поле", type: "text", placeholder: "", required: false, options: "" }])}
                      className="text-xs text-primary px-2 py-0.5 rounded border border-primary/30 hover:bg-primary/10 transition">+ Добавить</button>
                  </div>
                  {(c.formFields || []).map((f: any, idx: number) => (
                    <div key={idx} className="bg-secondary/40 border border-border rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-2.5 py-1.5 bg-secondary/60 border-b border-border">
                        <span className="text-[11px] font-semibold text-foreground">{f.label || `Поле ${idx+1}`}</span>
                        <button onClick={() => { const ff=[...(c.formFields||[])]; ff.splice(idx,1); uc("formFields",ff); }} className="text-red-400 text-xs hover:text-red-300 leading-none">✕</button>
                      </div>
                      <div className="p-2.5 space-y-2">
                        <div>
                          <label className="text-[10px] text-muted-foreground block mb-0.5">Название поля</label>
                          <input value={f.label||""} onChange={e=>{const ff=[...(c.formFields||[])];ff[idx]={...ff[idx],label:e.target.value};uc("formFields",ff);}}
                            className="w-full bg-secondary border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary"/>
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground block mb-0.5">Тип поля</label>
                          <select value={f.type||"text"} onChange={e=>{const ff=[...(c.formFields||[])];ff[idx]={...ff[idx],type:e.target.value};uc("formFields",ff);}}
                            className="w-full bg-secondary border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary">
                            <option value="text">Текст</option>
                            <option value="email">Email</option>
                            <option value="tel">Телефон</option>
                            <option value="number">Число</option>
                            <option value="textarea">Многострочный</option>
                            <option value="select">Выпадающий список</option>
                            <option value="checkbox">Чекбокс</option>
                            <option value="radio">Радиокнопки</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground block mb-0.5">Placeholder</label>
                          <input value={f.placeholder||""} onChange={e=>{const ff=[...(c.formFields||[])];ff[idx]={...ff[idx],placeholder:e.target.value};uc("formFields",ff);}}
                            className="w-full bg-secondary border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary"/>
                        </div>
                        {(f.type === "select" || f.type === "radio" || f.type === "checkbox") && (
                          <div>
                            <label className="text-[10px] text-muted-foreground block mb-0.5">Варианты (через запятую)</label>
                            <input value={f.options||""} onChange={e=>{const ff=[...(c.formFields||[])];ff[idx]={...ff[idx],options:e.target.value};uc("formFields",ff);}}
                              className="w-full bg-secondary border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary"
                              placeholder="Вариант 1, Вариант 2"/>
                          </div>
                        )}
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={!!f.required} onChange={e=>{const ff=[...(c.formFields||[])];ff[idx]={...ff[idx],required:e.target.checked};uc("formFields",ff);}} className="rounded"/>
                          <span className="text-xs text-muted-foreground">Обязательное поле</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                {F("Текст кнопки «Отправить»", c.submitLabel, v => uc("submitLabel", v))}
                {F("Сообщение при успехе", c.successText, v => uc("successText", v))}
                {F("Email получателя (для справки)", c.recipientEmail, v => uc("recipientEmail", v))}
                <div className="bg-secondary/40 rounded-xl p-3 text-[11px] text-muted-foreground border border-border">
                  <strong className="text-foreground/70">Данные сохраняются</strong> в базу данных и доступны в разделе «Заявки» (аналогично другим формам на сайте)
                </div>
              </>}
            </>}

            {contentTab === "trigger" && <>
              <div>
                <label className="text-[11px] text-muted-foreground font-medium block mb-1">ID попапа (для ссылки)</label>
                <input value={c.popupId || block.id.slice(0, 8)} onChange={e => uc("popupId", e.target.value.replace(/\s+/g, "-").toLowerCase())}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:border-primary"
                  placeholder="contact-popup" />
                <p className="text-[10px] text-muted-foreground mt-1">Используйте этот ID при настройке кнопок других блоков для открытия попапа</p>
              </div>
              <div className="bg-primary/5 border border-primary/15 rounded-xl p-3 text-[11px] text-muted-foreground space-y-1">
                <div className="text-foreground/70 font-semibold mb-1">Как привязать кнопку к попапу:</div>
                <div>1. Запомните ID попапа: <code className="text-primary font-mono bg-primary/10 px-1 rounded">{c.popupId || block.id.slice(0, 8)}</code></div>
                <div>2. Выберите блок с кнопкой (HERO, CTA и др.)</div>
                <div>3. В настройках кнопки выберите «Открыть попап» и укажите этот ID</div>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground font-medium block mb-1">Закрытие попапа</label>
                <div className="space-y-1.5">
                  {[
                    ["closeOnBackdrop","По клику на фон (рекомендуется)"],
                    ["closeOnEscape","По клавише Escape"],
                    ["showCloseButton","Показывать кнопку ✕"],
                  ].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={s[key] !== false} onChange={e => us(key, e.target.checked)} className="rounded"/>
                      <span className="text-xs text-muted-foreground">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground font-medium block mb-1">Автозакрытие через (сек, 0 = выкл)</label>
                <input type="number" min="0" max="60" value={s.autoCloseAfter ?? 0} onChange={e => us("autoCloseAfter", parseInt(e.target.value)||0)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"/>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground font-medium block mb-1">Фон оверлея</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value="#000000" onChange={() => {}} className="w-8 h-8 rounded cursor-pointer border border-border flex-shrink-0" />
                  <input type="text" value={s.backdropColor || "rgba(0,0,0,0.7)"} onChange={e => us("backdropColor", e.target.value)}
                    className="flex-1 bg-secondary border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer mt-1.5">
                  <input type="checkbox" checked={s.backdropBlur !== false} onChange={e => us("backdropBlur", e.target.checked)} className="rounded"/>
                  <span className="text-xs text-muted-foreground">Размытие фона (backdrop-blur)</span>
                </label>
              </div>
            </>}
          </>}

          {/* ZERO BLOCK */}
          {block.type === "ZERO_BLOCK" && (() => {
            const zd = parseZeroData(c);
            return (
              <>
                <div className="bg-primary/8 border border-primary/20 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary">✦</div>
                    <div>
                      <div className="text-sm font-bold text-foreground">Zero Block</div>
                      <div className="text-[11px] text-muted-foreground">{zd.elements.length} эл. · {zd.canvasHeight}px высота</div>
                    </div>
                  </div>
                  <button onClick={() => onOpenZeroBlock?.(block.id)}
                    className="w-full py-2.5 bg-primary rounded-xl text-white text-sm font-bold hover:bg-primary/80 transition flex items-center justify-center gap-2">
                    ✏ Открыть редактор Zero Block
                  </button>
                </div>
                <div className="text-[11px] text-muted-foreground leading-relaxed px-1">
                  В редакторе можно добавлять текст, изображения, кнопки, фигуры, HTML и видео. Поддерживается свободное позиционирование, слои и адаптивность.
                </div>
              </>
            );
          })()}

            </div>
          </div>
        )}

        {/* ═══ UNIFIED STYLES SYSTEM — flyout popups ═══ */}
        {(() => {
          const HAS_CTA = ["HERO","CTA","HEADER_MENU","FORM","PRODUCTS","PRICING","SCHEDULE","COACHES"].includes(block.type);
          const HAS_GRID = ["FEATURES","PRODUCTS","GALLERY","TEAM","TESTIMONIALS","BLOG"].includes(block.type);
          const STYLE_TABS = [
            { id: "content",    icon: "≡",  label: "Контент блока", group: "content" },
            { id: "general",    icon: "⊞", label: "Основные",       group: "style" },
            { id: "typography", icon: "T",  label: "Типографика",    group: "style" },
            { id: "background", icon: "◧", label: "Фон",            group: "style" },
            ...(HAS_CTA ? [{ id: "buttons", icon: "⬡", label: "Кнопки", group: "style" }] : []),
            { id: "animation",  icon: "✦", label: "Анимации",       group: "style" },
            { id: "spacing",    icon: "↕", label: "Отступы",        group: "style" },
          ];
          const activeTab = STYLE_TABS.find(t => t.id === stylesTab) ?? null;
          const contentTabs = STYLE_TABS.filter(t => t.group === "content");
          const styleTabs   = STYLE_TABS.filter(t => t.group === "style");
          return (
            <div className="border-t border-border pt-2 space-y-1">
              <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-semibold px-1 mb-1">Настройки</p>
              <div className="space-y-0.5">
                {contentTabs.map(tab => (
                  <button key={tab.id}
                    onClick={() => setStylesTab(prev => prev === tab.id ? null : tab.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition text-left group ${stylesTab === tab.id ? "bg-primary/15 text-primary border border-primary/25" : "text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent"}`}>
                    <span className="text-sm w-5 text-center leading-none">{tab.icon}</span>
                    <span className="flex-1">{tab.label}</span>
                    <span className={`text-[10px] transition-transform duration-200 ${stylesTab === tab.id ? "text-primary rotate-90" : "text-muted-foreground/40 group-hover:text-muted-foreground"}`}>▶</span>
                  </button>
                ))}
                <div className="border-t border-border/50 my-1" />
                {styleTabs.map(tab => (
                  <button key={tab.id}
                    onClick={() => setStylesTab(prev => prev === tab.id ? null : tab.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition text-left group ${stylesTab === tab.id ? "bg-primary/15 text-primary border border-primary/25" : "text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent"}`}>
                    <span className="text-sm w-5 text-center leading-none">{tab.icon}</span>
                    <span className="flex-1">{tab.label}</span>
                    <span className={`text-[10px] transition-transform duration-200 ${stylesTab === tab.id ? "text-primary rotate-90" : "text-muted-foreground/40 group-hover:text-muted-foreground"}`}>▶</span>
                  </button>
                ))}
              </div>

              {/* ── Flyout popup panel (styles only — content popup rendered above) ── */}
              {activeTab && stylesTab !== "content" && (
                <>
                  {/* Invisible backdrop to close on outside click */}
                  <div className="fixed inset-0 z-[48]" onClick={() => setStylesTab(null)} />
                  {/* Popup */}
                  <div className="fixed z-[49] w-72 max-h-[calc(100vh-56px)] flex flex-col bg-card border border-border/80 rounded-xl shadow-2xl shadow-black/70"
                    style={{ backdropFilter: "blur(12px)", left: stylesDrag.pos.x, top: stylesDrag.pos.y }}>
                    {/* Popup header */}
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 flex-shrink-0 bg-secondary/40 rounded-t-xl cursor-grab active:cursor-grabbing select-none"
                      onMouseDown={stylesDrag.onHeaderMouseDown}>
                      <div className="flex items-center gap-2">
                        <span className="text-base leading-none">{activeTab.icon}</span>
                        <span className="text-sm font-bold text-foreground">{activeTab.label}</span>
                        <span className="text-[10px] text-muted-foreground/30 ml-0.5">⠿</span>
                      </div>
                      <button onClick={() => setStylesTab(null)}
                        className="w-6 h-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition text-xl leading-none">
                        ×
                      </button>
                    </div>
                    {/* Popup scrollable content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">

                      {/* ── Panel: Основные ── */}
                      {stylesTab === "general" && <>
                        <div>
                          <label className="text-[11px] text-muted-foreground font-medium block mb-1.5">Мин. высота блока</label>
                          <div className="grid grid-cols-5 gap-1">
                            {["auto","200px","400px","600px","100vh"].map(h => (
                              <button key={h} onClick={() => us("minHeight", h === "auto" ? undefined : h)}
                                className={`text-[10px] py-1.5 rounded-lg border transition ${(!s.minHeight && h === "auto") || s.minHeight === h ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                                {h}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-foreground font-medium block mb-1.5">Скругление блока <span className="text-primary">{s.borderRadius ?? 0}px</span></label>
                          <input type="range" min={0} max={32} value={s.borderRadius ?? 0} onChange={e => us("borderRadius", parseInt(e.target.value))} className="w-full accent-primary" />
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-foreground font-medium block mb-1.5">Прозрачность блока <span className="text-primary">{s.opacity ?? 100}%</span></label>
                          <input type="range" min={20} max={100} value={s.opacity ?? 100} onChange={e => us("opacity", parseInt(e.target.value))} className="w-full accent-primary" />
                        </div>
                        {HAS_GRID && (
                          <div>
                            <label className="text-[11px] text-muted-foreground font-medium block mb-1.5">Колонок в сетке</label>
                            <div className="flex gap-1">
                              {[2,3,4].map(n => (
                                <button key={n} onClick={() => us("columns", n)}
                                  className={`flex-1 text-xs py-1.5 rounded-lg border transition font-mono ${s.columns===n?"border-primary bg-primary/15 text-primary":"border-border text-muted-foreground hover:border-primary/40"}`}>{n}</button>
                              ))}
                            </div>
                          </div>
                        )}
                        {HAS_GRID && (
                          <div>
                            <label className="text-[11px] text-muted-foreground font-medium block mb-1.5">Фон карточек</label>
                            <div className="flex gap-2 items-center">
                              <input type="color" value={s.cardBg || "#1f1f3a"} onChange={e => us("cardBg", e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-border flex-shrink-0" />
                              <input type="text" value={s.cardBg || ""} onChange={e => us("cardBg", e.target.value || undefined)} placeholder="rgba(255,255,255,0.05)"
                                className="flex-1 bg-secondary border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none" />
                              {s.cardBg && <button onClick={() => us("cardBg", undefined)} className="text-xs text-muted-foreground hover:text-red-400 transition">✕</button>}
                            </div>
                          </div>
                        )}
                      </>}

                      {/* ── Panel: Типографика ── */}
                      {stylesTab === "typography" && <>
                        <div>
                          <label className="text-[11px] text-muted-foreground font-medium block mb-1.5">Семейство шрифтов</label>
                          <div className="grid grid-cols-2 gap-1">
                            {[
                              { v: "", label: "По умолчанию" },
                              { v: "'Inter', sans-serif", label: "Inter" },
                              { v: "'Montserrat', sans-serif", label: "Montserrat" },
                              { v: "'Playfair Display', serif", label: "Playfair" },
                              { v: "'Georgia', serif", label: "Georgia" },
                              { v: "'Roboto Mono', monospace", label: "Roboto Mono" },
                            ].map(ff => (
                              <button key={ff.v} onClick={() => us("fontFamily", ff.v || undefined)}
                                className={`text-[10px] py-1.5 rounded-lg border transition ${(s.fontFamily || "") === ff.v ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
                                style={ff.v ? { fontFamily: ff.v } : {}}>
                                {ff.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        {CF("Цвет текста", s.textColor, v => us("textColor", v))}
                        <div>
                          <label className="text-[11px] text-muted-foreground font-medium block mb-1.5">Выравнивание текста</label>
                          <div className="flex gap-1">
                            {[["left","← Лево"],["center","↔ Центр"],["right","→ Право"]].map(([a,icon]) => (
                              <button key={a} onClick={() => us("align", a)}
                                className={`flex-1 text-[10px] py-1.5 rounded-lg border transition ${s.align === a ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                                {icon}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-foreground font-medium block mb-1.5">Размер заголовка</label>
                          <div className="grid grid-cols-3 gap-1">
                            {[["sm","Малый"],["md","Средний"],["lg","Крупный"],["xl","Большой"],["2xl","Огромный"],["3xl","Гигант"]].map(([v,lbl]) => (
                              <button key={v} onClick={() => us("titleSize", v)}
                                className={`text-[10px] py-1.5 rounded-lg border transition ${(s.titleSize||"xl")===v?"border-primary bg-primary/15 text-primary":"border-border text-muted-foreground hover:border-primary/40"}`}>
                                {lbl}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-foreground font-medium block mb-1.5">Жирность шрифта</label>
                          <div className="grid grid-cols-5 gap-1">
                            {[["400","Thin"],["500","Mid"],["600","Semi"],["700","Bold"],["800","Xtra"]].map(([v,lbl]) => (
                              <button key={v} onClick={() => us("fontWeight", v)}
                                className={`text-[10px] py-1.5 rounded-lg border transition ${(s.fontWeight||"700")===v?"border-primary bg-primary/15 text-primary":"border-border text-muted-foreground hover:border-primary/40"}`}>
                                {lbl}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-foreground font-medium block mb-1.5">Межстрочный интервал</label>
                          <div className="grid grid-cols-5 gap-1">
                            {[["1.1","Tight"],["1.3","Snug"],["1.5","Norm"],["1.7","Loose"],["2","Wide"]].map(([v,lbl]) => (
                              <button key={v} onClick={() => us("lineHeight", v)}
                                className={`text-[10px] py-1.5 rounded-lg border transition ${(s.lineHeight||"1.3")===v?"border-primary bg-primary/15 text-primary":"border-border text-muted-foreground hover:border-primary/40"}`}>
                                {lbl}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-foreground font-medium block mb-1.5">Межбуквенный интервал <span className="text-primary">{s.letterSpacing ?? 0}px</span></label>
                          <input type="range" min={-2} max={8} step={0.5} value={s.letterSpacing ?? 0} onChange={e => us("letterSpacing", parseFloat(e.target.value))} className="w-full accent-primary" />
                        </div>
                      </>}

                      {/* ── Panel: Фон ── */}
                      {stylesTab === "background" && <>
                        {CF("Цвет фона", s.bg, v => us("bg", v))}
                        <div>
                          <label className="text-[11px] text-muted-foreground font-medium block mb-2">Пресеты градиентов</label>
                          <div className="grid grid-cols-5 gap-1.5">
                            {[
                              { label: "Фиолет", val: "linear-gradient(135deg,#7C3AED,#4F46E5)" },
                              { label: "Пинк",   val: "linear-gradient(135deg,#EC4899,#7C3AED)" },
                              { label: "Кибер",  val: "linear-gradient(135deg,#06b6d4,#6366f1)" },
                              { label: "Закат",  val: "linear-gradient(135deg,#f97316,#ec4899)" },
                              { label: "Лес",    val: "linear-gradient(135deg,#10b981,#3b82f6)" },
                              { label: "Ночь",   val: "linear-gradient(135deg,#0f0f23,#1a1a3e)" },
                              { label: "Уголь",  val: "linear-gradient(135deg,#1e1e2e,#0a0a14)" },
                              { label: "Белый",  val: "linear-gradient(135deg,#f8fafc,#e2e8f0)" },
                              { label: "Бежев",  val: "linear-gradient(135deg,#fefce8,#fef3c7)" },
                              { label: "Чёрн",   val: "#000000" },
                            ].map(g => (
                              <button key={g.val} onClick={() => us("bg", g.val)} title={g.label}
                                className={`h-8 rounded-lg border-2 transition ${s.bg === g.val ? "border-primary scale-95" : "border-transparent hover:border-white/30"}`}
                                style={{ background: g.val }} />
                            ))}
                          </div>
                        </div>
                        {IF("Фоновое изображение", s.bgImage, v => us("bgImage", v), "bgImage")}
                        {s.bgImage && (
                          <div>
                            <label className="text-[11px] text-muted-foreground font-medium block mb-1.5">Затемнение <span className="text-primary">{s.bgOverlay ?? 50}%</span></label>
                            <input type="range" min={0} max={100} value={s.bgOverlay ?? 50} onChange={e => us("bgOverlay", parseInt(e.target.value))} className="w-full accent-primary" />
                          </div>
                        )}
                      </>}

                      {/* ── Panel: Кнопки ── */}
                      {stylesTab === "buttons" && HAS_CTA && <>
                        {CF("Цвет кнопки (фон)", s.ctaColor, v => us("ctaColor", v))}
                        {CF("Цвет текста кнопки", s.ctaTextColor, v => us("ctaTextColor", v))}
                        <div>
                          <label className="text-[11px] text-muted-foreground font-medium block mb-1.5">Скругление кнопки</label>
                          <div className="grid grid-cols-4 gap-1">
                            {[["0","Квадрат"],["8","Мало"],["14","Средне"],["99","Таблетка"]].map(([v,lbl]) => (
                              <button key={v} onClick={() => us("ctaBorderRadius", parseInt(v))}
                                className={`text-[10px] py-1.5 rounded-lg border transition ${(s.ctaBorderRadius ?? 99)===parseInt(v)?"border-primary bg-primary/15 text-primary":"border-border text-muted-foreground hover:border-primary/40"}`}>
                                {lbl}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-foreground font-medium block mb-1.5">Стиль кнопки</label>
                          <div className="flex gap-1">
                            {[["filled","Заливка"],["outline","Контур"],["ghost","Призрак"]].map(([v,lbl]) => (
                              <button key={v} onClick={() => us("ctaVariant", v)}
                                className={`flex-1 text-[10px] py-1.5 rounded-lg border transition ${(s.ctaVariant||"filled")===v?"border-primary bg-primary/15 text-primary":"border-border text-muted-foreground hover:border-primary/40"}`}>
                                {lbl}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-foreground font-medium block mb-1.5">Тень кнопки</label>
                          <div className="flex gap-1">
                            {[["none","Нет"],["sm","Лёгкая"],["lg","Средняя"],["glow","Свечение"]].map(([v,lbl]) => (
                              <button key={v} onClick={() => us("ctaShadow", v)}
                                className={`flex-1 text-[10px] py-1.5 rounded-lg border transition ${(s.ctaShadow||"none")===v?"border-primary bg-primary/15 text-primary":"border-border text-muted-foreground hover:border-primary/40"}`}>
                                {lbl}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>}

                      {/* ── Panel: Анимации ── */}
                      {stylesTab === "animation" && <>
                        {/* Block-level animation */}
                        <div className="border border-border/50 rounded-lg overflow-hidden">
                          <div className="px-3 py-2 bg-secondary/40 flex items-center gap-2">
                            <span className="text-[11px] font-bold text-foreground">Весь блок</span>
                            <span className="text-[10px] text-muted-foreground">— при скролле</span>
                          </div>
                          <div className="p-3 space-y-2">
                            <div className="grid grid-cols-3 gap-1">
                              {ELEM_ANIM_OPTS.map(a => (
                                <button key={a.v} onClick={() => us("animation", a.v || undefined)}
                                  className={`text-[10px] py-1.5 rounded-lg border transition ${(s.animation||"") === a.v ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                                  {a.label}
                                </button>
                              ))}
                            </div>
                            {s.animation && <>
                              <div className="grid grid-cols-4 gap-1">
                                {[["0","0с"],["0.15","0.15с"],["0.3","0.3с"],["0.5","0.5с"]].map(([v,lbl]) => (
                                  <button key={v} onClick={() => us("animDelay", parseFloat(v))}
                                    className={`text-[10px] py-1 rounded-md border transition ${(s.animDelay??0)===parseFloat(v)?"border-primary bg-primary/15 text-primary":"border-border text-muted-foreground hover:border-primary/40"}`}>
                                    {lbl}
                                  </button>
                                ))}
                              </div>
                              <div className="grid grid-cols-4 gap-1">
                                {[["0.3","Быстро"],["0.5","Норма"],["0.8","Медл."],["1.2","Плавно"]].map(([v,lbl]) => (
                                  <button key={v} onClick={() => us("animDuration", parseFloat(v))}
                                    className={`text-[10px] py-1 rounded-md border transition ${(s.animDuration??0.5)===parseFloat(v)?"border-primary bg-primary/15 text-primary":"border-border text-muted-foreground hover:border-primary/40"}`}>
                                    {lbl}
                                  </button>
                                ))}
                              </div>
                            </>}
                          </div>
                        </div>

                        {/* Per-element animations */}
                        {(BLOCK_ANIM_ELEMS[block.type] || []).length > 0 && <>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-px bg-border/40" />
                            <span className="text-[10px] text-muted-foreground font-medium px-1">По элементам</span>
                            <div className="flex-1 h-px bg-border/40" />
                          </div>
                          {(BLOCK_ANIM_ELEMS[block.type] || []).map(elem => {
                            const ea = (s.elemAnims || {})[elem.id] || {};
                            return (
                              <div key={elem.id} className="border border-border/40 rounded-lg overflow-hidden">
                                <div className="px-3 py-1.5 bg-secondary/20 flex items-center justify-between">
                                  <span className="text-[11px] font-semibold text-foreground">{elem.label}</span>
                                  {ea.animation && (
                                    <button onClick={() => ue(elem.id, "animation", "")} className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground leading-none">✕</button>
                                  )}
                                </div>
                                <div className="p-2.5 space-y-1.5">
                                  <div className="grid grid-cols-3 gap-1">
                                    {ELEM_ANIM_OPTS.map(a => (
                                      <button key={a.v} onClick={() => ue(elem.id, "animation", a.v || "")}
                                        className={`text-[10px] py-1 rounded-md border transition ${(ea.animation||"")===a.v?"border-primary bg-primary/15 text-primary":"border-border/60 text-muted-foreground hover:border-primary/30"}`}>
                                        {a.label}
                                      </button>
                                    ))}
                                  </div>
                                  {ea.animation && (
                                    <div className="grid grid-cols-4 gap-1">
                                      {[["0","0с"],["0.2","0.2с"],["0.4","0.4с"],["0.6","0.6с"]].map(([v,lbl]) => (
                                        <button key={v} onClick={() => ue(elem.id, "delay", parseFloat(v))}
                                          className={`text-[10px] py-1 rounded-md border transition ${(ea.delay??0)===parseFloat(v)?"border-primary bg-primary/15 text-primary":"border-border/60 text-muted-foreground hover:border-primary/30"}`}>
                                          {lbl}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </>}
                      </>}

                      {/* ── Panel: Отступы ── */}
                      {stylesTab === "spacing" && <>
                        <div>
                          <label className="text-[11px] text-muted-foreground font-medium block mb-2">Внутренние отступы (padding)</label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              ["paddingTop","Сверху"],["paddingBottom","Снизу"],
                              ["paddingLeft","Слева"],["paddingRight","Справа"]
                            ].map(([k,lbl]) => (
                              <div key={k}>
                                <label className="text-[10px] text-muted-foreground block mb-0.5">{lbl}</label>
                                <input type="text" value={s[k] || ""} onChange={e => us(k, e.target.value)}
                                  placeholder="0px"
                                  className="w-full bg-secondary border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary" />
                              </div>
                            ))}
                          </div>
                          <div className="grid grid-cols-4 gap-1 mt-2">
                            {["0","16px","32px","64px","80px","100px","120px","160px"].map(v => (
                              <button key={v} onClick={() => { us("paddingTop", v); us("paddingBottom", v); }}
                                className="text-[10px] py-1 rounded-lg border border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition">
                                {v}
                              </button>
                            ))}
                          </div>
                          <p className="text-[10px] text-muted-foreground/50 mt-1.5">Кнопки ↑↓ применяют padding сверху и снизу</p>
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-foreground font-medium block mb-2">Внешние отступы (margin)</label>
                          <div className="grid grid-cols-2 gap-2">
                            {[["marginTop","Снаружи сверху"],["marginBottom","Снаружи снизу"]].map(([k,lbl]) => (
                              <div key={k}>
                                <label className="text-[10px] text-muted-foreground block mb-0.5">{lbl}</label>
                                <input type="text" value={s[k] || ""} onChange={e => us(k, e.target.value)}
                                  placeholder="0px"
                                  className="w-full bg-secondary border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary" />
                              </div>
                            ))}
                          </div>
                        </div>
                      </>}

                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })()}
      </div>

      {/* ── Bottom: Save + Actions ── */}
      <div className="border-t border-border flex-shrink-0 p-3 space-y-2">
        <button onClick={save} disabled={saving || !dirty}
          className={`w-full py-2.5 rounded-xl text-sm font-bold transition ${dirty ? "gradient-purple text-white hover:opacity-90 shadow-lg shadow-purple-500/20" : "bg-secondary text-muted-foreground cursor-not-allowed opacity-60"}`}>
          {saving ? "Сохранение..." : dirty ? "💾 Сохранить изменения" : "✓ Сохранено"}
        </button>
        <div className="flex gap-1.5">
          <button onClick={onMoveUp} className="flex-1 flex items-center justify-center py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition text-xs gap-1"><ChevronUp size={12} /> Вверх</button>
          <button onClick={onMoveDown} className="flex-1 flex items-center justify-center py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition text-xs gap-1"><ChevronDown size={12} /> Вниз</button>
          <button onClick={onDuplicate} title="Дублировать блок" className="flex items-center justify-center py-1.5 px-3 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-white/5 transition text-xs">⧉</button>
          <button onClick={onToggleVisibility} title={block.visible === false ? "Показать блок на сайте" : "Скрыть блок на сайте"}
            className={`flex items-center justify-center py-1.5 px-3 rounded-lg border transition ${block.visible === false ? "border-amber-500/40 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20" : "border-border text-muted-foreground hover:text-foreground hover:bg-white/5"}`}>
            {block.visible === false ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>
          <button onClick={onDelete} className="flex items-center justify-center py-1.5 px-3 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition"><Trash2 size={12} /></button>
        </div>
      </div>
    </div>
  );
}

// ─── Link Picker Component ────────────────────────────────
function LinkPickerInput({ label, val, onChange, blocks, pages }: {
  label: string; val: string;
  onChange: (v: string) => void;
  blocks: Block[]; pages: Page[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const anchors = blocks.reduce<{ id: string; anchorId: string; type: string }[]>((acc, b) => {
    try {
      const s = JSON.parse(b.styles || "{}");
      if (s.anchorId) acc.push({ id: b.id, anchorId: s.anchorId, type: b.type });
    } catch {}
    return acc;
  }, []);

  return (
    <div className="relative" ref={ref}>
      <label className="text-[11px] text-muted-foreground font-medium block mb-1">{label}</label>
      <div className="flex gap-1">
        <input type="text" value={val || ""} onChange={e => onChange(e.target.value)}
          className="flex-1 bg-secondary border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
          placeholder="https:// или #id-блока" />
        <button type="button" onClick={() => setOpen(o => !o)} title="Выбрать ссылку"
          className={`flex items-center justify-center w-8 bg-secondary border border-border rounded-lg transition focus:outline-none ${open ? "bg-primary/10 border-primary/40 text-primary" : "text-muted-foreground hover:bg-primary/10 hover:border-primary/40 hover:text-primary"}`}>
          <LinkIcon size={12} />
        </button>
      </div>

      {open && (
        <div className="absolute right-0 bottom-full mb-1 z-[500] w-64 bg-card border border-border rounded-xl shadow-2xl shadow-black/70 overflow-hidden max-h-72 flex flex-col">
          {pages.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground bg-secondary/60 border-b border-border/60 flex items-center gap-1.5 flex-shrink-0">
                <FileText size={10} /> Страницы сайта
              </div>
              <div className="overflow-y-auto">
                {pages.map(p => (
                  <button key={p.id} type="button"
                    onClick={() => { onChange("/" + (p.slug || p.id)); setOpen(false); }}
                    className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-primary/10 hover:text-primary transition flex items-center gap-2 focus:outline-none">
                    <FileText size={11} className="text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{p.name}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground font-mono flex-shrink-0">/{p.slug || p.id}</span>
                  </button>
                ))}
              </div>
            </>
          )}
          {anchors.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground bg-secondary/60 border-b border-t border-border/60 flex items-center gap-1.5 flex-shrink-0">
                <Hash size={10} /> Якоря на странице
              </div>
              <div className="overflow-y-auto">
                {anchors.map(a => (
                  <button key={a.id} type="button"
                    onClick={() => { onChange("#" + a.anchorId); setOpen(false); }}
                    className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-primary/10 hover:text-primary transition flex items-center gap-2 focus:outline-none">
                    <Hash size={11} className="text-muted-foreground flex-shrink-0" />
                    <span className="font-mono">#{a.anchorId}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground">{a.type}</span>
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="px-3 py-2 text-[10px] text-muted-foreground bg-secondary/20 border-t border-border/60 flex items-center gap-1.5 flex-shrink-0">
            <ArrowSquareOut size={10} /> Внешняя ссылка — введите https://...
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Draggable panel hook ──────────────────────────
function useDraggable() {
  const [pos, setPos] = useState(() => ({
    x: Math.max(0, window.innerWidth - 576),
    y: 48,
  }));
  const startPos = useRef({ x: 0, y: 0 });
  const startMouse = useRef({ x: 0, y: 0 });

  const onHeaderMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    startPos.current = { ...pos };
    startMouse.current = { x: e.clientX, y: e.clientY };
    const onMove = (ev: MouseEvent) => {
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 288, startPos.current.x + ev.clientX - startMouse.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 48, startPos.current.y + ev.clientY - startMouse.current.y)),
      });
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return { pos, onHeaderMouseDown };
}

// ─── Main BuilderPage ────────────────────────────────

export default function BuilderPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const [, nav] = useLocation();
  const [site, setSite] = useState<Site | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [leftTab, setLeftTab] = useState<"blocks" | "pages" | "forms">("blocks");
  const [formSubmissions, setFormSubmissions] = useState<FormSubmission[]>([]);
  const [formsLoading, setFormsLoading] = useState(false);

  // ─── Undo / Redo ───────────────────────────────────
  const undoStack = useRef<Block[][]>([]);
  const redoStack = useRef<Block[][]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [openCategory, setOpenCategory] = useState("hero");
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<string | null>(null);
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [addingPage, setAddingPage] = useState(false);
  const [newPageName, setNewPageName] = useState("");
  const [dragSrcIdx, setDragSrcIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [showSiteSettings, setShowSiteSettings] = useState(false);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [favicon, setFavicon] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"seo" | "design">("seo");
  // Design tokens
  const [primaryColor, setPrimaryColor] = useState("#7C3AED");
  const [fontFamily, setFontFamily] = useState("Inter");
  const [siteBg, setSiteBg] = useState("#0f0f23");
  const [filterByType, setFilterByType] = useState(false);
  const [templatePickerType, setTemplatePickerType] = useState<string | null>(null);
  const [pageSeoModal, setPageSeoModal] = useState<{ pageId: string; title: string; desc: string; ogImage: string } | null>(null);
  const [savingPageSeo, setSavingPageSeo] = useState(false);
  const [zeroBlockEditId, setZeroBlockEditId] = useState<string | null>(null);

  useEffect(() => {
    if (!siteId) return;
    sitesApi.get(siteId).then(s => {
      setSite(s);
      const pg = s.pages || [];
      setPages(pg);
      setActivePageId(pg[0]?.id || null);
      setBlocks(s.blocks || []);
      try {
        const gs = JSON.parse(s.globalStyles || "{}");
        setSeoTitle(gs.seoTitle || "");
        setSeoDesc(gs.seoDesc || "");
        setSeoKeywords(gs.seoKeywords || "");
        setFavicon(gs.favicon || "");
        setPrimaryColor(gs.primaryColor || "#7C3AED");
        setFontFamily(gs.fontFamily || "Inter");
        setSiteBg(gs.siteBg || "#0f0f23");
      } catch {}
      setLoading(false);
    }).catch(() => nav("/dashboard"));
  }, [siteId]);

  useEffect(() => {
    if (leftTab !== "forms" || !siteId) return;
    setFormsLoading(true);
    sitesApi.getFormSubmissions(siteId)
      .then(setFormSubmissions)
      .catch(() => setFormSubmissions([]))
      .finally(() => setFormsLoading(false));
  }, [leftTab, siteId]);

  // ─── Undo/Redo helpers ───────────────────────────────────────────────
  const getPageBlocks = (currentBlocks = blocks) =>
    currentBlocks.filter(b => b.pageId === activePageId || (!b.pageId && activePageId === pages[0]?.id));

  const pushHistory = () => {
    const snapshot = getPageBlocks();
    if (!snapshot.length) return;
    undoStack.current = [...undoStack.current.slice(-29), [...snapshot]];
    redoStack.current = [];
    setCanUndo(true);
    setCanRedo(false);
  };

  const applySnapshot = async (snapshot: Block[]) => {
    const current = getPageBlocks();
    setSelectedId(null);
    // Optimistic local update
    setBlocks(prev => {
      const other = prev.filter(b => !(b.pageId === activePageId || (!b.pageId && activePageId === pages[0]?.id)));
      return [...other, ...snapshot];
    });
    // Sync to API
    const toDelete = current.filter(cb => !snapshot.find(sb => sb.id === cb.id));
    const toUpdate = snapshot.filter(sb => {
      const cb = current.find(c => c.id === sb.id);
      return cb && (cb.content !== sb.content || cb.styles !== sb.styles || cb.width !== sb.width || cb.position !== sb.position);
    });
    await Promise.all([
      ...toDelete.map(b => sitesApi.deleteBlock(siteId!, b.id).catch(() => {})),
      ...toUpdate.map(b => sitesApi.updateBlock(siteId!, b.id, { content: b.content, styles: b.styles, width: b.width }).catch(() => {})),
    ]);
    // Re-add blocks that were deleted (in snapshot but not in current)
    const toAdd = snapshot.filter(sb => !current.find(cb => cb.id === sb.id));
    for (const b of toAdd) {
      try {
        const nb = await sitesApi.addBlock(siteId!, { type: b.type, position: b.position, pageId: b.pageId || undefined, rowId: b.rowId || undefined });
        await sitesApi.updateBlock(siteId!, nb.id, { content: b.content, styles: b.styles, width: b.width });
      } catch {}
    }
  };

  const handleUndo = async () => {
    if (!undoStack.current.length) return;
    const snapshot = undoStack.current.pop()!;
    redoStack.current = [...redoStack.current, [...getPageBlocks()]];
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(true);
    await applySnapshot(snapshot);
  };

  const handleRedo = async () => {
    if (!redoStack.current.length) return;
    const snapshot = redoStack.current.pop()!;
    undoStack.current = [...undoStack.current, [...getPageBlocks()]];
    setCanUndo(true);
    setCanRedo(redoStack.current.length > 0);
    await applySnapshot(snapshot);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); handleUndo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); handleRedo(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canUndo, canRedo, blocks, activePageId, pages, siteId]);

  const openPageSeo = (page: any) => {
    let m: any = {};
    try { m = JSON.parse(page.meta || "{}"); } catch {}
    setPageSeoModal({ pageId: page.id, title: m.title || "", desc: m.desc || "", ogImage: m.ogImage || "" });
  };

  const savePageSeo = async () => {
    if (!siteId || !pageSeoModal) return;
    setSavingPageSeo(true);
    try {
      const meta = JSON.stringify({ title: pageSeoModal.title, desc: pageSeoModal.desc, ogImage: pageSeoModal.ogImage });
      const updated = await sitesApi.updatePage(siteId, pageSeoModal.pageId, { meta });
      setPages(prev => prev.map(p => p.id === pageSeoModal.pageId ? updated : p));
      setPageSeoModal(null);
    } finally { setSavingPageSeo(false); }
  };

  const saveSiteSettings = async () => {
    if (!siteId || !site) return;
    setSavingSettings(true);
    try {
      const existing = (() => { try { return JSON.parse(site.globalStyles || "{}"); } catch { return {}; } })();
      const newStyles = JSON.stringify({ ...existing, seoTitle, seoDesc, seoKeywords, favicon, primaryColor, fontFamily, siteBg });
      const updated = await sitesApi.updateStyles(siteId, newStyles);
      setSite(prev => prev ? { ...prev, globalStyles: updated.globalStyles } : prev);
      setShowSiteSettings(false);
    } finally { setSavingSettings(false); }
  };

  const BUSINESS_BLOCK_FILTERS: Record<string, string[]> = {
    LANDING: ["HERO","CTA","FEATURES","STATS","TESTIMONIALS","FAQ","TEXT","GALLERY","VIDEO","CONTACTS","FORM","BLOG","PRICING","HEADER_MENU","FOOTER","MAP","ZERO_BLOCK","POPUP"],
    ECOMMERCE: ["HERO","PRODUCTS","FEATURES","PRICING","TESTIMONIALS","FAQ","CONTACTS","FORM","GALLERY","VIDEO","HEADER_MENU","FOOTER","MAP","ZERO_BLOCK","CTA","TEXT","STATS","POPUP"],
    MUSIC_LABEL: ["HERO","MUSIC_PLAYER","DISCOGRAPHY","VIDEO","GALLERY","TEAM","CONTACTS","FORM","HEADER_MENU","FOOTER","ZERO_BLOCK","CTA","TEXT","STATS","POPUP"],
    FITNESS: ["HERO","SCHEDULE","COACHES","FEATURES","PRICING","TESTIMONIALS","STATS","CONTACTS","FORM","GALLERY","VIDEO","HEADER_MENU","FOOTER","MAP","ZERO_BLOCK","CTA","TEXT","POPUP"],
  };
  const allowedBlocks = site ? (BUSINESS_BLOCK_FILTERS[site.businessType] || null) : null;
  const visibleCategories = BLOCK_CATEGORIES.map(cat => ({
    ...cat,
    blocks: filterByType && allowedBlocks
      ? cat.blocks.filter(b => allowedBlocks.includes(b.type))
      : cat.blocks,
  })).filter(cat => cat.blocks.length > 0);

  const pageBlocks = blocks.filter(b =>
    b.pageId === activePageId || (!b.pageId && activePageId === pages[0]?.id)
  );

  const rows = (() => {
    const seen = new Set<string>();
    const result: { rowId: string | null; blocks: Block[] }[] = [];
    for (const b of [...pageBlocks].sort((a, b2) => a.position - b2.position)) {
      if (b.rowId) {
        if (seen.has(b.rowId)) { result.find(r => r.rowId === b.rowId)?.blocks.push(b); }
        else { seen.add(b.rowId); result.push({ rowId: b.rowId, blocks: [b] }); }
      } else { result.push({ rowId: null, blocks: [b] }); }
    }
    return result;
  })();

  const selectedBlock = blocks.find(b => b.id === selectedId) ?? null;

  const addBlock = async (type: string) => {
    if (!siteId || !activePageId) return;
    pushHistory();
    const nb = await sitesApi.addBlock(siteId, { type, position: pageBlocks.length, pageId: activePageId });
    setBlocks(prev => [...prev, nb]);
    setSelectedId(nb.id);
  };

  const addBlockWithTemplate = async (type: string, templateStyles?: Record<string, any>) => {
    if (!siteId || !activePageId) return;
    pushHistory();
    const nb = await sitesApi.addBlock(siteId, { type, position: pageBlocks.length, pageId: activePageId });
    if (templateStyles) {
      const merged = { ...JSON.parse(nb.styles || "{}"), ...templateStyles };
      await sitesApi.updateBlock(siteId, nb.id, { styles: JSON.stringify(merged) });
      nb.styles = JSON.stringify(merged);
    }
    setBlocks(prev => [...prev, nb]);
    setSelectedId(nb.id);
    setTemplatePickerType(null);
  };

  const addColumn = async (toBlock: Block) => {
    if (!siteId || !activePageId) return;
    const rowId = toBlock.rowId || genRowId();
    if (!toBlock.rowId) {
      await sitesApi.updateBlock(siteId, toBlock.id, { rowId });
      setBlocks(prev => prev.map(b => b.id === toBlock.id ? { ...b, rowId } : b));
    }
    const nb = await sitesApi.addBlock(siteId, { type: toBlock.type, position: pageBlocks.length, pageId: activePageId, rowId });
    const inRow = blocks.filter(b => b.rowId === rowId).concat(nb);
    const w = inRow.length >= 3 ? 33 : 50;
    await Promise.all(inRow.map(b => sitesApi.updateBlock(siteId, b.id, { width: w })));
    setBlocks(prev => [
      ...prev.map(b => (b.rowId === rowId || b.id === toBlock.id) ? { ...b, rowId, width: w } : b),
      { ...nb, rowId, width: w }
    ]);
    setSelectedId(nb.id);
  };

  const deleteBlock = async (bid: string) => {
    pushHistory();
    await sitesApi.deleteBlock(siteId!, bid);
    setBlocks(prev => prev.filter(b => b.id !== bid));
    if (selectedId === bid) setSelectedId(null);
  };

  const toggleVisibility = async (bid: string) => {
    const block = blocks.find(b => b.id === bid);
    if (!block) return;
    const nowVisible = block.visible !== false;
    const updated = await sitesApi.updateBlock(siteId!, bid, { visible: !nowVisible });
    setBlocks(prev => prev.map(b => b.id === bid ? { ...b, visible: !nowVisible } : b));
  };

  const duplicateBlock = async (block: Block) => {
    if (!siteId || !activePageId) return;
    pushHistory();
    const nb = await sitesApi.addBlock(siteId, { type: block.type, position: block.position + 0.5, pageId: activePageId, rowId: undefined });
    await sitesApi.updateBlock(siteId, nb.id, { content: block.content, styles: block.styles, width: block.width });
    const updated = { ...nb, content: block.content, styles: block.styles, width: block.width };
    setBlocks(prev => [...prev, updated]);
    setSelectedId(nb.id);
  };

  const moveBlock = async (bid: string, dir: "up" | "down") => {
    pushHistory();
    const sorted = [...pageBlocks].sort((a, b) => a.position - b.position);
    const idx = sorted.findIndex(b => b.id === bid);
    const ti = dir === "up" ? idx - 1 : idx + 1;
    if (ti < 0 || ti >= sorted.length) return;
    const [a, bt] = [sorted[idx], sorted[ti]];
    await Promise.all([
      sitesApi.updateBlock(siteId!, a.id, { position: bt.position }),
      sitesApi.updateBlock(siteId!, bt.id, { position: a.position }),
    ]);
    setBlocks(prev => prev.map(b => b.id === a.id ? { ...b, position: bt.position } : b.id === bt.id ? { ...b, position: a.position } : b));
  };

  const moveRow = async (srcIdx: number, dstIdx: number) => {
    if (srcIdx === dstIdx) return;
    const newRows = [...rows];
    const [moved] = newRows.splice(srcIdx, 1);
    newRows.splice(dstIdx, 0, moved);
    const updates: Promise<any>[] = [];
    let pos = 0;
    for (const row of newRows) {
      for (const block of row.blocks) {
        if (block.position !== pos) updates.push(sitesApi.updateBlock(siteId!, block.id, { position: pos }));
        pos++;
      }
    }
    await Promise.all(updates);
    const flat = newRows.flatMap(r => r.blocks);
    setBlocks(prev => prev.map(b => {
      const idx2 = flat.findIndex(f => f.id === b.id);
      return idx2 !== -1 ? { ...b, position: idx2 } : b;
    }));
  };

  const addPage = async () => {
    if (!newPageName.trim() || !siteId) return;
    const page = await sitesApi.addPage(siteId, { name: newPageName });
    setPages(prev => [...prev, page]);
    setActivePageId(page.id);
    setNewPageName(""); setAddingPage(false);
  };

  const deletePage = async (pid: string) => {
    if (pages.length <= 1) return;
    await sitesApi.deletePage(siteId!, pid);
    const rem = pages.filter(p => p.id !== pid);
    setPages(rem);
    if (activePageId === pid) setActivePageId(rem[0]?.id || null);
    setBlocks(prev => prev.filter(b => b.pageId !== pid));
  };

  const publish = async () => {
    setPublishing(true);
    try { const r = await sitesApi.publish(siteId!); setPublished(r.url); setSite(s => s ? { ...s, ...r.site } : s); }
    finally { setPublishing(false); }
  };

  const viewW = { desktop: "100%", tablet: "768px", mobile: "390px" };

  // ── AI Screenshot Import ───────────────────────────────────────────
  const [showAiImport, setShowAiImport] = useState(false);
  const [aiFile, setAiFile] = useState<File | null>(null);
  const [aiPreview, setAiPreview] = useState("");
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AiScreenshotResult | null>(null);
  const [aiError, setAiError] = useState("");
  const [aiImporting, setAiImporting] = useState(false);
  const aiInputRef = useRef<HTMLInputElement>(null);

  const openAiImport = () => {
    setShowAiImport(true);
    setAiFile(null); setAiPreview(""); setAiResult(null); setAiError(""); setAiAnalyzing(false); setAiImporting(false);
  };

  const handleAiFile = (file: File) => {
    setAiFile(file); setAiResult(null); setAiError("");
    const reader = new FileReader();
    reader.onload = (e) => setAiPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleAiAnalyze = async () => {
    if (!aiFile) return;
    setAiAnalyzing(true); setAiError("");
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = (e) => resolve((e.target?.result as string).split(",")[1]);
        r.onerror = reject;
        r.readAsDataURL(aiFile);
      });
      setAiResult(await analyzeScreenshot(base64));
    } catch (e: any) {
      setAiError(e.response?.data?.message || "Ошибка анализа. Попробуйте снова.");
    } finally { setAiAnalyzing(false); }
  };

  const handleAiImport = async () => {
    if (!aiResult || !siteId || !activePageId) return;
    setAiImporting(true);
    try {
      const pageBlocks = blocks.filter(b => b.pageId === activePageId || (!b.pageId && activePageId === pages[0]?.id));
      await Promise.all(pageBlocks.map(b => sitesApi.deleteBlock(siteId, b.id)));
      const newBlocks: Block[] = [];
      for (let i = 0; i < aiResult.blocks.length; i++) {
        const ab = aiResult.blocks[i];
        const created = await sitesApi.addBlock(siteId, { type: ab.type, position: i, pageId: activePageId });
        const updated = await sitesApi.updateBlock(siteId, created.id, {
          content: JSON.stringify(ab.content),
          styles: JSON.stringify(ab.styles),
        });
        newBlocks.push(updated);
      }
      setBlocks(prev => [...prev.filter(b => b.pageId !== activePageId && (b.pageId !== null || activePageId !== pages[0]?.id)), ...newBlocks]);
      setShowAiImport(false);
    } catch (e: any) {
      setAiError(e.response?.data?.message || "Ошибка импорта блоков");
    } finally { setAiImporting(false); }
  };

  if (loading) return (
    <div className="h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">Загружаем редактор...</p>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="h-12 flex items-center px-3 border-b border-border bg-card flex-shrink-0 gap-2">
        <button onClick={() => nav("/dashboard")} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-white/5 transition text-sm">
          <ArrowLeft size={15} /><span className="hidden sm:inline">Назад</span>
        </button>
        <div className="w-px h-5 bg-border" />
        <span className="text-foreground font-bold text-sm truncate max-w-[120px]">{site?.name}</span>

        {/* Page tabs */}
        <div className="flex items-center gap-0.5 ml-2 flex-1 overflow-x-auto hide-scroll">
          {pages.map(page => (
            <div key={page.id} className="flex items-center flex-shrink-0 group">
              <button onClick={() => setActivePageId(page.id)}
                className={`text-xs px-3 py-1.5 rounded-lg transition font-medium whitespace-nowrap ${activePageId === page.id ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}>
                {page.name}
              </button>
              <button onClick={() => openPageSeo(page)} title="SEO страницы"
                className="opacity-0 group-hover:opacity-100 transition p-0.5 text-muted-foreground hover:text-primary rounded ml-0.5">
                <Settings2 size={10} />
              </button>
              {pages.length > 1 && (
                <button onClick={() => deletePage(page.id)} className="opacity-0 group-hover:opacity-100 transition p-0.5 text-muted-foreground hover:text-red-400 rounded ml-0.5">
                  <X size={10} />
                </button>
              )}
            </div>
          ))}
          <button onClick={() => { setAddingPage(true); setNewPageName(""); }} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-white/5 transition ml-1 flex-shrink-0">
            <Plus size={11} /> Страница
          </button>
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 border border-border rounded-lg p-0.5" title="Отменить / Повторить (Ctrl+Z / Ctrl+Y)">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            title="Отменить (Ctrl+Z)"
            className={`p-1.5 rounded-md transition ${canUndo ? "text-primary hover:text-primary hover:bg-primary/10" : "text-primary/30 cursor-not-allowed"}`}
          >
            <Undo2 size={13} />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            title="Повторить (Ctrl+Y)"
            className={`p-1.5 rounded-md transition ${canRedo ? "text-primary hover:text-primary hover:bg-primary/10" : "text-primary/30 cursor-not-allowed"}`}
          >
            <Redo2 size={13} />
          </button>
        </div>

        {/* Viewport */}
        <div className="flex items-center gap-0.5 border border-border rounded-lg p-0.5">
          {([["desktop", Monitor], ["tablet", Tablet], ["mobile", Smartphone]] as const).map(([v, Icon]) => (
            <button key={v} onClick={() => setViewport(v)} className={`p-1.5 rounded-md transition ${viewport === v ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <Icon size={13} />
            </button>
          ))}
        </div>

        {(published || site?.status === "PUBLISHED") && (
          <button onClick={() => nav(`/preview/${siteId}`)} className="hidden sm:flex items-center gap-1 text-xs text-green-400 px-2 py-1 border border-green-500/30 rounded-lg hover:bg-green-500/8 transition">
            <Eye size={12} /> Предпросмотр
          </button>
        )}
        <button onClick={openAiImport}
          className="flex items-center gap-1 text-xs text-purple-400 px-2 py-1 border border-purple-500/30 rounded-lg hover:bg-purple-500/10 hover:text-purple-300 transition flex-shrink-0">
          <Zap size={12} /> AI
        </button>
        <button onClick={() => setShowSiteSettings(true)}
          className="flex items-center gap-1 text-xs text-muted-foreground px-2 py-1 border border-border rounded-lg hover:bg-white/5 hover:text-foreground transition">
          <Settings2 size={12} /> SEO
        </button>
        <button onClick={publish} disabled={publishing}
          className="flex items-center gap-1.5 gradient-purple text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:opacity-90 transition disabled:opacity-60 flex-shrink-0">
          {publishing ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> : <Globe size={13} />}
          {publishing ? "Публикация..." : site?.status === "PUBLISHED" ? "Обновить" : "Опубликовать"}
        </button>
      </div>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel */}
        <div className="w-60 border-r border-border bg-card flex flex-col overflow-hidden flex-shrink-0">
          <div className="flex border-b border-border">
            {([["blocks", "Блоки"], ["pages", "Страницы"], ["forms", "Заявки"]] as const).map(([t, l]) => (
              <button key={t} onClick={() => setLeftTab(t)} className={`flex-1 text-xs py-2.5 font-semibold transition border-b-2 ${leftTab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{l}</button>
            ))}
          </div>
          {leftTab === "forms" ? (
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Входящие заявки</p>
                <button onClick={() => { setFormsLoading(true); sitesApi.getFormSubmissions(siteId!).then(setFormSubmissions).catch(() => {}).finally(() => setFormsLoading(false)); }} className="text-xs text-muted-foreground hover:text-foreground transition p-1 rounded-md hover:bg-white/5"><Send size={11} /></button>
              </div>
              {formsLoading ? (
                <p className="text-xs text-muted-foreground text-center py-6">Загрузка…</p>
              ) : formSubmissions.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <Inbox size={28} className="text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">Заявок пока нет</p>
                </div>
              ) : (
                formSubmissions.map(sub => {
                  let data: Record<string, string> = {};
                  try { data = JSON.parse(sub.data || "{}"); } catch {}
                  const date = new Date(sub.createdAt).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
                  return (
                    <div key={sub.id} className="border border-border rounded-xl p-3 bg-white/3 space-y-1.5">
                      <p className="text-xs text-muted-foreground">{date}</p>
                      {Object.entries(data).map(([k, v]) => (
                        <div key={k}>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{k}</p>
                          <p className="text-xs text-foreground break-all">{v}</p>
                        </div>
                      ))}
                    </div>
                  );
                })
              )}
            </div>
          ) : leftTab === "pages" ? (
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {pages.map(page => (
                <div key={page.id} onClick={() => setActivePageId(page.id)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition border ${activePageId === page.id ? "border-primary/30 bg-primary/10" : "border-border hover:bg-white/4"}`}>
                  <div>
                    <p className={`text-sm font-semibold ${activePageId === page.id ? "text-primary" : "text-foreground"}`}>{page.name}</p>
                    <p className="text-xs text-muted-foreground">/{page.slug} · {blocks.filter(b => b.pageId === page.id || (!b.pageId && page.id === pages[0]?.id)).length} бл.</p>
                  </div>
                  {pages.length > 1 && <button onClick={e => { e.stopPropagation(); deletePage(page.id); }} className="p-1 text-muted-foreground hover:text-red-400 transition rounded-md hover:bg-red-500/10"><Trash2 size={12} /></button>}
                </div>
              ))}
              <button onClick={() => { setAddingPage(true); setLeftTab("blocks"); }} className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground border border-dashed border-border rounded-xl py-2.5 hover:border-primary/40 hover:text-foreground transition">
                <Plus size={12} /> Новая страница
              </button>
            </div>
          ) : templatePickerType ? (
            /* ── Template picker ── */
            <div className="flex-1 overflow-y-auto flex flex-col">
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/40 flex-shrink-0">
                <button onClick={() => setTemplatePickerType(null)}
                  className="p-1 rounded-md hover:bg-white/5 text-muted-foreground hover:text-foreground transition">
                  <ArrowLeft size={13} />
                </button>
                <span className="text-xs font-bold text-foreground">Выберите вариант</span>
              </div>
              <div className="p-3 grid grid-cols-2 gap-3 overflow-y-auto">
                {(BLOCK_TEMPLATES[templatePickerType] || []).map(t => (
                  <button key={t.id} onClick={() => addBlockWithTemplate(templatePickerType, t.styles)}
                    className="flex flex-col gap-2 p-2 rounded-xl border border-border hover:border-primary/60 hover:bg-primary/5 transition text-left group/tpl">
                    <div className="w-full rounded-lg overflow-hidden border border-white/5 bg-[#0d0d1e]" style={{ aspectRatio: "16/9" }}>
                      <BlockThumb id={t.id} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground group-hover/tpl:text-primary transition leading-tight">{t.label}</p>
                      <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">{t.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto flex flex-col">
              {allowedBlocks && (
                <button onClick={() => setFilterByType(f => !f)}
                  className={`flex items-center gap-2 mx-3 mt-2 mb-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${filterByType ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:bg-white/5"}`}>
                  <Hash size={11} />
                  {filterByType ? "Фильтр: по типу сайта" : "Показать только под тип сайта"}
                </button>
              )}
              {visibleCategories.map(cat => {
                const CIcon = cat.icon;
                return (
                  <div key={cat.id}>
                    <button onClick={() => setOpenCategory(openCategory === cat.id ? "" : cat.id)}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/3 transition border-b border-border/40">
                      <div className="flex items-center gap-2">
                        <CIcon size={12} className="text-muted-foreground" />
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{cat.label}</span>
                      </div>
                      <ChevronRight size={12} className={`text-muted-foreground transition-transform ${openCategory === cat.id ? "rotate-90" : ""}`} />
                    </button>
                    {openCategory === cat.id && (
                      <div className="py-1 px-2 border-b border-border/30">
                        {cat.blocks.map(bt => {
                          const BIcon = bt.icon;
                          const hasTemplates = !!BLOCK_TEMPLATES[bt.type];
                          return (
                            <button key={bt.type}
                              onClick={() => hasTemplates ? setTemplatePickerType(bt.type) : addBlock(bt.type)}
                              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-primary/10 transition group/btn text-left">
                              <div className="w-7 h-7 rounded-lg bg-white/5 group-hover/btn:bg-primary/15 flex items-center justify-center flex-shrink-0 transition">
                                <BIcon size={13} className="text-muted-foreground group-hover/btn:text-primary transition" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-foreground group-hover/btn:text-primary transition leading-tight">{bt.label}</p>
                                <p className="text-xs text-muted-foreground leading-tight">{bt.desc}</p>
                              </div>
                              {hasTemplates && <ChevronRight size={11} className="text-muted-foreground/50 group-hover/btn:text-primary/60 transition flex-shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto canvas-bg flex flex-col items-center py-6 px-4">
          <div className="transition-all duration-300 w-full" style={{ maxWidth: viewW[viewport] }}>
            {rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center mb-4 bg-white/2">
                  <Layers size={24} className="text-white/20" />
                </div>
                <p className="text-muted-foreground font-semibold">Страница пустая</p>
                <p className="text-muted-foreground text-sm mt-1 opacity-60">Добавьте блок из левой панели</p>
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden border border-white/8 shadow-2xl shadow-black/40">
                {rows.map((row, ri) => (
                  <div key={row.rowId || `row-${ri}`}
                    className={`flex relative group/row transition-all ${dragOverIdx === ri && dragSrcIdx !== ri ? "ring-2 ring-inset ring-primary/60" : ""} ${dragSrcIdx === ri ? "opacity-40" : ""}`}
                    draggable
                    onDragStart={e => { e.dataTransfer.effectAllowed = "move"; setDragSrcIdx(ri); }}
                    onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOverIdx(ri); }}
                    onDragEnd={() => { setDragSrcIdx(null); setDragOverIdx(null); }}
                    onDrop={e => { e.preventDefault(); if (dragSrcIdx !== null && dragSrcIdx !== ri) moveRow(dragSrcIdx, ri); setDragSrcIdx(null); setDragOverIdx(null); }}
                  >
                    {/* Drag handle */}
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 z-30 opacity-0 group-hover/row:opacity-100 transition cursor-grab active:cursor-grabbing"
                      title="Перетащите для перестановки">
                      <div className="bg-black/60 backdrop-blur rounded-md p-1">
                        <GripVertical size={12} className="text-white/70" />
                      </div>
                    </div>
                    {row.blocks.map(block => (
                      <div key={block.id}
                        onClick={e => { e.stopPropagation(); setSelectedId(selectedId === block.id ? null : block.id); }}
                        style={{ width: `${block.width}%` }}
                        className={`relative cursor-pointer transition-all group/block ${selectedId === block.id ? "ring-2 ring-inset ring-primary" : "hover:ring-1 hover:ring-inset hover:ring-primary/30"}`}>
                        <div className={block.visible === false ? "opacity-30 grayscale pointer-events-none select-none" : ""}>
                          <BlockPreview block={block} viewport={viewport} />
                        </div>
                        {block.visible === false && (
                          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                            <div className="bg-black/60 backdrop-blur rounded-xl px-3 py-1.5 flex items-center gap-2">
                              <EyeOff size={13} className="text-white/60" />
                              <span className="text-xs text-white/60 font-medium">Скрыт на сайте</span>
                            </div>
                          </div>
                        )}
                        <div className="absolute top-1.5 right-1.5 hidden group-hover/block:flex items-center gap-1 z-20">
                          {block.type === "ZERO_BLOCK" && (
                            <button onClick={e => { e.stopPropagation(); setZeroBlockEditId(block.id); setSelectedId(block.id); }} title="Открыть Zero Block редактор"
                              className="h-6 px-2 bg-primary/90 backdrop-blur rounded-md flex items-center gap-1 text-white hover:bg-primary transition text-[11px] font-bold">
                              ✏ Редактор
                            </button>
                          )}
                          <button onClick={e => { e.stopPropagation(); moveBlock(block.id, "up"); }} title="Вверх" className="w-6 h-6 bg-black/70 backdrop-blur rounded-md flex items-center justify-center text-white/70 hover:text-white hover:bg-primary/70 transition"><ChevronUp size={11} /></button>
                          <button onClick={e => { e.stopPropagation(); moveBlock(block.id, "down"); }} title="Вниз" className="w-6 h-6 bg-black/70 backdrop-blur rounded-md flex items-center justify-center text-white/70 hover:text-white hover:bg-primary/70 transition"><ChevronDown size={11} /></button>
                          <button onClick={e => { e.stopPropagation(); duplicateBlock(block); }} title="Дублировать блок" className="w-6 h-6 bg-black/70 backdrop-blur rounded-md flex items-center justify-center text-white/70 hover:text-white hover:bg-blue-500/70 transition"><Copy size={11} /></button>
                          <button onClick={e => { e.stopPropagation(); toggleVisibility(block.id); }} title={block.visible === false ? "Показать блок" : "Скрыть блок"} className={`w-6 h-6 bg-black/70 backdrop-blur rounded-md flex items-center justify-center transition ${block.visible === false ? "text-amber-400 hover:bg-amber-500/40" : "text-white/70 hover:text-white hover:bg-white/20"}`}>
                            {block.visible === false ? <Eye size={11} /> : <EyeOff size={11} />}
                          </button>
                          <button onClick={e => { e.stopPropagation(); deleteBlock(block.id); }} title="Удалить блок" className="w-6 h-6 bg-black/70 backdrop-blur rounded-md flex items-center justify-center text-red-400 hover:bg-red-500/60 transition"><Trash2 size={11} /></button>
                        </div>
                        {selectedId === block.id && (
                          <div className="absolute bottom-0 left-0 bg-primary text-white text-xs px-2 py-0.5 font-bold z-20 rounded-tr-lg flex items-center gap-1.5">
                            {block.visible === false && <EyeOff size={9} className="opacity-80" />}
                            {BLOCK_LABEL[block.type] || block.type} · {block.width}%
                            {block.visible === false && <span className="opacity-70">· скрыт</span>}
                          </div>
                        )}
                      </div>
                    ))}
                    {/* Insert row below on hover */}
                    <button onClick={() => addBlock("TEXT")}
                      className="absolute -bottom-3 left-1/2 -translate-x-1/2 hidden group-hover/row:flex items-center gap-1 text-xs bg-primary text-white px-3 py-0.5 rounded-full z-30 shadow-lg shadow-purple-500/30 whitespace-nowrap">
                      <Plus size={10} /> добавить блок
                    </button>
                  </div>
                ))}
                <div className="border-t border-dashed border-white/8 py-6 flex items-center justify-center bg-white/1">
                  <button onClick={() => { setLeftTab("blocks"); setOpenCategory("hero"); }}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground border border-dashed border-white/12 rounded-xl px-6 py-3 hover:border-primary/40 transition group">
                    <Plus size={16} className="group-hover:text-primary transition" /> Добавить блок
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        {selectedBlock ? (
          <div className="w-72 border-l border-border bg-card flex-shrink-0 overflow-hidden flex flex-col">
            <SettingsPanel
              block={selectedBlock} siteId={siteId!} blocks={pageBlocks} pages={pages}
              onBeforeSave={pushHistory}
              onUpdate={u => setBlocks(prev => prev.map(b => b.id === u.id ? u : b))}
              onDelete={() => deleteBlock(selectedBlock.id)}
              onMoveUp={() => moveBlock(selectedBlock.id, "up")}
              onMoveDown={() => moveBlock(selectedBlock.id, "down")}
              onAddColumn={() => addColumn(selectedBlock)}
              onDuplicate={() => duplicateBlock(selectedBlock)}
              onToggleVisibility={() => toggleVisibility(selectedBlock.id)}
              onOpenZeroBlock={id => { setZeroBlockEditId(id); }}
            />
          </div>
        ) : (
          <div className="w-72 border-l border-border bg-card flex-shrink-0 flex flex-col items-center justify-center text-center p-6">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-3"><Settings2 size={20} className="text-white/20" /></div>
            <p className="text-muted-foreground text-sm font-semibold">Настройки блока</p>
            <p className="text-muted-foreground text-xs mt-1 leading-relaxed">Кликните на блок на холсте, чтобы изменить его содержимое и стили</p>
          </div>
        )}
      </div>

      {/* Add page modal */}
      {addingPage && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setAddingPage(false)}>
          <div className="glass border border-white/10 rounded-2xl p-7 w-full max-w-sm shadow-2xl">
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">📄</div>
              <h3 className="text-foreground font-black text-xl mb-1">Новая страница</h3>
              <p className="text-muted-foreground text-sm">Введите название для новой страницы вашего сайта</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Название страницы</label>
                <input autoFocus value={newPageName} onChange={e => setNewPageName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addPage()}
                  className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
                  placeholder="Например: О нас, Контакты, Блог..." />
              </div>
              <div className="bg-primary/5 border border-primary/15 rounded-xl p-3 text-xs text-muted-foreground">
                💡 URL страницы будет автоматически сгенерирован из названия. Например: «О нас» → <span className="text-primary font-mono">/o-nas</span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setAddingPage(false)}
                  className="flex-1 bg-secondary/60 text-foreground font-medium py-2.5 rounded-xl hover:bg-secondary transition text-sm">
                  Отмена
                </button>
                <button onClick={addPage} disabled={!newPageName.trim()}
                  className="flex-1 gradient-purple text-white font-bold py-2.5 rounded-xl hover:opacity-90 transition disabled:opacity-40 text-sm">
                  Создать страницу
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page SEO Modal */}
      {pageSeoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Settings2 size={14} className="text-primary" />
                <h2 className="text-sm font-bold">SEO страницы</h2>
              </div>
              <button onClick={() => setPageSeoModal(null)} className="text-muted-foreground hover:text-foreground transition">
                <X size={14} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">Title страницы</label>
                <input value={pageSeoModal.title} onChange={e => setPageSeoModal(m => m ? { ...m, title: e.target.value } : m)}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition"
                  placeholder="Главная | Мой сайт" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">Мета-описание</label>
                <textarea value={pageSeoModal.desc} onChange={e => setPageSeoModal(m => m ? { ...m, desc: e.target.value } : m)} rows={2}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:border-primary/50 transition"
                  placeholder="Описание страницы для поисковых систем..." />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">OG Image (URL для соцсетей)</label>
                <input value={pageSeoModal.ogImage} onChange={e => setPageSeoModal(m => m ? { ...m, ogImage: e.target.value } : m)}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition"
                  placeholder="https://example.com/og.png" />
              </div>
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => setPageSeoModal(null)}
                className="flex-1 bg-secondary/60 text-foreground font-medium py-2 rounded-xl hover:bg-secondary transition text-sm">
                Отмена
              </button>
              <button onClick={savePageSeo} disabled={savingPageSeo}
                className="flex-1 gradient-purple text-white font-bold py-2 rounded-xl hover:opacity-90 transition disabled:opacity-60 text-sm flex items-center justify-center gap-1.5">
                {savingPageSeo ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={12} />}
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEO Settings Modal */}
      {showSiteSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) setShowSiteSettings(false); }}>
          <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md flex flex-col" style={{ maxHeight: "90vh" }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <Settings2 size={16} className="text-primary" />
                <h2 className="text-base font-bold">Настройки сайта</h2>
              </div>
              <button onClick={() => setShowSiteSettings(false)} className="text-muted-foreground hover:text-foreground transition">
                <X size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border px-6 flex-shrink-0">
              {([["seo", "SEO"], ["design", "Дизайн"]] as const).map(([tab, label]) => (
                <button key={tab} onClick={() => setSettingsTab(tab)}
                  className={`text-sm py-2.5 px-4 border-b-2 transition -mb-px font-medium ${settingsTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {settingsTab === "seo" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">SEO заголовок (title)</label>
                    <input value={seoTitle} onChange={e => setSeoTitle(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition"
                      placeholder="Мой сайт — лучший выбор" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Мета-описание (description)</label>
                    <textarea value={seoDesc} onChange={e => setSeoDesc(e.target.value)} rows={3}
                      className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:border-primary/50 transition"
                      placeholder="Краткое описание вашего сайта для поисковиков..." />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Ключевые слова (через запятую)</label>
                    <input value={seoKeywords} onChange={e => setSeoKeywords(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition"
                      placeholder="сайт, бизнес, услуги" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Favicon (URL иконки)</label>
                    <input value={favicon} onChange={e => setFavicon(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition"
                      placeholder="https://example.com/favicon.ico" />
                  </div>
                  <div className="bg-primary/5 border border-primary/15 rounded-xl p-3 text-xs text-muted-foreground">
                    💡 SEO настройки влияют на отображение сайта в поисковых системах и при публикации.
                  </div>
                </div>
              )}

              {settingsTab === "design" && (
                <div className="space-y-5">
                  {/* Primary color */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-2">Акцентный цвет</label>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-xl border border-border cursor-pointer overflow-hidden"
                          style={{ backgroundColor: primaryColor }}>
                          <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                        </div>
                      </div>
                      <input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                        className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:border-primary/50 transition"
                        placeholder="#7C3AED" />
                    </div>
                    <div className="flex gap-2 mt-2.5 flex-wrap">
                      {["#7C3AED", "#2563EB", "#059669", "#DC2626", "#D97706", "#0891B2", "#DB2777", "#111827"].map(c => (
                        <button key={c} onClick={() => setPrimaryColor(c)}
                          className={`w-7 h-7 rounded-lg border-2 transition ${primaryColor === c ? "border-white scale-110" : "border-transparent hover:scale-105"}`}
                          style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>

                  {/* Site background */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-2">Фон сайта</label>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-xl border border-border cursor-pointer overflow-hidden"
                          style={{ backgroundColor: siteBg }}>
                          <input type="color" value={siteBg} onChange={e => setSiteBg(e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                        </div>
                      </div>
                      <input value={siteBg} onChange={e => setSiteBg(e.target.value)}
                        className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:border-primary/50 transition"
                        placeholder="#0f0f23" />
                    </div>
                    <div className="flex gap-2 mt-2.5 flex-wrap">
                      {["#0f0f23", "#070711", "#111827", "#0f172a", "#18181b", "#0c0c0c", "#ffffff", "#f8fafc"].map(c => (
                        <button key={c} onClick={() => setSiteBg(c)}
                          className={`w-7 h-7 rounded-lg border-2 transition ${siteBg === c ? "border-white scale-110" : "border-border hover:scale-105"}`}
                          style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>

                  {/* Font family */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-2">Шрифт сайта</label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { key: "Inter", label: "Inter", sub: "Современный, нейтральный" },
                        { key: "Roboto", label: "Roboto", sub: "Google Material Design" },
                        { key: "Montserrat", label: "Montserrat", sub: "Геометрический, брендовый" },
                        { key: "Playfair Display", label: "Playfair Display", sub: "Элегантный, редакционный" },
                        { key: "Oswald", label: "Oswald", sub: "Жирный, экспрессивный" },
                        { key: "system-ui", label: "System UI", sub: "Системный шрифт ОС" },
                      ].map(f => (
                        <button key={f.key} onClick={() => setFontFamily(f.key)}
                          className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-left transition ${fontFamily === f.key ? "border-primary bg-primary/10 text-foreground" : "border-border bg-secondary/40 text-muted-foreground hover:border-border/80 hover:text-foreground"}`}>
                          <span className="text-sm font-medium">{f.label}</span>
                          <span className="text-xs opacity-50">{f.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live preview */}
                  <div className="rounded-xl border border-border overflow-hidden">
                    <div className="px-3 py-1.5 bg-secondary/40 border-b border-border">
                      <span className="text-xs text-muted-foreground">Предпросмотр</span>
                    </div>
                    <div className="p-4 flex flex-col gap-2" style={{ backgroundColor: siteBg, fontFamily }}>
                      <p className="text-white text-lg font-bold">Заголовок сайта</p>
                      <p className="text-white/50 text-sm">Описание вашего бизнеса здесь</p>
                      <button className="self-start text-sm px-4 py-1.5 rounded-lg text-white font-semibold mt-1"
                        style={{ backgroundColor: primaryColor }}>
                        Кнопка действия
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer buttons */}
            <div className="flex gap-3 px-6 pb-6 pt-4 border-t border-border flex-shrink-0">
              <button onClick={() => setShowSiteSettings(false)}
                className="flex-1 bg-secondary/60 text-foreground font-medium py-2.5 rounded-xl hover:bg-secondary transition text-sm">
                Отмена
              </button>
              <button onClick={saveSiteSettings} disabled={savingSettings}
                className="flex-1 gradient-purple text-white font-bold py-2.5 rounded-xl hover:opacity-90 transition disabled:opacity-60 text-sm flex items-center justify-center gap-2">
                {savingSettings ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={14} />}
                {savingSettings ? "Сохранение..." : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ ZERO BLOCK EDITOR OVERLAY ═══ */}
      {zeroBlockEditId && (() => {
        const zBlock = blocks.find(b => b.id === zeroBlockEditId);
        if (!zBlock) return null;
        const zContent = (() => { try { return JSON.parse(zBlock.content || "{}"); } catch { return {}; } })();
        const zData = parseZeroData(zContent);

        const handleZeroSave = async (newData: ZeroBlockData) => {
          const serialized = serializeZeroData(newData);
          const merged = { ...zContent, ...serialized };
          setBlocks(prev => prev.map(b => b.id === zeroBlockEditId ? { ...b, content: JSON.stringify(merged) } : b));
          try {
            await sitesApi.updateBlock(siteId!, zeroBlockEditId, { content: JSON.stringify(merged) });
          } catch (err) {
            console.error("Failed to save Zero Block:", err);
          }
        };

        return (
          <ZeroBlockEditor
            key={zeroBlockEditId}
            data={zData}
            onChange={handleZeroSave}
            onClose={() => setZeroBlockEditId(null)}
            blockName={`Zero Block · ${zBlock.id.slice(0, 6)}`}
          />
        );
      })()}

      {/* ── AI Screenshot Import Modal ── */}
      {showAiImport && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && !aiAnalyzing && !aiImporting && setShowAiImport(false)}>
          <div className="bg-card border border-border/80 rounded-2xl p-6 w-full max-w-xl shadow-2xl shadow-black/60">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-foreground font-black text-xl flex items-center gap-2">
                  <Zap size={18} className="text-purple-400" /> AI из скриншота
                </h3>
                <p className="text-muted-foreground text-xs mt-1">Загрузите скриншот — AI заменит блоки на текущей странице</p>
              </div>
              <button onClick={() => setShowAiImport(false)} disabled={aiAnalyzing || aiImporting}
                className="text-muted-foreground hover:text-foreground transition p-1 rounded-lg hover:bg-white/5 disabled:opacity-40">
                <X size={18} />
              </button>
            </div>

            <input ref={aiInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAiFile(f); }} />

            {!aiResult ? (
              <>
                {aiPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-border mb-4" style={{ maxHeight: 240 }}>
                    <img src={aiPreview} alt="Screenshot" className="w-full object-contain" style={{ maxHeight: 240 }} />
                    <button onClick={() => { setAiFile(null); setAiPreview(""); }}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-lg p-1.5 transition">
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div onClick={() => aiInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f?.type.startsWith("image/")) handleAiFile(f); }}
                    className="border-2 border-dashed border-border hover:border-purple-500/50 rounded-xl p-10 text-center cursor-pointer transition-all hover:bg-purple-500/5 mb-4">
                    <Image size={36} className="mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-foreground font-semibold text-sm mb-1">Загрузите скриншот сайта</p>
                    <p className="text-muted-foreground text-xs">PNG, JPG, WebP · перетащите или нажмите</p>
                  </div>
                )}
                {aiError && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 text-red-400 text-xs mb-4">{aiError}</div>}
                <div className="flex gap-3">
                  <button onClick={() => setShowAiImport(false)}
                    className="flex-1 bg-secondary/60 text-foreground font-medium py-2.5 rounded-xl hover:bg-secondary transition text-sm">
                    Отмена
                  </button>
                  <button onClick={handleAiAnalyze} disabled={!aiFile || aiAnalyzing}
                    className="flex-1 gradient-purple text-white font-bold py-2.5 rounded-xl hover:opacity-90 transition disabled:opacity-40 text-sm flex items-center justify-center gap-2">
                    {aiAnalyzing ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Анализирую...</>
                    ) : (
                      <><Zap size={14} /> Анализировать AI</>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex gap-3 mb-4">
                  {aiPreview && <img src={aiPreview} alt="" className="w-20 h-14 object-cover rounded-lg border border-border flex-shrink-0" />}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs bg-green-500/15 text-green-400 border border-green-500/20 rounded-full px-2.5 py-0.5 font-medium">✓ Анализ готов</span>
                      <span className="text-xs text-muted-foreground">{aiResult.blocks.length} блоков</span>
                      <span className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full px-2.5 py-0.5">{aiResult.businessType}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {aiResult.blocks.map((b, i) => (
                        <span key={i} className="text-xs bg-secondary/60 text-muted-foreground border border-border rounded-lg px-2 py-0.5">{b.type}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl px-4 py-2.5 text-amber-400 text-xs mb-4">
                  ⚠ Текущие блоки на странице будут заменены новыми
                </div>
                {aiError && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 text-red-400 text-xs mb-4">{aiError}</div>}
                <div className="flex gap-3">
                  <button onClick={() => { setAiResult(null); setAiError(""); }}
                    className="flex-1 bg-secondary/60 text-foreground font-medium py-2.5 rounded-xl hover:bg-secondary transition text-sm">
                    ← Назад
                  </button>
                  <button onClick={handleAiImport} disabled={aiImporting}
                    className="flex-1 gradient-purple text-white font-bold py-2.5 rounded-xl hover:opacity-90 transition disabled:opacity-40 text-sm flex items-center justify-center gap-2">
                    {aiImporting ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Импортирую...</>
                    ) : "Заменить блоки →"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
