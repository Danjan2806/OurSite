'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box, Grid, Typography, Button, Card, CardContent,
  Skeleton, Chip, IconButton, Menu, MenuItem, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, FormControl, InputLabel, Tooltip,
} from '@mui/material';
import {
  Add, MoreVert, Launch, Edit, Delete, Web, BarChart,
  TrendingUp, Language, AutoAwesome, Logout, Person,
} from '@mui/icons-material';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip, ResponsiveContainer,
} from 'recharts';
import { useSites, useCreateSite, useCreateTenant, useDeleteSite, usePublishSite, useDashboardStats, useBusinessTypes, useTenants } from '@/hooks/useSites';
import { useAuthStore } from '@/lib/store';

const BUSINESS_TYPE_ICONS: Record<string, string> = {
  LANDING: '🚀', ECOMMERCE: '🛒', MUSIC_LABEL: '🎵', FITNESS: '💪',
};

const BUSINESS_TYPE_COLORS: Record<string, string> = {
  LANDING: '#7C3AED', ECOMMERCE: '#059669', MUSIC_LABEL: '#DC2626', FITNESS: '#EA580C',
};

// Mock activity data (would come from real analytics in production)
const generateActivityData = () =>
  Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString('ru', { day: 'numeric', month: 'short' }),
    visits: Math.floor(Math.random() * 500 + 50),
    conversions: Math.floor(Math.random() * 50 + 5),
  }));

