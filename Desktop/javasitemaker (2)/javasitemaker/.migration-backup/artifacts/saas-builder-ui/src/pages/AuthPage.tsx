import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store";
import { authApi } from "@/lib/api";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuthStore();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const data = mode === "register"
        ? await authApi.register(form)
        : await authApi.login(form);
      setUser({ ...data });
      queryClient.clear();
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Ошибка. Попробуйте снова.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Back button */}
      <button onClick={() => navigate("/")}
        className="absolute top-4 left-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition px-3 py-2 rounded-lg hover:bg-white/5 z-20">
        ← На главную
      </button>
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass rounded-2xl p-8 w-full max-w-md relative z-10 glow"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="gradient-purple w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
            L
          </div>
          <div>
            <h1 className="text-white font-bold text-xl">lilluucore</h1>
            <p className="text-muted-foreground text-xs">Визуальный конструктор сайтов</p>
          </div>
        </div>

        <h2 className="text-white font-semibold text-2xl mb-1">
          {mode === "login" ? "Вход" : "Регистрация"}
        </h2>
        <p className="text-muted-foreground text-sm mb-6">
          {mode === "login" ? "С возвращением!" : "Создайте аккаунт бесплатно"}
        </p>

        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Имя</label>
                <input
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition"
                  placeholder="Иван" value={form.firstName} onChange={set("firstName")} required
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Фамилия</label>
                <input
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition"
                  placeholder="Иванов" value={form.lastName} onChange={set("lastName")} required
                />
              </div>
            </div>
          )}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Email</label>
            <input
              type="email"
              className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition"
              placeholder="you@example.com" value={form.email} onChange={set("email")} required
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Пароль</label>
            <input
              type="password"
              className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition"
              placeholder="Минимум 6 символов" value={form.password} onChange={set("password")} required
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full gradient-purple text-white font-semibold py-2.5 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? "Загрузка..." : mode === "login" ? "Войти" : "Создать аккаунт"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-5">
          {mode === "login" ? "Нет аккаунта?" : "Уже есть аккаунт?"}{" "}
          <button
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
            className="text-primary hover:text-primary/80 transition font-medium"
          >
            {mode === "login" ? "Зарегистрируйтесь" : "Войти"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
