import { NavLink, useNavigate } from 'react-router-dom';
import {
  Radar,
  PanelLeftClose,
  PanelLeftOpen,
  CalendarCheck,
  MessageCircle,
  Target,
  Users,
  Shield,
  Settings,
  HelpCircle,
  MessageSquare,
  Zap,
  ChevronRight,
  LogOut,
  CreditCard,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useApp } from '../../contexts/AppContext.jsx';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { getTotalCredits } from '../../utils/creditEngine.js';
import { getInitials } from '../../utils/formatters.js';
import { getPlanById } from '../../data/plans.js';

export default function Sidebar({ collapsed, onToggle, onFeedbackClick, onBuyCredits }) {
  const { user, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const totalCredits = getTotalCredits(user?.creditWallet);
  const plan = getPlanById(user?.planId);
  const planCredits = plan?.includedCredits || 50;
  const usedPercent = isAdmin ? 0 : Math.min(100, Math.round(((planCredits - totalCredits) / planCredits) * 100));
  const remainingCredits = totalCredits;

  const navItems = [
    { to: '/hoje', icon: CalendarCheck, label: 'Hoje', end: true },
    { to: '/conversas', icon: MessageCircle, label: 'Conversas' },
    { to: '/campanhas', icon: Target, label: 'Campanhas' },
    { to: '/leads', icon: Users, label: 'Leads' },
  ];

  const bottomItems = [
    { to: '/configuracoes', icon: Settings, label: 'Configurações' },
    { to: '/suporte', icon: HelpCircle, label: 'Suporte' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        <NavLink to="/hoje" className="sidebar-logo">
          <div className="logo-icon">
            <Radar />
          </div>
          <span className="logo-text">LODZ</span>
        </NavLink>
        <button className="sidebar-toggle" onClick={onToggle} title={collapsed ? 'Expandir' : 'Recolher'}>
          {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end || false}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <item.icon size={20} />
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}

        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Shield size={20} />
            <span className="nav-label">Admin</span>
          </NavLink>
        )}

        <div className="nav-divider" />

        {bottomItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <item.icon size={20} />
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}

        <button className="nav-item" onClick={onFeedbackClick}>
          <MessageSquare size={20} />
          <span className="nav-label">Feedback</span>
        </button>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {/* Credit Card */}
        <div className="credit-card">
          <div className="credit-card-header">
            <span className="credit-card-title">CRÉDITOS</span>
            <CreditCard size={14} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="credit-card-amount">
            {isAdmin ? 'Ilimitado' : totalCredits}
          </div>
          <div className="credit-progress">
            <div
              className="credit-progress-bar"
              style={{ width: isAdmin ? '100%' : `${Math.max(0, 100 - usedPercent)}%` }}
            />
          </div>
          <div className="credit-card-text">
            {isAdmin ? 'Acesso administrador' : `${remainingCredits} leads restantes`}
          </div>
          <button className="btn btn-primary btn-sm btn-block" onClick={onBuyCredits}>
            Mais leads
          </button>
        </div>

        {/* Plan Card */}
        <NavLink to="/configuracoes" className="plan-card" style={{ textDecoration: 'none' }}>
          <Zap size={18} />
          <div className="plan-card-info">
            <div className="plan-card-name">{plan?.name || 'Starter'}</div>
          </div>
          <ChevronRight size={16} className="chevron" />
        </NavLink>

        {/* User Card */}
        <div className="user-card" style={{ position: 'relative' }}>
          <div className="user-avatar">
            {getInitials(user?.name)}
          </div>
          <div className="user-card-info">
            <div className="user-card-name">{user?.name}</div>
            <div className="user-card-role">
              {user?.role === 'admin' ? 'Administrador' : user?.role === 'trial' ? 'Trial' : 'Usuário'}
            </div>
          </div>
          {!collapsed && (
            <div style={{ display: 'flex', gap: '4px' }}>
              <button className="logout-btn" onClick={toggleTheme} title="Alternar Tema">
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button className="logout-btn" onClick={handleLogout} title="Sair">
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
