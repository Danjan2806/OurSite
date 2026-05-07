import { useLocation } from "wouter";
import { useAuthStore } from "@/lib/store";
import { LayoutDashboard, BookOpen, User, ChevronDown, Crown, Bell } from "@/lib/icons";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notifApi, type AppNotification } from "@/lib/api";
import {
  Info, Warning, CheckCircle, XCircle, ShieldCheck, Newspaper, Gear, CaretUp, CaretDown,
} from "@phosphor-icons/react";

const PUBLIC_NAV = [
  { label: "Главная", href: "/" },
  { label: "Возможности", href: "/#features" },
  { label: "Тарифы", href: "/pricing" },
  { label: "Документация", href: "/docs" },
];

const APP_NAV = [
  { label: "Дашборд", href: "/dashboard", icon: LayoutDashboard },
];

export default function AppHeader() {
  const [loc, nav] = useLocation();
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const navItems = user ? APP_NAV : PUBLIC_NAV;
  const qc = useQueryClient();

  // Item 8 fix: include userId in query keys so cache never bleeds between accounts
  const uid = user?.userId || "";

  const { data: unreadData } = useQuery({
    queryKey: ["notif-count", uid],
    queryFn: notifApi.unreadCount,
    enabled: !!uid,
    refetchInterval: 30000,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", uid],
    queryFn: notifApi.list,
    enabled: !!uid && notifOpen,
  });

  const readAllMutation = useMutation({
    mutationFn: notifApi.readAll,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notif-count", uid] });
      qc.invalidateQueries({ queryKey: ["notifications", uid] });
    },
  });

  const unreadCount = unreadData?.count || 0;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".notif-dropdown") && !target.closest(".notif-btn")) setNotifOpen(false);
      if (!target.closest(".user-menu-dropdown") && !target.closest(".user-menu-btn")) setMenuOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const handleNav = (href: string) => {
    if (href.startsWith("/#")) {
      nav("/");
      setTimeout(() => {
        const el = document.getElementById(href.slice(2));
        el?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      nav(href);
    }
  };

  const NOTIF_CONFIG: Record<string, { icon: React.ElementType; iconBg: string; iconColor: string; badgeBg: string; badgeText: string; label: string }> = {
    info:       { icon: Info,        iconBg: "bg-blue-500/15",   iconColor: "text-blue-400",   badgeBg: "bg-blue-500/10",   badgeText: "text-blue-400",   label: "Информация" },
    warning:    { icon: Warning,     iconBg: "bg-amber-500/15",  iconColor: "text-amber-400",  badgeBg: "bg-amber-500/10",  badgeText: "text-amber-400",  label: "Предупреждение" },
    success:    { icon: CheckCircle, iconBg: "bg-green-500/15",  iconColor: "text-green-400",  badgeBg: "bg-green-500/10",  badgeText: "text-green-400",  label: "Успех" },
    error:      { icon: XCircle,     iconBg: "bg-red-500/15",    iconColor: "text-red-400",    badgeBg: "bg-red-500/10",    badgeText: "text-red-400",    label: "Ошибка" },
    moderation: { icon: ShieldCheck, iconBg: "bg-purple-500/15", iconColor: "text-purple-400", badgeBg: "bg-purple-500/10", badgeText: "text-purple-400", label: "Модерация" },
    news:       { icon: Newspaper,   iconBg: "bg-violet-500/15", iconColor: "text-violet-400", badgeBg: "bg-violet-500/10", badgeText: "text-violet-400", label: "Новость" },
    system:     { icon: Gear,        iconBg: "bg-white/8",       iconColor: "text-muted-foreground", badgeBg: "bg-white/8", badgeText: "text-muted-foreground", label: "Системное" },
  };

  const markRead = (n: AppNotification) => {
    if (!n.read) {
      notifApi.markRead(n.id);
      qc.invalidateQueries({ queryKey: ["notif-count", uid] });
      qc.invalidateQueries({ queryKey: ["notifications", uid] });
    }
  };

  const CHAT_NOTIF_TITLES = ["Ответ от поддержки", "Новое сообщение в поддержке", "Новое обращение в поддержку"];
  const getChatLink = (n: AppNotification): string | null => {
    if (!CHAT_NOTIF_TITLES.some(t => n.title.includes(t))) return null;
    if (user?.role === "admin" || user?.role === "moderator") return "/admin?tab=chat";
    return "/profile?section=messages";
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/8 backdrop-blur-xl bg-background/80">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <button onClick={() => nav(user ? "/dashboard" : "/")} className="flex items-center gap-2.5 group flex-shrink-0">
          <span className="text-foreground font-bold text-lg tracking-tight group-hover:opacity-80 transition">lilluu<span className="text-primary">core</span></span>
        </button>

        <nav className="hidden md:flex items-center gap-0.5">
          {navItems.map((item) => {
            const isActive = 'href' in item && loc === item.href;
            return (
              <button
                key={item.href}
                onClick={() => handleNav(item.href)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary/12 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* Notifications bell */}
              <div className="relative">
                <button onClick={() => { setNotifOpen(!notifOpen); setMenuOpen(false); }}
                  className="notif-btn relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition">
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
                  )}
                </button>
                {notifOpen && (
                  <div className="notif-dropdown absolute top-full right-0 mt-2 w-96 user-dropdown-menu border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[9999]">
                    <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
                      <p className="text-foreground font-bold text-sm">Уведомления</p>
                      {unreadCount > 0 && (
                        <button onClick={() => readAllMutation.mutate()} className="text-xs text-primary hover:underline">
                          Прочитать все
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <div className="text-3xl mb-2">🔔</div>
                          <p className="text-muted-foreground text-sm">Нет уведомлений</p>
                        </div>
                      ) : (
                        notifications.map((n: AppNotification, idx: number) => {
                          const isExpanded = expandedId === n.id;
                          const cfg = NOTIF_CONFIG[n.type] || NOTIF_CONFIG.info;
                          const IconComp = cfg.icon;
                          const date = new Date(n.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
                          const hasMore = n.message.length > 80;
                          return (
                            <div key={n.id}>
                              {idx > 0 && <div className="mx-3 h-px bg-white/8" />}
                              <div
                                className={`relative px-4 py-3.5 cursor-pointer select-none transition-all hover:bg-white/4 ${!n.read ? "bg-primary/6" : ""}`}
                                onClick={() => { setExpandedId(isExpanded ? null : n.id); markRead(n); }}
                              >
                                {!n.read && <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-primary" />}
                                <div className="flex items-start gap-3">
                                  {/* Coloured icon */}
                                  <div className={`w-8 h-8 rounded-lg ${cfg.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                    <IconComp size={15} weight="duotone" className={cfg.iconColor} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    {/* Title row */}
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className={`text-sm font-semibold flex-1 min-w-0 truncate ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</p>
                                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${cfg.badgeBg} ${cfg.badgeText}`}>{cfg.label}</span>
                                    </div>
                                    {/* Message */}
                                    <p className={`text-xs text-muted-foreground leading-relaxed ${isExpanded ? "" : "line-clamp-2"}`}>{n.message}</p>
                                    {/* Footer */}
                                    <div className="flex items-center justify-between mt-1.5">
                                      <p className="text-[10px] text-muted-foreground/40">{date}</p>
                                      <div className="flex items-center gap-2">
                                        {getChatLink(n) && (
                                          <button
                                            onClick={(e) => { e.stopPropagation(); markRead(n); nav(getChatLink(n)!); setNotifOpen(false); }}
                                            className={`flex items-center gap-0.5 text-[10px] font-semibold ${cfg.badgeText} hover:underline`}
                                          >
                                            Перейти в чат →
                                          </button>
                                        )}
                                        {hasMore && (
                                          <span className={`flex items-center gap-0.5 text-[10px] font-medium ${cfg.badgeText}`}>
                                            {isExpanded ? <><CaretUp size={10} />Свернуть</> : <><CaretDown size={10} />Читать</>}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-2" />}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User menu */}
              <div className="relative">
                <button onClick={() => { setMenuOpen(!menuOpen); setNotifOpen(false); }}
                  className="user-menu-btn flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/8 hover:bg-white/5 transition text-sm">
                  <div className="w-6 h-6 rounded-md overflow-hidden flex-shrink-0">
                    {user.avatarUrl
                      ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full gradient-purple flex items-center justify-center text-white text-xs font-bold avatar-letter">{user.firstName[0]}</div>
                    }
                  </div>
                  <span className="hidden md:inline text-foreground font-medium">{user.firstName}</span>
                  <ChevronDown size={13} className="text-muted-foreground" />
                </button>
                {menuOpen && (
                  <div className="user-menu-dropdown absolute top-full right-0 mt-2 w-48 user-dropdown-menu border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[9999]">
                    <div className="px-3 py-2.5 border-b border-white/8">
                      <p className="text-foreground font-semibold text-sm">{user.firstName} {user.lastName}</p>
                      <p className="text-muted-foreground text-xs truncate">{user.email}</p>
                    </div>
                    <button onClick={() => { nav("/profile"); setMenuOpen(false); }}
                      className="w-full text-left px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition flex items-center gap-2">
                      <User size={14} />Настройки профиля
                    </button>
                    <button onClick={() => { nav("/privacy"); setMenuOpen(false); }}
                      className="w-full text-left px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition flex items-center gap-2">
                      <BookOpen size={14} />Соглашение
                    </button>
                    {(user.role === "admin" || user.role === "moderator") && (
                      <button onClick={() => { nav("/admin"); setMenuOpen(false); }}
                        className="w-full text-left px-3 py-2.5 text-sm text-amber-400 hover:bg-amber-500/8 transition flex items-center gap-2">
                        <Crown size={14} />{user.role === "admin" ? "Админ-панель" : "Модерация"}
                      </button>
                    )}
                    <div className="border-t border-white/8">
                      <button onClick={() => { logout(); nav("/"); setMenuOpen(false); }}
                        className="w-full text-left px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/8 transition">
                        Выйти из аккаунта
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button onClick={() => nav("/auth")} className="text-sm text-muted-foreground hover:text-foreground transition px-4 py-2 rounded-lg">
                Войти
              </button>
              <button onClick={() => nav("/auth")}
                className="gradient-purple text-white text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition shadow-lg shadow-purple-500/20">
                Начать бесплатно
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
