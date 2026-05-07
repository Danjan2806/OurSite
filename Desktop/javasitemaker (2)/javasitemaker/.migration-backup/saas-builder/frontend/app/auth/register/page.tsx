'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Box, Card, TextField, Button, Typography, Link,
  Alert, CircularProgress, Grid,
} from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';
import { authApi } from '@/lib/apiClient';
import { useAuthStore } from '@/lib/store';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) {
      setError('Пароль должен быть не менее 8 символов');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await authApi.register(form);
      setAuth(data.token, {
        id: data.userId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
      });
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', p: 2,
        background: 'radial-gradient(ellipse at top, #1a0533 0%, #09090B 60%)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ width: '100%', maxWidth: 480 }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              display: 'inline-flex', alignItems: 'center', gap: 1,
              background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
              borderRadius: 3, px: 3, py: 1.5,
            }}
          >
            <AutoAwesome sx={{ fontSize: 24 }} />
            <Typography variant="h6" fontWeight={800}>SaasBuilder</Typography>
          </Box>
        </Box>

        <Card sx={{ p: 4, backdropFilter: 'blur(20px)', background: 'rgba(24,24,27,0.8)', border: '1px solid rgba(124,58,237,0.2)' }}>
          <Typography variant="h5" fontWeight={700} gutterBottom>Создать аккаунт</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Начните бесплатно — без карты
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleRegister}>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <TextField fullWidth label="Имя" name="firstName" value={form.firstName} onChange={handleChange} required />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Фамилия" name="lastName" value={form.lastName} onChange={handleChange} required />
              </Grid>
            </Grid>
            <TextField fullWidth label="Email" name="email" type="email" value={form.email} onChange={handleChange} required sx={{ mb: 2 }} />
            <TextField fullWidth label="Пароль (мин. 8 символов)" name="password" type="password" value={form.password} onChange={handleChange} required sx={{ mb: 3 }} />
            <Button
              type="submit" fullWidth variant="contained" size="large" disabled={loading}
              sx={{ background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', fontWeight: 700, py: 1.5 }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Зарегистрироваться'}
            </Button>
          </form>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
            Уже есть аккаунт?{' '}
            <Link href="/auth/login" underline="hover" color="primary">Войти</Link>
          </Typography>
        </Card>
      </motion.div>
    </Box>
  );
}