export default function DashboardPage() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const { data: sites, isLoading: sitesLoading } = useSites();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: businessTypes } = useBusinessTypes();
  const { data: tenants } = useTenants();
  const createSite = useCreateSite();
  const createTenant = useCreateTenant();
  const deleteSite = useDeleteSite();
  const publishSite = usePublishSite();

  const [activityData] = useState(generateActivityData);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [step, setStep] = useState<'tenant' | 'site'>('tenant');
  const [newTenantName, setNewTenantName] = useState('');
  const [selectedBusinessType, setSelectedBusinessType] = useState('LANDING');
  const [newSiteName, setNewSiteName] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [createdTenantId, setCreatedTenantId] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuSiteId, setMenuSiteId] = useState<string | null>(null);
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    if (!user) router.push('/auth/login');
  }, [user, router]);

  const handleOpenMenu = (e: React.MouseEvent<HTMLElement>, siteId: string) => {
    setMenuAnchor(e.currentTarget);
    setMenuSiteId(siteId);
  };

  const handleCreateFlow = async () => {
    if (step === 'tenant') {
      if (!newTenantName.trim()) return;
      try {
        const tenant = await createTenant.mutateAsync({ name: newTenantName, businessType: selectedBusinessType });
        setCreatedTenantId(tenant.id);
        setSelectedTenantId(tenant.id);
        setStep('site');
      } catch { /* handled in hook */ }
    } else {
      if (!newSiteName.trim() || (!selectedTenantId && !createdTenantId)) return;
      try {
        const site = await createSite.mutateAsync({
          name: newSiteName,
          businessType: selectedBusinessType,
          tenantId: createdTenantId || selectedTenantId,
        });
        setCreateDialogOpen(false);
        resetDialog();
        router.push(`/builder/${site.id}`);
      } catch { /* handled in hook */ }
    }
  };

  const resetDialog = () => {
    setStep('tenant');
    setNewTenantName('');
    setNewSiteName('');
    setSelectedBusinessType('LANDING');
    setCreatedTenantId('');
    setSelectedTenantId('');
  };

  const handleLogout = () => {
    clearAuth();
    router.push('/auth/login');
  };

  const StatCard = ({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>{label}</Typography>
            <Typography variant="h4" fontWeight={800}>{value}</Typography>
          </Box>
          <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: color + '22' }}>
            <Box sx={{ color }}>{icon}</Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Top Navigation */}
      <Box
        sx={{
          px: 4, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid', borderColor: 'divider',
          backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 100,
          bgcolor: 'rgba(9,9,11,0.8)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
              borderRadius: 2, p: 0.8, display: 'flex',
            }}
          >
            <AutoAwesome sx={{ fontSize: 20 }} />
          </Box>
          <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
            SaasBuilder
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="contained" startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{ background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', fontWeight: 700 }}
          >
            Новый сайт
          </Button>
          <Tooltip title={user?.email || ''}>
            <IconButton onClick={(e) => setProfileAnchor(e.currentTarget)}>
              <Avatar sx={{ width: 36, height: 36, bgcolor: '#7C3AED', fontSize: 14, fontWeight: 700 }}>
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu anchorEl={profileAnchor} open={!!profileAnchor} onClose={() => setProfileAnchor(null)}>
            <MenuItem disabled>
              <Person sx={{ mr: 1, fontSize: 18 }} />
              {user?.firstName} {user?.lastName}
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <Logout sx={{ mr: 1, fontSize: 18, color: 'error.main' }} />
              <Typography color="error">Выйти</Typography>
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 1400, mx: 'auto', px: 4, py: 4 }}>
        {/* Welcome header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Привет, {user?.firstName} 👋
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Управляйте своими сайтами и отслеживайте статистику
          </Typography>
        </motion.div>

        {/* Stats cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            { label: 'Всего сайтов', value: statsLoading ? '—' : stats?.totalSites ?? 0, icon: <Web />, color: '#7C3AED' },
            { label: 'Опубликовано', value: statsLoading ? '—' : stats?.publishedSites ?? 0, icon: <Language />, color: '#059669' },
            { label: 'Черновики', value: statsLoading ? '—' : stats?.draftSites ?? 0, icon: <Edit />, color: '#D97706' },
            { label: 'Активность за месяц', value: statsLoading ? '—' : stats?.recentActivity ?? 0, icon: <TrendingUp />, color: '#DC2626' },
          ].map((stat, i) => (
            <Grid item xs={12} sm={6} lg={3} key={i}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                {statsLoading ? (
                  <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 3 }} />
                ) : (
                  <StatCard {...stat} />
                )}
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Activity chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <Card sx={{ mb: 4, p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <BarChart sx={{ color: '#7C3AED' }} />
              <Typography variant="h6" fontWeight={700}>Активность за 30 дней</Typography>
            </Box>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="visitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#71717A' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#71717A' }} tickLine={false} axisLine={false} />
                <RechartTooltip
                  contentStyle={{ background: '#18181B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                  labelStyle={{ color: '#FAFAFA', fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="visits" stroke="#7C3AED" strokeWidth={2} fill="url(#visitGrad)" name="Визиты" />
                <Area type="monotone" dataKey="conversions" stroke="#059669" strokeWidth={2} fill="url(#convGrad)" name="Конверсии" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Sites grid */}
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Мои сайты</Typography>
        <Grid container spacing={3}>
          <AnimatePresence>
            {sitesLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <Grid item xs={12} sm={6} lg={4} key={i}>
                    <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 3 }} />
                  </Grid>
                ))
              : sites?.length === 0
              ? (
                  <Grid item xs={12}>
                    <Card sx={{ p: 8, textAlign: 'center', borderStyle: 'dashed', borderColor: 'rgba(124,58,237,0.3)' }}>
                      <AutoAwesome sx={{ fontSize: 48, color: '#7C3AED', mb: 2, opacity: 0.5 }} />
                      <Typography variant="h6" gutterBottom>Нет сайтов</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Создайте первый сайт за несколько секунд
                      </Typography>
                      <Button variant="contained" startIcon={<Add />} onClick={() => setCreateDialogOpen(true)}
                        sx={{ background: 'linear-gradient(135deg, #7C3AED, #4F46E5)' }}>
                        Создать сайт
                      </Button>
                    </Card>
                  </Grid>
                )
              : sites?.map((site: { id: string; name: string; businessType: string; status: string; publishedUrl?: string; updatedAt: string }, i: number) => (
                  <Grid item xs={12} sm={6} lg={4} key={site.id}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.06, duration: 0.4 }}
                      whileHover={{ y: -4 }}
                    >
                      <Card
                        sx={{
                          cursor: 'pointer', overflow: 'hidden', height: '100%',
                          transition: 'box-shadow 0.3s',
                          '&:hover': { boxShadow: `0 0 0 1px ${BUSINESS_TYPE_COLORS[site.businessType]}44, 0 20px 40px rgba(0,0,0,0.4)` },
                        }}
                      >
                        {/* Color banner */}
                        <Box sx={{ height: 6, background: `linear-gradient(90deg, ${BUSINESS_TYPE_COLORS[site.businessType]}, ${BUSINESS_TYPE_COLORS[site.businessType]}88)` }} />
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Typography sx={{ fontSize: 28 }}>{BUSINESS_TYPE_ICONS[site.businessType]}</Typography>
                              <Box>
                                <Typography variant="subtitle1" fontWeight={700} noWrap>{site.name}</Typography>
                                <Chip
                                  label={site.status === 'PUBLISHED' ? 'Опубликован' : 'Черновик'}
                                  size="small"
                                  sx={{
                                    height: 20, fontSize: 11,
                                    bgcolor: site.status === 'PUBLISHED' ? '#05966920' : '#D9780620',
                                    color: site.status === 'PUBLISHED' ? '#059669' : '#D97806',
                                  }}
                                />
                              </Box>
                            </Box>
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenMenu(e, site.id); }}>
                              <MoreVert fontSize="small" />
                            </IconButton>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            Изменён: {new Date(site.updatedAt).toLocaleDateString('ru')}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                            <Button
                              variant="outlined" size="small" startIcon={<Edit />}
                              onClick={() => router.push(`/builder/${site.id}`)}
                              sx={{ flex: 1, borderColor: 'rgba(255,255,255,0.12)' }}
                            >
                              Редактировать
                            </Button>
                            {site.publishedUrl && (
                              <Tooltip title={site.publishedUrl}>
                                <IconButton size="small" href={site.publishedUrl} target="_blank"
                                  sx={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 1.5 }}>
                                  <Launch fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                ))
            }
          </AnimatePresence>
        </Grid>
      </Box>

      {/* Site context menu */}
      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
        <MenuItem onClick={() => { router.push(`/builder/${menuSiteId}`); setMenuAnchor(null); }}>
          <Edit sx={{ mr: 1.5, fontSize: 18 }} /> Редактировать
        </MenuItem>
        <MenuItem onClick={async () => { if (menuSiteId) await publishSite.mutateAsync(menuSiteId); setMenuAnchor(null); }}>
          <Launch sx={{ mr: 1.5, fontSize: 18 }} /> Опубликовать
        </MenuItem>
        <MenuItem onClick={() => { if (menuSiteId) deleteSite.mutate(menuSiteId); setMenuAnchor(null); }} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1.5, fontSize: 18 }} /> Удалить
        </MenuItem>
      </Menu>

      {/* Create Site Dialog */}
      <Dialog open={createDialogOpen} onClose={() => { setCreateDialogOpen(false); resetDialog(); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          {step === 'tenant' ? 'Шаг 1: Тип бизнеса' : 'Шаг 2: Название сайта'}
        </DialogTitle>
        <DialogContent>
          {step === 'tenant' ? (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Выберите тип бизнеса — система создаст оптимальную базу данных и блоки
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {(businessTypes || [
                  { type: 'LANDING', label: 'Лендинг', description: 'SEO-блоки, форма захвата', icon: '🚀' },
                  { type: 'ECOMMERCE', label: 'Магазин', description: 'Каталог, корзина, заказы', icon: '🛒' },
                  { type: 'MUSIC_LABEL', label: 'Муз. лейбл', description: 'Плеер, артисты, релизы', icon: '🎵' },
                  { type: 'FITNESS', label: 'Фитнес', description: 'Расписание, тренеры, абонементы', icon: '💪' },
                ]).map((bt: { type: string; label: string; description: string; icon: string }) => (
                  <Grid item xs={6} key={bt.type}>
                    <Card
                      onClick={() => setSelectedBusinessType(bt.type)}
                      sx={{
                        p: 2, cursor: 'pointer', textAlign: 'center',
                        border: '2px solid',
                        borderColor: selectedBusinessType === bt.type ? BUSINESS_TYPE_COLORS[bt.type] : 'transparent',
                        bgcolor: selectedBusinessType === bt.type ? BUSINESS_TYPE_COLORS[bt.type] + '11' : 'background.paper',
                        transition: 'all 0.2s',
                        '&:hover': { borderColor: BUSINESS_TYPE_COLORS[bt.type] + '88' },
                      }}
                    >
                      <Typography sx={{ fontSize: 32, mb: 1 }}>{bt.icon}</Typography>
                      <Typography fontWeight={700} variant="body2">{bt.label}</Typography>
                      <Typography variant="caption" color="text.secondary">{bt.description}</Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              <TextField
                fullWidth label="Название рабочего пространства"
                value={newTenantName} onChange={(e) => setNewTenantName(e.target.value)}
                placeholder="например, Мой бизнес"
                helperText="Под него будет создана отдельная база данных"
              />
            </Box>
          ) : (
            <Box>
              <TextField
                fullWidth label="Название сайта" value={newSiteName}
                onChange={(e) => setNewSiteName(e.target.value)}
                placeholder="например, Главная страница" sx={{ mb: 2 }}
                autoFocus
              />
              {tenants && tenants.length > 0 && (
                <FormControl fullWidth>
                  <InputLabel>Рабочее пространство</InputLabel>
                  <Select
                    value={createdTenantId || selectedTenantId}
                    onChange={(e) => setSelectedTenantId(e.target.value)}
                    label="Рабочее пространство"
                  >
                    {tenants.map((t: { id: string; name: string }) => (
                      <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => { setCreateDialogOpen(false); resetDialog(); }}>Отмена</Button>
          <Button
            variant="contained" onClick={handleCreateFlow}
            disabled={createTenant.isPending || createSite.isPending}
            sx={{ background: 'linear-gradient(135deg, #7C3AED, #4F46E5)' }}
          >
            {step === 'tenant' ? 'Далее →' : 'Создать сайт'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
