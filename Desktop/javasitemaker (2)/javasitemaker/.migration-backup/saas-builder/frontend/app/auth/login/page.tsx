'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Box, Card, TextField, Button, Typography, Link,
  InputAdornment, IconButton, Alert, CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff, AutoAwesome } from '@mui/icons-material';
import { authApi } from '@/lib/apiClient';
import { useAuthStore } from '@/lib/store';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await authApi.login(email, password);
      setAuth(data.token, {
        id: data.userId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
      });
      router.push('/dashboard');
    } catch {
      setError('Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at top, #1a0533 0%, #09090B 60%)',
        p: 2,
      }}
    >
      {/* Animated background orbs */}
      <Box sx={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
          style={{
            position: 'absolute', top: '20%', left: '15%',
            width: 400, height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
          }}
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
          style={{
            position: 'absolute', bottom: '20%', right: '15%',
            width: 300, height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%)',
          }}
        />
      </Box>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}
      >
        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              display: 'inline-flex', alignItems: 'center', gap: 1,
              background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
              borderRadius: 3, px: 3, py: 1.5,
            }}
          >
            <AutoAwesome sx={{ fontSize: 24 }} />
            <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
              SaasBuilder
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Визуальный конструктор сайтов
          </Typography>
        </Box>

        <Card
          sx={{
            p: 4,
            backdropFilter: 'blur(20px)',
            background: 'rgba(24,24,27,0.8)',
            border: '1px solid rgba(124,58,237,0.2)',
          }}
        >
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Добро пожаловать
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Войдите в свой аккаунт
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleLogin}>
            <TextField
              fullWidth label="Email" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              required sx={{ mb: 2 }}
              autoComplete="email"
            />
            <TextField
              fullWidth label="Пароль" value={password}
              onChange={(e) => setPassword(e.target.value)}
              required sx={{ mb: 3 }}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit" fullWidth variant="contained" size="large"
              disabled={loading}
              sx={{
                background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                fontWeight: 700, py: 1.5,
                '&:hover': { background: 'linear-gradient(135deg, #6D28D9, #4338CA)' },
              }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Войти'}
            </Button>
          </form>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
            Нет аккаунта?{' '}
            <Link href="/auth/register" underline="hover" color="primary">
              Зарегистрироваться
            </Link>
          </Typography>
        </Card>
      </motion.div>
    </Box>
  );
}
