import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { siteApi, tenantApi, templateApi } from '@/lib/apiClient';
import { useSnackbar } from 'notistack';

export function useSites() {
  return useQuery({
    queryKey: ['sites'],
    queryFn: async () => {
      const { data } = await siteApi.getAll();
      return data;
    },
  });
}

export function useSite(id: string) {
  return useQuery({
    queryKey: ['sites', id],
    queryFn: async () => {
      const { data } = await siteApi.getById(id);
      return data;
    },
    enabled: !!id,
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await siteApi.getDashboardStats();
      return data;
    },
  });
}

export function useCreateSite() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: async (data: { name: string; businessType: string; tenantId: string }) => {
      const { data: site } = await siteApi.create(data);
      return site;
    },
    onSuccess: (site) => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      enqueueSnackbar('Сайт создан успешно!', { variant: 'success' });
      return site;
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Ошибка создания сайта';
      enqueueSnackbar(msg, { variant: 'error' });
    },
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: async (data: { name: string; businessType: string }) => {
      const { data: tenant } = await tenantApi.create(data.name, data.businessType);
      return tenant;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      enqueueSnackbar('Рабочее пространство создано', { variant: 'success' });
    },
    onError: () => {
      enqueueSnackbar('Ошибка создания рабочего пространства', { variant: 'error' });
    },
  });
}

export function useTenants() {
  return useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const { data } = await tenantApi.getAll();
      return data;
    },
  });
}

export function useDeleteSite() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: async (id: string) => {
      await siteApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      enqueueSnackbar('Сайт удалён', { variant: 'info' });
    },
  });
}

export function usePublishSite() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await siteApi.publish(id);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      enqueueSnackbar(`Сайт опубликован: ${data.url}`, { variant: 'success' });
      return data;
    },
    onError: () => {
      enqueueSnackbar('Ошибка публикации', { variant: 'error' });
    },
  });
}

export function useBusinessTypes() {
  return useQuery({
    queryKey: ['business-types'],
    queryFn: async () => {
      const { data } = await templateApi.getBusinessTypes();
      return data;
    },
  });
}

export function useAvailableBlocks(businessType: string) {
  return useQuery({
    queryKey: ['available-blocks', businessType],
    queryFn: async () => {
      const { data } = await templateApi.getBlocks(businessType);
      return data;
    },
    enabled: !!businessType,
  });
}
