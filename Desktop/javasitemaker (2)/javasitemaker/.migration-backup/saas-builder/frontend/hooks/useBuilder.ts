import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blockApi, siteApi } from '@/lib/apiClient';
import { useBuilderStore } from '@/lib/store';
import { useSnackbar } from 'notistack';
import { useEffect, useRef } from 'react';
import { wsClient, SiteEvent } from '@/lib/wsClient';

export function useBuilder(siteId: string) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { setSelectedBlock } = useBuilderStore();

  const siteQuery = useQuery({
    queryKey: ['sites', siteId],
    queryFn: async () => {
      const { data } = await siteApi.getById(siteId);
      return data;
    },
    enabled: !!siteId,
  });

  // WebSocket live updates
  useEffect(() => {
    if (!siteId) return;

    const unsubscribe = wsClient.subscribeSite(siteId, (event: SiteEvent) => {
      // Invalidate queries on any server-side event
      queryClient.invalidateQueries({ queryKey: ['sites', siteId] });
    });

    return unsubscribe;
  }, [siteId, queryClient]);

  const addBlock = useMutation({
    mutationFn: async (data: { type: string; position: number }) => {
      const { data: block } = await blockApi.add(siteId, {
        type: data.type,
        position: data.position,
        content: getDefaultContent(data.type),
        styles: getDefaultStyles(data.type),
      });
      return block;
    },
    onSuccess: (block) => {
      queryClient.invalidateQueries({ queryKey: ['sites', siteId] });
      setSelectedBlock(block.id);
      enqueueSnackbar('Блок добавлен', { variant: 'success' });
    },
    onError: () => enqueueSnackbar('Ошибка добавления блока', { variant: 'error' }),
  });

  const updateBlock = useMutation({
    mutationFn: async (data: { id: string; content?: string; styles?: string; visible?: boolean }) => {
      const { data: block } = await blockApi.update(data.id, {
        content: data.content,
        styles: data.styles,
        visible: data.visible,
      });
      return block;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites', siteId] });
    },
  });

  const deleteBlock = useMutation({
    mutationFn: async (blockId: string) => {
      await blockApi.delete(blockId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites', siteId] });
      setSelectedBlock(null);
      enqueueSnackbar('Блок удалён', { variant: 'info' });
    },
  });

  const reorderBlocks = useMutation({
    mutationFn: async (blockIds: string[]) => {
      const { data } = await blockApi.reorder(siteId, blockIds);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites', siteId] });
    },
  });

  const updateStyles = useMutation({
    mutationFn: async (globalStyles: string) => {
      const { data } = await siteApi.update(siteId, { globalStyles });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites', siteId] });
    },
  });

  return {
    site: siteQuery.data,
    isLoading: siteQuery.isLoading,
    addBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks,
    updateStyles,
  };
}

function getDefaultContent(type: string): string {
  const defaults: Record<string, object> = {
    HERO: { title: 'Заголовок блока', subtitle: 'Описание', ctaText: 'Действие', ctaUrl: '#' },
    FEATURES: { title: 'Наши преимущества', items: [{ icon: '⚡', title: 'Быстро', text: 'Описание' }] },
    PRICING: { title: 'Тарифы', plans: [] },
    CONTACTS: { title: 'Контакты', email: '', phone: '' },
    PRODUCT_GRID: { title: 'Товары', columns: 3, products: [] },
    MUSIC_PLAYER: { title: 'Треки', tracks: [] },
    SCHEDULE: { title: 'Расписание', classes: [] },
    TESTIMONIALS: { title: 'Отзывы', items: [] },
    FAQ: { title: 'Часто задаваемые вопросы', items: [] },
    LEAD_FORM: { title: 'Оставьте заявку', submitText: 'Отправить' },
    ARTISTS: { title: 'Наши артисты', artists: [] },
    RELEASES: { title: 'Новые релизы', releases: [] },
    TRAINERS: { title: 'Наши тренеры', trainers: [] },
    MEMBERSHIPS: { title: 'Абонементы', plans: [] },
  };
  return JSON.stringify(defaults[type] || {});
}

function getDefaultStyles(type: string): string {
  const defaults: Record<string, object> = {
    HERO: { minHeight: '80vh', textAlign: 'center' },
    FEATURES: { padding: '80px 0' },
    PRICING: { padding: '60px 0', backgroundColor: '#f9fafb' },
    CONTACTS: { padding: '60px 0', backgroundColor: '#111827', color: '#fff' },
    PRODUCT_GRID: { padding: '60px 0' },
    MUSIC_PLAYER: { padding: '60px 0', backgroundColor: '#0f0f0f', color: '#fff' },
    SCHEDULE: { padding: '60px 0' },
    TESTIMONIALS: { padding: '60px 0', backgroundColor: '#f9fafb' },
    FAQ: { padding: '60px 0' },
    LEAD_FORM: { padding: '60px 0' },
  };
  return JSON.stringify(defaults[type] || { padding: '60px 0' });
}
