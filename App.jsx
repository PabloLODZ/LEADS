import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { ToastProvider } from './contexts/ToastContext.jsx';
import { AppProvider } from './contexts/AppContext.jsx';

// Layout
import AppLayout from './components/layout/AppLayout.jsx';

// Auth pages
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx';

// App pages
import TodayPage from './pages/today/TodayPage.jsx';
import CampaignsPage from './pages/campaigns/CampaignsPage.jsx';
import LeadsPage from './pages/leads/LeadsPage.jsx';
import ConversationsPage from './pages/conversations/ConversationsPage.jsx';
import SettingsPage from './pages/settings/SettingsPage.jsx';
import SupportPage from './pages/support/SupportPage.jsx';
import AdminPage from './pages/admin/AdminPage.jsx';

// Route guards
function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/hoje" replace />;
  }

  return children;
}

function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/hoje" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/cadastro" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/recuperar-senha" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />

      {/* Private routes with layout */}
      <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route index element={<Navigate to="/hoje" replace />} />
        <Route path="hoje" element={<TodayPage />} />
        <Route path="campanhas" element={<CampaignsPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="conversas" element={<ConversationsPage />} />
        <Route path="configuracoes" element={<SettingsPage />} />
        <Route path="suporte" element={<SupportPage />} />
        <Route path="admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/hoje" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppProvider>
            <AppRoutes />
          </AppProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
