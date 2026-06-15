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
  Moon,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useApp } from '../../contexts/AppContext.jsx';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { getTotalCredits } from '../../utils/creditEngine.js';
import { getInitials } from '../../utils/formatters.js';
import { getPlanById } from '../../data/plans.js';

export default function Sidebar({ collapsed, onToggle, onFeedbackClick, onBuyCredits }) {
  const { user, isAdmin, isRealAdmin, mockPlanId, setMockPlanId, isSimulatingUser, setIsSimulatingUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { leads } = useApp();
  const navigate = useNavigate();

  const unreadCount = leads?.filter(l => l.status === 'novo').length || 0;

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
    { to: '/relatorios', icon: BarChart3, label: 'Relatórios' },
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
            <item.icon size={16} />
            <span className="nav-label">{item.label}</span>
            {item.to === '/relatorios' && unreadCount > 0 && !collapsed && (
              <span style={{ 
                background: 'var(--color-error)', 
                color: '#fff', 
                fontSize: '11px', 
                fontWeight: '700', 
                padding: '2px 6px', 
                borderRadius: '10px', 
                marginLeft: 'auto' 
              }}>
                {unreadCount}
              </span>
            )}
            {item.to === '/relatorios' && unreadCount > 0 && collapsed && (
              <span style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--color-error)'
              }} />
            )}
          </NavLink>
        ))}

        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Shield size={16} />
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
            <item.icon size={16} />
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}

        <button className="nav-item" onClick={onFeedbackClick}>
          <MessageSquare size={16} />
          <span className="nav-label">Feedback</span>
        </button>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer" style={{ padding: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        {/* Simplified Credit Card */}
        <div style={{ padding: '12px', background: 'var(--bg-card-secondary)', borderRadius: '8px', border: '1px solid var(--border-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>CRÉDITOS</span>
            <Zap size={14} style={{ color: 'var(--green-primary)' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
            {isAdmin ? 'Ilimitado' : totalCredits} <span style={{ fontSize: '12px', fontWeight: '400', color: 'var(--text-secondary)' }}>restantes</span>
          </div>
          {!isAdmin && (
            <div style={{ width: '100%', height: '3px', background: 'var(--border-primary)', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.max(0, 100 - usedPercent)}%`, height: '100%', background: 'var(--green-primary)' }} />
            </div>
          )}
        </div>

        {/* Simplified Plan Link */}
        <NavLink to="/configuracoes" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'transparent', borderRadius: 'var(--radius-md)', textDecoration: 'none', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={14} />
            <span style={{ fontSize: '13px', fontWeight: '500' }}>Plano {plan?.name || 'Starter'}</span>
          </div>
          <ChevronRight size={14} />
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

        {/* Admin Simulator Widget */}
        {isRealAdmin && !collapsed && (
          <details style={{
            marginTop: '8px', padding: '10px', background: 'var(--bg-hover)', 
            border: '1px dashed var(--border-primary)', borderRadius: '8px',
            cursor: 'pointer'
          }}>
            <summary style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', outline: 'none', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Simulador (Admin)</span>
              <Settings size={12} />
            </summary>
            
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-primary)' }}>Modo Usuário?</label>
              <input 
                type="checkbox" 
                checked={isSimulatingUser} 
                onChange={(e) => setIsSimulatingUser(e.target.checked)} 
                style={{ cursor: 'pointer' }}
              />
            </div>

            <select 
              value={mockPlanId || user?.realPlanId || 'starter'}
              onChange={(e) => setMockPlanId(e.target.value)}
              style={{
                width: '100%', padding: '4px 6px', fontSize: '11px', 
                background: 'var(--bg-card)', border: '1px solid var(--border-primary)', 
                borderRadius: '4px', color: 'var(--text-primary)', outline: 'none'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <option value="starter">Plano Starter</option>
              <option value="growth">Plano Growth</option>
              <option value="pro">Plano Pro</option>
              <option value="agency">Plano Agency</option>
            </select>
          </details>
        )}
      </div>
    </aside>
  );
}
