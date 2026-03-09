import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ADMIN_EMAIL } from "@/lib/constants";
import DashboardLayout from "./components/DashboardLayout";
import Overview from "./pages/Overview";
import RequestLogs from "./pages/RequestLogs";
import Metrics from "./pages/Metrics";
import AIQuality from "./pages/AIQuality";
import AdminUsers from "./pages/AdminUsers";
import AdminActivity from "./pages/AdminActivity";
import AdminChats from "./pages/AdminChats";
import Chat from "./pages/Chat";
import Auth from "./pages/Auth";
import AdminAuth from "./pages/AdminAuth";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AuthRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (user) {
    return <Navigate to={user.email === ADMIN_EMAIL ? "/admin" : "/chat"} replace />;
  }
  return <Auth />;
}

function AdminAuthRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (user) {
    return <Navigate to={user.email === ADMIN_EMAIL ? "/admin" : "/chat"} replace />;
  }
  return <AdminAuth />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.email !== ADMIN_EMAIL) return <Navigate to="/chat" replace />;
  return <>{children}</>;
}

function UserRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function LoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Root redirects based on auth */}
            <Route path="/" element={<AuthRoute />} />

            {/* Login */}
            <Route path="/login" element={<AuthRoute />} />
            <Route path="/admin/login" element={<AdminAuthRoute />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* User chatbot (requires login) */}
            <Route
              path="/chat"
              element={
                <UserRoute>
                  <Chat />
                </UserRoute>
              }
            />

            {/* Admin dashboard (admin email only) */}
            <Route
              path="/admin/*"
              element={
                <AdminRoute>
                  <DashboardLayout>
                    <Routes>
                      <Route path="/" element={<Overview />} />
                      <Route path="/logs" element={<RequestLogs />} />
                      <Route path="/metrics" element={<Metrics />} />
                      <Route path="/quality" element={<AIQuality />} />
                      <Route path="/users" element={<AdminUsers />} />
                      <Route path="/activity" element={<AdminActivity />} />
                      <Route path="/chats" element={<AdminChats />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </DashboardLayout>
                </AdminRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
