import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { adminApi, chatApi, AdminUser, AdminSite, AdminStats, SystemInfo, type AppNotification, type ChatMessage, type ChatConversation } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import {
  Users, Globe, BarChart2, Shield, Trash2, Edit2, Search, RefreshCw,
  Database, Server, Activity, Crown, Package, X,
  AlertTriangle, CheckCircle, ArrowLeft, LayoutDashboard, MessageSquare,
} from "@/lib/icons";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import {
  Snowflake, Lock, LockOpen,
  Info as InfoIcon, Warning as WarningIcon,
  ShieldCheck as ShieldCheckP, CheckCircle as CheckCircleP, XCircle as XCircleP,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";

const PLAN_COLORS: Record<string, string> = {
  free: "text-gray-400 bg-gray-400/10 border-gray-400/20",
  pro: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  business: "text-amber-400 bg-amber-400/10 border-amber-400/20",
};

const PLAN_LABELS: Record<string, string> = { free: "Free", pro: "Pro", business: "Business" };
const BT_LABELS: Record<string, string> = { LANDING: "Лендинг", ECOMMERCE: "Магазин", MUSIC_LABEL: "Лейбл", FITNESS: "Фитнес" };
const STATUS_COLORS: Record<string, string> = {
  PUBLISHED: "text-green-400 bg-green-400/10 border-green-400/20",
  DRAFT: "text-gray-400 bg-gray-400/10 border-gray-400/20",
};

function StatCard({ icon: Icon, label, value, sub, color = "primary" }: any) {
  const colorMap: Record<string, string> = {
    primary: "from-violet-500/20 to-violet-500/5 border-violet-500/20",
    green: "from-green-500/20 to-green-500/5 border-green-500/20",
    blue: "from-blue-500/20 to-blue-500/5 border-blue-500/20",
    amber: "from-amber-500/20 to-amber-500/5 border-amber-500/20",
    red: "from-red-500/20 to-red-500/5 border-red-500/20",
  };
  const iconColorMap: Record<string, string> = {
    primary: "text-violet-400", green: "text-green-400", blue: "text-blue-400", amber: "text-amber-400", red: "text-red-400",
  };
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-5 ${colorMap[color]}`}>
      <div className="flex items-start justify-between mb-3">
        <Icon size={20} className={iconColorMap[color]} />
      </div>
      <p className="text-3xl font-black text-foreground mb-0.5">{value}</p>
      <p className="text-sm font-semibold text-foreground/80">{label}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────
function OverviewTab({ stats }: { stats: AdminStats }) {
  return (
    <div className="space-y-6">
      {/* Platform pages quick-access */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="text-sm font-bold text-foreground mb-3">Системные страницы</h3>
        <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white/3 border border-white/6 hover:border-white/12 transition group">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-purple-500/12 flex items-center justify-center text-xs font-bold text-purple-400">404</div>
            <div>
              <p className="text-sm font-medium text-foreground">Страница 404</p>
              <p className="text-xs text-muted-foreground">Показывается при переходе на несуществующий URL</p>
            </div>
          </div>
          <a href="/404" target="_blank" rel="noreferrer"
            className="text-xs text-muted-foreground hover:text-primary border border-white/10 hover:border-primary/40 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5">
            Открыть ↗
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Пользователей" value={stats.totalUsers} sub={`${stats.adminUsers} админов`} color="primary" />
        <StatCard icon={Globe} label="Сайтов" value={stats.totalSites} sub={`${stats.publishedSites} опубликовано`} color="green" />
        <StatCard icon={Package} label="Блоков создано" value={stats.totalBlocks} color="blue" />
        <StatCard icon={Activity} label="Черновиков" value={stats.draftSites} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration chart */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">Регистрации за 7 дней</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.registrationChart} margin={{ left: -20, right: 8, top: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6b7280" }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 8, color: "#e2e8f0", fontSize: 12 }} />
              <Bar dataKey="registrations" fill="#7C3AED" radius={[4, 4, 0, 0]} name="Регистрации" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribution */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-foreground">Распределение</h3>
          <div>
            <p className="text-xs text-muted-foreground font-semibold mb-2 uppercase tracking-wider">Тип бизнеса</p>
            <div className="space-y-2">
              {Object.entries(stats.sitesByType).map(([t, n]) => (
                <div key={t} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-20">{BT_LABELS[t] || t}</span>
                  <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${Math.round(n / stats.totalSites * 100)}%` }} />
                  </div>
                  <span className="text-xs font-bold text-foreground w-6 text-right">{n}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold mb-2 uppercase tracking-wider">Тарифные планы</p>
            <div className="space-y-2">
              {Object.entries(stats.usersByPlan).map(([p, n]) => (
                <div key={p} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-20 capitalize">{PLAN_LABELS[p] || p}</span>
                  <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.round(n / stats.totalUsers * 100)}%` }} />
                  </div>
                  <span className="text-xs font-bold text-foreground w-6 text-right">{n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Users Tab ───────────────────────────────────────────────────────
function UsersTab({ users, onRefresh }: { users: AdminUser[]; onRefresh: () => void }) {
  const [search, setSearch] = useState("");
  const [searchMode, setSearchMode] = useState<"all" | "email" | "id">("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editPlan, setEditPlan] = useState("free");
  const [editRole, setEditRole] = useState("user");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = users.filter(u => {
    const q = search.toLowerCase().trim();
    let matchSearch = true;
    if (q) {
      if (searchMode === "email") matchSearch = u.email.toLowerCase().includes(q);
      else if (searchMode === "id") matchSearch = u.id.toLowerCase().includes(q);
      else matchSearch = u.email.toLowerCase().includes(q) || `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) || u.id.toLowerCase().includes(q);
    }
    const matchPlan = planFilter === "all" || u.plan === planFilter;
    return matchSearch && matchPlan;
  });

  const openEdit = (u: AdminUser) => { setEditUser(u); setEditPlan(u.plan); setEditRole(u.role); };

  const saveEdit = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      await adminApi.updateUser(editUser.id, { plan: editPlan, role: editRole });
      onRefresh(); setEditUser(null);
    } finally { setSaving(false); }
  };

  const doDelete = async (id: string) => {
    await adminApi.deleteUser(id);
    onRefresh(); setConfirmDelete(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={searchMode === "email" ? "Поиск по email..." : searchMode === "id" ? "Поиск по ID в базе данных..." : "Поиск по email, имени или ID..."}
            className="w-full pl-9 pr-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary" />
        </div>
        <select value={searchMode} onChange={e => setSearchMode(e.target.value as any)}
          className="px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary">
          <option value="all">Все поля</option>
          <option value="email">По email</option>
          <option value="id">По ID</option>
        </select>
        <select value={planFilter} onChange={e => setPlanFilter(e.target.value)}
          className="px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary">
          <option value="all">Все планы</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="business">Business</option>
        </select>
        <button onClick={onRefresh} className="flex items-center gap-2 px-4 py-2.5 bg-secondary border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground transition">
          <RefreshCw size={14} /> Обновить
        </button>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">Всего: {filtered.length} из {users.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Пользователь</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">План</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Роль</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Сайтов</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Регистрация</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-border/50 hover:bg-white/2 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {u.avatarUrl
                        ? <img src={u.avatarUrl} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                        : <div className="w-8 h-8 rounded-full gradient-purple flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {u.firstName[0]}{u.lastName[0]}
                          </div>
                      }
                      <div>
                        <p className="text-sm font-semibold text-foreground leading-tight">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${PLAN_COLORS[u.plan] || "text-gray-400"}`}>
                      {PLAN_LABELS[u.plan] || u.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.role === "admin"
                      ? <span className="flex items-center gap-1 text-xs text-amber-400 font-semibold"><Crown size={11} /> Admin</span>
                      : u.role === "moderator"
                      ? <span className="flex items-center gap-1 text-xs text-blue-400 font-semibold"><Shield size={11} /> Модератор</span>
                      : <span className="text-xs text-muted-foreground">User</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-foreground">{u.sitesCount}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString("ru-RU")}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => setConfirmDelete(u.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-foreground">Изменить пользователя</h3>
              <button onClick={() => setEditUser(null)} className="p-1 text-muted-foreground hover:text-foreground"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{editUser.email}</p>
                <p className="text-sm font-semibold text-foreground">{editUser.firstName} {editUser.lastName}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium block mb-1">Тарифный план</label>
                <select value={editPlan} onChange={e => setEditPlan(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary">
                  <option value="free">Free — 1 сайт, 5 блоков</option>
                  <option value="pro">Pro — 10 сайтов, безлимит блоков</option>
                  <option value="business">Business — безлимит всего</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium block mb-1">Роль</label>
                <select value={editRole} onChange={e => setEditRole(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary">
                  <option value="user">User — обычный пользователь</option>
                  <option value="moderator">Moderator — модерация контента</option>
                  <option value="admin">Admin — полные права</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setEditUser(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition">Отмена</button>
                <button onClick={saveEdit} disabled={saving} className="flex-1 py-2.5 rounded-xl gradient-purple text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50">
                  {saving ? "Сохранение..." : "Сохранить"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-red-500/20 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={20} className="text-red-400" />
              <h3 className="font-bold text-foreground">Удалить пользователя?</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-5">Все сайты и данные пользователя будут удалены безвозвратно.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition">Отмена</button>
              <button onClick={() => doDelete(confirmDelete)} className="flex-1 py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/25 transition">
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sites Tab ───────────────────────────────────────────────────────
function SitesTab({ sites, onRefresh }: { sites: AdminSite[]; onRefresh: () => void }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [btFilter, setBtFilter] = useState("all");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [freezeModal, setFreezeModal] = useState<AdminSite | null>(null);
  const [freezeReason, setFreezeReason] = useState("Нарушение пользовательского соглашения");
  const [freezing, setFreezing] = useState(false);

  const FREEZE_REASONS = [
    "Нарушение пользовательского соглашения",
    "Запрещённый контент",
    "Жалобы от пользователей",
    "Решение суда или государственного органа",
    "Нарушение авторских прав",
    "Фишинг или мошенничество",
    "Временная приостановка по требованию владельца",
  ];

  const filtered = sites.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.owner?.email.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || s.status === statusFilter || (statusFilter === "FROZEN" && s.frozen);
    const matchBt = btFilter === "all" || s.businessType === btFilter;
    return matchSearch && matchStatus && matchBt;
  });

  const doDelete = async (id: string) => {
    await adminApi.deleteSite(id, deleteReason.trim() || undefined);
    onRefresh(); setConfirmDelete(null); setDeleteReason("");
  };

  const doFreeze = async (frozen: boolean) => {
    if (!freezeModal) return;
    setFreezing(true);
    try {
      await adminApi.freezeSite(freezeModal.id, frozen, frozen ? freezeReason : undefined);
      onRefresh();
      setFreezeModal(null);
      setFreezeReason("Нарушение пользовательского соглашения");
    } finally { setFreezing(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по названию или владельцу..."
            className="w-full pl-9 pr-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary">
          <option value="all">Все статусы</option>
          <option value="PUBLISHED">Опубликованные</option>
          <option value="DRAFT">Черновики</option>
          <option value="FROZEN">Заморожены</option>
        </select>
        <select value={btFilter} onChange={e => setBtFilter(e.target.value)}
          className="px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary">
          <option value="all">Все типы</option>
          {Object.entries(BT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button onClick={onRefresh} className="flex items-center gap-2 px-4 py-2.5 bg-secondary border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground transition">
          <RefreshCw size={14} /> Обновить
        </button>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-3">
          <span className="text-sm font-semibold text-foreground">Всего: {filtered.length} из {sites.length}</span>
          {sites.filter(s => s.frozen).length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 font-semibold flex items-center gap-1">
              <Snowflake size={10} weight="duotone" /> Заморожено: {sites.filter(s => s.frozen).length}
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Сайт</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Тип</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Статус</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Блоков</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Владелец</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Обновлён</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className={`border-b border-border/50 hover:bg-white/2 transition ${s.frozen ? "bg-blue-500/3" : ""}`}>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">{s.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{s.subdomain}</p>
                    {s.frozen && s.frozenReason && (
                      <p className="text-xs text-blue-400 mt-0.5 flex items-center gap-1"><Snowflake size={10} weight="duotone" /> {s.frozenReason}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted-foreground">{BT_LABELS[s.businessType] || s.businessType}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold w-fit ${STATUS_COLORS[s.status] || "text-gray-400"}`}>
                        {s.status === "PUBLISHED" ? "✓ Опубликован" : "• Черновик"}
                      </span>
                      {s.frozen && (
                        <span className="text-xs px-2 py-0.5 rounded-full border font-semibold w-fit text-blue-400 bg-blue-400/10 border-blue-400/20 flex items-center gap-1">
                          <Snowflake size={9} weight="duotone" /> Заморожен
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-foreground">{s.blocksCount}</span>
                  </td>
                  <td className="px-4 py-3">
                    {s.owner
                      ? <div>
                          <p className="text-xs font-semibold text-foreground">{s.owner.firstName} {s.owner.lastName}</p>
                          <p className="text-xs text-muted-foreground">{s.owner.email}</p>
                        </div>
                      : <span className="text-xs text-muted-foreground">—</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted-foreground">{new Date(s.updatedAt).toLocaleDateString("ru-RU")}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setFreezeModal(s); setFreezeReason(s.frozenReason || "Нарушение пользовательского соглашения"); }}
                        title={s.frozen ? "Разморозить" : "Заморозить"}
                        className={`p-1.5 rounded-lg transition ${s.frozen ? "text-blue-400 bg-blue-500/10 hover:bg-blue-500/20" : "text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10"}`}>
                        {s.frozen ? <LockOpen size={13} weight="light" /> : <Snowflake size={13} weight="duotone" />}
                      </button>
                      <button onClick={() => setConfirmDelete(s.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-red-500/20 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={20} className="text-red-400" />
              <h3 className="font-bold text-foreground">Удалить сайт?</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Все блоки и страницы сайта будут удалены безвозвратно. Владельцу придёт уведомление.</p>
            <div className="mb-4">
              <label className="text-xs text-muted-foreground font-medium block mb-1">Причина удаления (необязательно)</label>
              <textarea value={deleteReason} onChange={e => setDeleteReason(e.target.value)} rows={2}
                placeholder="Укажите причину удаления для уведомления владельцу..."
                className="w-full px-3 py-2 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-red-500/50 resize-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setConfirmDelete(null); setDeleteReason(""); }} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground transition">Отмена</button>
              <button onClick={() => doDelete(confirmDelete)} className="flex-1 py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/25 transition">
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Freeze / unfreeze modal */}
      {freezeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-blue-500/20 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${freezeModal.frozen ? "bg-green-500/15 border border-green-500/30" : "bg-blue-500/15 border border-blue-500/30"}`}>
                {freezeModal.frozen ? <LockOpen size={20} weight="light" className="text-green-400" /> : <Snowflake size={20} weight="duotone" className="text-blue-400" />}
              </div>
              <div>
                <h3 className="font-bold text-foreground">{freezeModal.frozen ? "Разморозить сайт?" : "Заморозить сайт?"}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">«{freezeModal.name}» · {freezeModal.owner?.email}</p>
              </div>
            </div>

            {!freezeModal.frozen ? (
              <>
                <p className="text-sm text-muted-foreground mb-4">Сайт станет недоступен для посетителей. Владелец получит уведомление с указанной причиной.</p>
                <div className="mb-3">
                  <label className="text-xs text-muted-foreground font-medium block mb-1.5">Причина заморозки</label>
                  <input value={freezeReason} onChange={e => setFreezeReason(e.target.value)}
                    className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-blue-500/50"
                    placeholder="Укажите причину..." />
                </div>
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground font-medium mb-2">Быстрые причины:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {FREEZE_REASONS.map(r => (
                      <button key={r} onClick={() => setFreezeReason(r)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition ${freezeReason === r ? "border-blue-500/50 bg-blue-500/10 text-blue-400" : "border-border text-muted-foreground hover:text-foreground hover:border-border/60"}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setFreezeModal(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground transition">Отмена</button>
                  <button onClick={() => doFreeze(true)} disabled={freezing || !freezeReason.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 text-sm font-semibold hover:bg-blue-500/25 transition disabled:opacity-40">
                    {freezing ? "..." : <><Snowflake size={13} weight="duotone" className="inline mr-1" />Заморозить</>}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-2">Текущая причина заморозки:</p>
                <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-3 mb-4">
                  <p className="text-blue-400 text-sm">{freezeModal.frozenReason || "Нарушение пользовательского соглашения"}</p>
                  {freezeModal.frozenAt && <p className="text-blue-400/50 text-xs mt-1">Заморожен: {new Date(freezeModal.frozenAt).toLocaleDateString("ru-RU")}</p>}
                </div>
                <p className="text-sm text-muted-foreground mb-4">Сайт снова станет доступен для посетителей. Владелец получит уведомление.</p>
                <div className="flex gap-2">
                  <button onClick={() => setFreezeModal(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground transition">Отмена</button>
                  <button onClick={() => doFreeze(false)} disabled={freezing}
                    className="flex-1 py-2.5 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 text-sm font-semibold hover:bg-green-500/25 transition disabled:opacity-40">
                    {freezing ? "..." : <><LockOpen size={13} weight="light" className="inline mr-1" />Разморозить</>}
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

// ─── DB Dump Management Tab ──────────────────────────────────────────
function DbDumpTab({ users, onRefresh }: { users: AdminUser[]; onRefresh: () => void }) {
  const [lockUserId, setLockUserId] = useState("");
  const [lockReason, setLockReason] = useState("Временные технические работы");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState("");
  const [bulkMode, setBulkMode] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  const filteredUsers = users.filter(u =>
    userSearch.trim() === "" ||
    u.id.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const lockUser = async (lock: boolean) => {
    if (!bulkMode && !lockUserId) return;
    setSending(true); setResult("");
    try {
      if (bulkMode) {
        const r = await adminApi.lockAllDb(lock, lockReason.trim() || undefined);
        setResult(lock ? `Дамп памяти заблокирован для ${r.affected} пользователей` : `Дамп памяти разблокирован для ${r.affected} пользователей`);
      } else {
        await adminApi.lockUserDb(lockUserId, lock, lockReason.trim() || undefined);
        setResult(lock ? "Дамп памяти заблокирован" : "Дамп памяти разблокирован");
      }
      onRefresh();
      setTimeout(() => setResult(""), 4000);
    } catch (e: any) {
      setResult(e.response?.data?.message || "Ошибка");
    } finally { setSending(false); }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="text-lg font-bold text-foreground mb-1">Управление дампом памяти</h3>
        <p className="text-sm text-muted-foreground mb-5">Временное отключение доступа к данным пользователей</p>

        <div className="space-y-4">
          <div className="flex gap-2">
            <button onClick={() => setBulkMode(false)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition border ${!bulkMode ? "gradient-purple text-white border-transparent" : "border-border text-muted-foreground hover:text-foreground"}`}>
              Одному пользователю
            </button>
            <button onClick={() => setBulkMode(true)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition border ${bulkMode ? "gradient-purple text-white border-transparent" : "border-border text-muted-foreground hover:text-foreground"}`}>
              Всем пользователям
            </button>
          </div>

          {!bulkMode && (
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-medium block mb-1">Пользователь</label>
              <input
                value={userSearch}
                onChange={e => { setUserSearch(e.target.value); setLockUserId(""); }}
                className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary"
                placeholder="Поиск по ID или email..."
              />
              <select value={lockUserId} onChange={e => setLockUserId(e.target.value)}
                className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary">
                <option value="">Выберите пользователя...</option>
                {filteredUsers.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email}) — {u.id}</option>)}
              </select>
              {userSearch.trim() !== "" && (
                <p className="text-xs text-muted-foreground">Найдено: {filteredUsers.length} из {users.length}</p>
              )}
            </div>
          )}

          <div>
            <label className="text-xs text-muted-foreground font-medium block mb-1">Причина</label>
            <input value={lockReason} onChange={e => setLockReason(e.target.value)}
              className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary"
              placeholder="Временные технические работы" />
          </div>

          {result && <p className={`text-sm ${result.includes("Ошибка") ? "text-red-400" : "text-green-400"}`}>✓ {result}</p>}

          <div className="flex gap-2">
            <button onClick={() => lockUser(true)} disabled={sending || (!bulkMode && !lockUserId)}
              className="flex-1 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-sm font-semibold hover:bg-amber-500/25 transition disabled:opacity-40">
              {sending ? "..." : <><Lock size={13} weight="light" className="inline mr-1" />Заблокировать</>}
            </button>
            <button onClick={() => lockUser(false)} disabled={sending || (!bulkMode && !lockUserId)}
              className="flex-1 py-2.5 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 text-sm font-semibold hover:bg-green-500/25 transition disabled:opacity-40">
              {sending ? "..." : <><LockOpen size={13} weight="light" className="inline mr-1" />Разблокировать</>}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="text-sm font-bold text-foreground mb-3">Шаблоны причин</h3>
        <div className="space-y-2">
          {[
            "Временные технические работы",
            "Обновление базы данных",
            "Превышение лимита хранилища",
            "Нарушение правил использования",
          ].map(r => (
            <button key={r} onClick={() => setLockReason(r)}
              className="w-full text-left p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition">
              <p className="text-sm text-foreground">{r}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── System Tab ──────────────────────────────────────────────────────
function SystemTab({ info }: { info: SystemInfo }) {
  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60);
    return `${h}ч ${m}м`;
  };

  const dbPercent = Math.round((info.dbSizeBytes / (512 * 1024 * 1024)) * 100);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3"><Database size={16} className="text-violet-400" /><span className="text-sm font-semibold text-foreground">База данных</span></div>
          <p className="text-2xl font-black text-foreground mb-1">{info.dbSizePretty}</p>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Использовано</span><span>{dbPercent}%</span>
            </div>
            <div className="bg-white/5 rounded-full h-2 overflow-hidden">
              <div className="bg-violet-500 h-full rounded-full transition-all" style={{ width: `${Math.min(dbPercent, 100)}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">из 512 MB</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3"><Server size={16} className="text-green-400" /><span className="text-sm font-semibold text-foreground">Сервер</span></div>
          <div className="space-y-2">
            {[
              ["Node.js", info.nodeVersion],
              ["Платформа", info.platform],
              ["Среда", info.env],
              ["Аптайм", formatUptime(info.uptime)],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{l}</span>
                <span className="text-foreground font-mono font-semibold">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3"><Activity size={16} className="text-blue-400" /><span className="text-sm font-semibold text-foreground">Память</span></div>
          <p className="text-2xl font-black text-foreground mb-1">{info.memoryMb} MB</p>
          <div className="mt-3">
            <div className="bg-white/5 rounded-full h-2 overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(info.memoryMb / 5, 100)}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">RSS память процесса</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle size={16} className="text-green-400" />
          <span className="text-sm font-semibold text-foreground">Статус системы</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "API сервер", status: "operational", icon: CheckCircle },
            { label: "База данных", status: "operational", icon: CheckCircle },
            { label: "Авторизация", status: "operational", icon: CheckCircle },
          ].map(({ label, status, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 p-3 bg-green-500/5 border border-green-500/15 rounded-xl">
              <Icon size={14} className="text-green-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">{label}</p>
                <p className="text-xs text-green-400 capitalize">{status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Notifications Tab ────────────────────────────────────────────────
function NotificationsTab({ users }: { users: AdminUser[] }) {
  const [targetUserId, setTargetUserId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [notifType, setNotifType] = useState("info");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [broadcastMode, setBroadcastMode] = useState(false);
  const [error, setError] = useState("");
  const [userSearch, setUserSearch] = useState("");

  const filteredUsers = users.filter(u =>
    userSearch.trim() === "" ||
    u.id.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const NOTIF_TYPES: { value: string; label: string; Icon: PhosphorIcon }[] = [
    { value: "info",       label: "Информация",     Icon: InfoIcon      },
    { value: "warning",    label: "Предупреждение", Icon: WarningIcon   },
    { value: "moderation", label: "Модерация",      Icon: ShieldCheckP  },
    { value: "success",    label: "Успех",           Icon: CheckCircleP  },
    { value: "error",      label: "Ошибка",          Icon: XCircleP      },
  ];

  const TEMPLATES = [
    { title: "Нарушение контента", message: "Обнаружено нарушение Пользовательского соглашения на вашем сайте. Просим устранить нарушение в течение 3 рабочих дней, иначе сайт может быть заблокирован.", type: "moderation" },
    { title: "Предупреждение модерации", message: "Ваш контент находится на проверке модератором. Это стандартная процедура, никаких действий от вас не требуется.", type: "warning" },
    { title: "Сайт заблокирован", message: "Ваш сайт был заблокирован в связи с нарушением Пользовательского соглашения. Для разблокировки свяжитесь с support@lilluucore.com.", type: "error" },
    { title: "Техническое обслуживание", message: "Плановые технические работы запланированы. Сервис может быть временно недоступен.", type: "info" },
  ];

  const send = async () => {
    if (!title.trim() || !message.trim()) { setError("Заполните заголовок и сообщение"); return; }
    if (!broadcastMode && !targetUserId) { setError("Выберите пользователя"); return; }
    setSending(true); setError("");
    try {
      if (broadcastMode) {
        await adminApi.broadcastNotification({ title, message, type: notifType });
      } else {
        await adminApi.sendNotification({ userId: targetUserId, title, message, type: notifType });
      }
      setSent(true);
      setTimeout(() => setSent(false), 3000);
      setTitle(""); setMessage("");
    } catch (e: any) {
      setError(e.response?.data?.message || "Ошибка отправки");
    } finally { setSending(false); }
  };

  const applyTemplate = (t: typeof TEMPLATES[0]) => {
    setTitle(t.title); setMessage(t.message); setNotifType(t.type);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">Отправить уведомление</h3>

          <div className="space-y-4">
            <div className="flex gap-2">
              <button onClick={() => setBroadcastMode(false)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition border ${!broadcastMode ? "gradient-purple text-white border-transparent" : "border-border text-muted-foreground hover:text-foreground"}`}>
                Одному пользователю
              </button>
              <button onClick={() => setBroadcastMode(true)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition border ${broadcastMode ? "gradient-purple text-white border-transparent" : "border-border text-muted-foreground hover:text-foreground"}`}>
                Всем пользователям
              </button>
            </div>

            {!broadcastMode && (
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium block mb-1">Пользователь</label>
                <input
                  value={userSearch}
                  onChange={e => { setUserSearch(e.target.value); setTargetUserId(""); }}
                  className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary"
                  placeholder="Поиск по ID или email..."
                />
                <select value={targetUserId} onChange={e => setTargetUserId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary">
                  <option value="">Выберите пользователя...</option>
                  {filteredUsers.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email}) — {u.id}</option>)}
                </select>
                {userSearch.trim() !== "" && (
                  <p className="text-xs text-muted-foreground">Найдено: {filteredUsers.length} из {users.length}</p>
                )}
              </div>
            )}

            <div>
              <label className="text-xs text-muted-foreground font-medium block mb-1">Тип уведомления</label>
              <div className="flex gap-2 flex-wrap">
                {NOTIF_TYPES.map(t => (
                  <button key={t.value} onClick={() => setNotifType(t.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${notifType === t.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
                    <t.Icon size={13} weight="duotone" /> {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-medium block mb-1">Заголовок</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary"
                placeholder="Заголовок уведомления" />
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-medium block mb-1">Сообщение</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
                className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary resize-none"
                placeholder="Текст уведомления..." />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}
            {sent && <p className="text-green-400 text-sm">✓ Уведомление отправлено!</p>}

            <button onClick={send} disabled={sending}
              className="w-full gradient-purple text-white font-bold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50 text-sm">
              {sending ? "Отправляю..." : broadcastMode ? "Отправить всем пользователям" : "Отправить"}
            </button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-sm font-bold text-foreground mb-3">Быстрые шаблоны</h3>
          <div className="space-y-2">
            {TEMPLATES.map((t, i) => (
              <button key={i} onClick={() => applyTemplate(t)}
                className="w-full text-left p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition">
                <p className="text-sm font-semibold text-foreground mb-0.5">{t.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{t.message}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Moderator Chat Tab ────────────────────────────────────────────────
function ChatTab() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = async () => {
    try {
      const data = await chatApi.getConversations();
      setConversations(data);
    } catch { /* ignore */ }
    finally { setLoadingConvs(false); }
  };

  useEffect(() => {
    loadConversations();
    const timer = setInterval(loadConversations, 8000);
    return () => clearInterval(timer);
  }, []);

  const openConversation = async (conv: ChatConversation) => {
    setSelectedUser(conv);
    setLoadingMsgs(true);
    try {
      const msgs = await chatApi.getMessages(conv.id);
      setMessages(msgs);
      setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread: 0 } : c));
    } catch { /* ignore */ }
    finally { setLoadingMsgs(false); }
  };

  // Auto-refresh messages in open conversation every 5 seconds
  useEffect(() => {
    if (!selectedUser) return;
    const poll = setInterval(async () => {
      try {
        const msgs = await chatApi.getMessages(selectedUser.id);
        setMessages(msgs);
      } catch { /* ignore */ }
    }, 5000);
    return () => clearInterval(poll);
  }, [selectedUser?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMsg.trim() || !selectedUser) return;
    setSending(true);
    try {
      const msg = await chatApi.sendMessage(selectedUser.id, newMsg.trim());
      setMessages(prev => [...prev, msg]);
      setNewMsg("");
    } catch { /* ignore */ }
    finally { setSending(false); }
  };

  const filtered = conversations.filter(c => {
    const q = search.toLowerCase();
    return (
      `${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(q) ||
      (c.ticketId?.toLowerCase().includes(q)) ||
      (c.shortUserId?.toLowerCase().includes(q))
    );
  });

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread || 0), 0);

  return (
    <div className="glass border border-white/8 rounded-2xl overflow-hidden" style={{ height: "calc(100vh - 200px)", minHeight: 500 }}>
      <div className="flex h-full">
        {/* Left: conversation list */}
        <div className="w-72 border-r border-border flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={16} className="text-purple-400" />
              <span className="font-bold text-foreground text-sm">Диалоги</span>
              {totalUnread > 0 && (
                <span className="ml-auto text-xs font-bold bg-purple-600 text-white rounded-full w-5 h-5 flex items-center justify-center">{totalUnread}</span>
              )}
            </div>
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Имя, USR-ID, TICK-ID..."
                className="w-full bg-secondary/50 border border-border rounded-lg pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <MessageSquare size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs">{conversations.length === 0 ? "Нет диалогов" : "Не найдено"}</p>
              </div>
            ) : (
              filtered.map(conv => (
                <button key={conv.id} onClick={() => openConversation(conv)}
                  className={`w-full text-left px-4 py-3 hover:bg-white/5 transition border-b border-border/50 ${selectedUser?.id === conv.id ? "bg-purple-600/10 border-l-2 border-l-purple-600" : ""}`}>
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-full gradient-purple flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {conv.firstName?.[0] || conv.email?.[0] || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="text-xs font-semibold text-foreground truncate">{conv.firstName} {conv.lastName}</span>
                        {conv.unread > 0 && (
                          <span className="ml-auto flex-shrink-0 w-4 h-4 bg-purple-600 rounded-full text-white text-[9px] flex items-center justify-center font-bold">{conv.unread}</span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">{conv.email}</p>
                      <div className="flex gap-1 mt-0.5 flex-wrap">
                        {conv.shortUserId && <span className="text-[9px] font-mono text-purple-400/70">{conv.shortUserId}</span>}
                        {conv.ticketId && <span className="text-[9px] font-mono text-amber-400/70">{conv.ticketId}</span>}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: message thread */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selectedUser ? (
            <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
              <div>
                <MessageSquare size={40} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">Выберите диалог</p>
                <p className="text-xs mt-1 opacity-60">Общайтесь с пользователями напрямую</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-5 py-3 border-b border-border flex items-center gap-3">
                <div className="w-8 h-8 rounded-full gradient-purple flex items-center justify-center text-white text-xs font-bold">
                  {selectedUser.firstName?.[0] || "?"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{selectedUser.firstName} {selectedUser.lastName}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                    {selectedUser.shortUserId && <span className="text-[10px] font-mono text-purple-400/80">{selectedUser.shortUserId}</span>}
                    {selectedUser.ticketId && <span className="text-[10px] font-mono text-amber-400/80">{selectedUser.ticketId}</span>}
                  </div>
                </div>
                <div className="ml-auto">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    selectedUser.role === "admin" ? "text-amber-400 bg-amber-400/10 border-amber-400/20" :
                    selectedUser.role === "moderator" ? "text-blue-400 bg-blue-400/10 border-blue-400/20" :
                    "text-gray-400 bg-gray-400/10 border-gray-400/20"
                  }`}>{selectedUser.role}</span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {loadingMsgs ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <p className="text-sm">Начните диалог первым</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.fromUserId === user?.userId;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[70%] rounded-2xl text-sm overflow-hidden ${
                          isMe ? "gradient-purple text-white rounded-br-sm" : "bg-secondary border border-border text-foreground rounded-bl-sm"
                        }`}>
                          {msg.imageUrl && (
                            <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                              <img src={msg.imageUrl} alt="Вложение" className="max-w-full block" style={{ maxHeight: "200px", objectFit: "cover", width: "100%" }} />
                            </a>
                          )}
                          {msg.message && <p className="leading-relaxed break-words px-4 py-2.5">{msg.message}</p>}
                          <p className={`text-[10px] px-4 pb-2 ${isMe ? "text-white/60" : "text-muted-foreground"}`}>
                            {new Date(msg.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-5 py-4 border-t border-border">
                <div className="flex gap-2">
                  <input
                    value={newMsg}
                    onChange={e => setNewMsg(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder={`Написать ${selectedUser.firstName}...`}
                    className="flex-1 bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                  />
                  <button onClick={sendMessage} disabled={sending || !newMsg.trim()}
                    className="gradient-purple text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition disabled:opacity-40">
                    {sending ? "..." : "Отправить"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [, nav] = useLocation();
  const { user } = useAuthStore();
  const isModerator = user?.role === "moderator";

  type AdminTab = "overview" | "users" | "sites" | "system" | "notifications" | "dbdump" | "chat";
  const initTab = (): AdminTab => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    if (t === "chat" || t === "overview" || t === "users" || t === "sites" || t === "system" || t === "notifications" || t === "dbdump") return t as AdminTab;
    return isModerator ? "sites" : "overview";
  };
  const [tab, setTab] = useState<AdminTab>(initTab);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [sites, setSites] = useState<AdminSite[]>([]);
  const [sysInfo, setSysInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      if (isModerator) {
        const si = await adminApi.sites();
        setSites(si);
      } else {
        const [s, u, si, sys] = await Promise.all([
          adminApi.stats(), adminApi.users(), adminApi.sites(), adminApi.system(),
        ]);
        setStats(s); setUsers(u); setSites(si); setSysInfo(sys);
      }
    } catch (e: any) {
      setError(e.response?.data?.message || "Ошибка загрузки данных");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (user && user.role !== "admin" && user.role !== "moderator") {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Доступ запрещён</h2>
          <p className="text-muted-foreground mb-4">Требуются права администратора</p>
          <button onClick={() => nav("/dashboard")} className="px-4 py-2 gradient-purple text-white rounded-xl text-sm font-semibold">
            На дашборд
          </button>
        </div>
      </div>
    );
  }

  const TABS = isModerator ? [
    { id: "sites" as const, label: "Сайты", icon: Globe },
    { id: "chat" as const, label: "Чат", icon: MessageSquare },
    { id: "notifications" as const, label: "Уведомления", icon: Shield },
  ] : [
    { id: "overview" as const, label: "Обзор", icon: BarChart2 },
    { id: "users" as const, label: "Пользователи", icon: Users },
    { id: "sites" as const, label: "Сайты", icon: Globe },
    { id: "dbdump" as const, label: "Дамп памяти", icon: Database },
    { id: "notifications" as const, label: "Уведомления", icon: Shield },
    { id: "chat" as const, label: "Чат", icon: MessageSquare },
    { id: "system" as const, label: "Система", icon: Server },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <div className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-4">
          <button onClick={() => nav("/dashboard")} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition text-sm">
            <ArrowLeft size={14} /> Назад
          </button>
          <div className="w-px h-5 bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <Crown size={14} className="text-amber-400" />
            </div>
            <span className="font-bold text-foreground">Admin Panel</span>
            <span className="text-xs text-amber-400 font-semibold px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20">lilluucore</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => nav("/dashboard")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition px-3 py-1.5 rounded-lg hover:bg-primary/10">
              <LayoutDashboard size={14} /> Мои сайты
            </button>
            <button onClick={load} disabled={loading} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition px-3 py-1.5 rounded-lg hover:bg-white/5">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Обновить
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tab navigation */}
        <div className="flex gap-1 mb-8 bg-secondary/50 p-1 rounded-2xl w-fit border border-border">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition ${tab === id ? "gradient-purple text-white shadow-lg shadow-purple-500/20" : "text-muted-foreground hover:text-foreground"}`}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Загружаем данные...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl mb-6">
            <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {tab === "overview" && stats && !isModerator && <OverviewTab stats={stats} />}
            {tab === "users" && !isModerator && <UsersTab users={users} onRefresh={load} />}
            {tab === "sites" && <SitesTab sites={sites} onRefresh={load} />}
            {tab === "dbdump" && !isModerator && <DbDumpTab users={users} onRefresh={load} />}
            {tab === "notifications" && <NotificationsTab users={users} />}
            {tab === "chat" && <ChatTab />}
            {tab === "system" && sysInfo && !isModerator && <SystemTab info={sysInfo} />}
          </>
        )}
      </div>
    </div>
  );
}
