import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import LandingPage from "@/pages/LandingPage";
import AuthPage from "@/pages/AuthPage";
import DashboardPage from "@/pages/DashboardPage";
import BuilderPage from "@/pages/BuilderPage";
import PricingPage from "@/pages/PricingPage";
import ProfilePage from "@/pages/ProfilePage";
import DocsPage from "@/pages/DocsPage";
import PrivacyPage from "@/pages/PrivacyPage";
import AdminPage from "@/pages/AdminPage";
import PreviewPage from "@/pages/PreviewPage";
import NotFound from "@/pages/not-found";
import { useAuthStore } from "@/lib/store";
import { authApi } from "@/lib/api";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30000 } } });

function Guard({ component: Component }: { component: React.ComponentType }) {
  const { user } = useAuthStore();
  const [, nav] = useLocation();
  useEffect(() => { if (!user) nav("/auth"); }, [user]);
  if (!user) return null;
  return <Component />;
}

function AppRouter() {
  const { user, updateUser } = useAuthStore();
  const [, nav] = useLocation();
  useEffect(() => {
    const p = window.location.pathname.replace(import.meta.env.BASE_URL.replace(/\/$/, ""), "") || "/";
    if (!user && p !== "/auth" && p !== "/" && p !== "/pricing" && p !== "/docs" && p !== "/privacy" && p !== "/404" && !p.startsWith("/preview/")) nav("/auth");
    if (user && p === "/auth") nav("/dashboard");
    if (user) {
      authApi.me().then(data => {
        updateUser({
          avatarUrl: data.avatarUrl ?? null,
          role: data.role,
          plan: data.plan,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
        });
      }).catch(() => {
        localStorage.removeItem("sb_token");
        localStorage.removeItem("sb-auth");
        nav("/auth");
      });
    }
  }, []);
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/auth/login" component={() => <Redirect to="/auth" />} />
      <Route path="/auth/register" component={() => <Redirect to="/auth?tab=register" />} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/docs" component={DocsPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/dashboard" component={() => <Guard component={DashboardPage} />} />
      <Route path="/profile" component={() => <Guard component={ProfilePage} />} />
      <Route path="/builder/:siteId" component={() => <Guard component={BuilderPage} />} />
      <Route path="/preview/:siteId" component={PreviewPage} />
      <Route path="/admin" component={() => <Guard component={AdminPage} />} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AppRouter />
      </WouterRouter>
    </QueryClientProvider>
  );
}
