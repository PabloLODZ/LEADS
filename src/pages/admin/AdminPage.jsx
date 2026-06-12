import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Target, BarChart3, CreditCard, Shield, MessageSquare,
  DollarSign, Plus, Minus, Lock, Unlock, X, Check, ChevronDown,
  RefreshCw, AlertTriangle, Zap, FileText,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useApp } from '../../contexts/AppContext.jsx';
import { PLANS } from '../../data/plans.js';
import { formatDate, formatDateTime, formatCurrency, getStatusColor } from '../../utils/formatters.js';
import { getTotalCredits } from '../../utils/creditEngine.js';

// ── Mini modal component ──────────────────────────────────────────────────────
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', zIndex: 200 }}
        onClick={onClose}
      />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        background: 'var(--bg-card)', border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-xl)', padding: '28px', zIndex: 201,
        width: '100%', maxWidth: '440px', boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontWeight: '700', fontSize: '16px', color: 'var(--text-primary)' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </>
  );
}

const ACTION_LABELS = {
  add_credits: '➕ Adicionou créditos',
  remove_credits: '➖ Removeu créditos',
  change_plan: '📋 Alterou plano',
  block_user: '🔒 Bloqueou usuário',
  unblock_user: '🔓 Desbloqueou usuário',
  change_role: '🛡️ Alterou permissão',
};

export default function AdminPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const {
    allUsers, allCampaigns, allLeads, feedbacks, payments,
    creditTransactions, adminLogs, plans,
    adminUpdateUser, adminAddCredits, adminBlockUser, adminChangePlan,
  } = useApp();

  const [activeTab, setActiveTab] = useState('usuarios');
  const [selectedUserFilter, setSelectedUserFilter] = useState('todos');
  const [selectedCampaignFilter, setSelectedCampaignFilter] = useState('todos');
  const [selectedLeadStatusFilter, setSelectedLeadStatusFilter] = useState('todos');

  // Modal states
  const [creditsModal, setCreditsModal] = useState({ open: false, user: null, amount: '', note: '', loading: false });
  const [planModal, setPlanModal] = useState({ open: false, user: null, planId: '', note: '', loading: false });
  const [blockModal, setBlockModal] = useState({ open: false, user: null, reason: '', loading: false });

  useEffect(() => {
    if (user && !isAdmin) navigate('/hoje');
  }, [user, isAdmin, navigate]);

  if (!user || !isAdmin) return null;

  const totalUsers = allUsers.length;
  const totalCampaigns = allCampaigns.length;
  const totalLeads = allLeads.length;
  const totalRevenue = payments.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const blockedUsers = allUsers.filter(u => u.isBlocked).length;

  const tabs = [
    { id: 'usuarios',   label: 'Usuários',   icon: Users },
    { id: 'campanhas',  label: 'Campanhas',  icon: Target },
    { id: 'leads',      label: 'Leads',      icon: BarChart3 },
    { id: 'planos',     label: 'Planos',     icon: Zap },
    { id: 'creditos',   label: 'Créditos',   icon: CreditCard },
    { id: 'logs',       label: 'Logs Admin', icon: FileText },
    { id: 'feedbacks',  label: 'Feedbacks',  icon: MessageSquare },
    { id: 'pagamentos', label: 'Pagamentos', icon: DollarSign },
  ];

  const getUserNameById = (userId) => {
    const u = allUsers.find(item => item.id === userId);
    return u ? u.name : '—';
  };

  const getCampaignNameById = (campId) => {
    const c = allCampaigns.find(item => item.id === campId);
    return c ? c.name : '—';
  };

  // ─── Credit Modal Handler ───
  const handleOpenCreditsModal = (targetUser) => {
    setCreditsModal({ open: true, user: targetUser, amount: '', note: '', loading: false });
  };

  const handleConfirmCredits = async () => {
    const amount = parseInt(creditsModal.amount);
    if (isNaN(amount) || amount === 0) return;
    setCreditsModal(m => ({ ...m, loading: true }));
    try {
      await adminAddCredits(creditsModal.user.id, amount, creditsModal.note);
    } finally {
      setCreditsModal({ open: false, user: null, amount: '', note: '', loading: false });
    }
  };

  // ─── Plan Modal Handler ───
  const handleOpenPlanModal = (targetUser) => {
    setPlanModal({ open: true, user: targetUser, planId: targetUser.planId || 'starter', note: '', loading: false });
  };

  const handleConfirmPlan = async () => {
    if (!planModal.planId) return;
    setPlanModal(m => ({ ...m, loading: true }));
    try {
      await adminChangePlan(planModal.user.id, planModal.planId, planModal.note);
    } finally {
      setPlanModal({ open: false, user: null, planId: '', note: '', loading: false });
    }
  };

  // ─── Block Modal Handler ───
  const handleOpenBlockModal = (targetUser) => {
    setBlockModal({ open: true, user: targetUser, reason: '', loading: false });
  };

  const handleConfirmBlock = async () => {
    setBlockModal(m => ({ ...m, loading: true }));
    try {
      const willBlock = !blockModal.user.isBlocked;
      await adminBlockUser(blockModal.user.id, willBlock, blockModal.reason);
    } finally {
      setBlockModal({ open: false, user: null, reason: '', loading: false });
    }
  };

  // ─── Toggle Admin ───
  const handleToggleAdmin = async (targetUser) => {
    const newRole = targetUser.role === 'admin' ? 'subscriber' : 'admin';
    await adminUpdateUser(targetUser.id, { role: newRole });
  };

  return (
    <div className="page-container" style={{ padding: 'var(--space-2xl)' }}>
      <div className="page-header" style={{ marginBottom: 'var(--space-xl)' }}>
        <h1 className="page-title">Painel Administrativo</h1>
        <p className="page-subtitle">Gerenciamento completo da plataforma</p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="stat-card">
          <div className="stat-card-icon green"><Users size={20} /></div>
          <div className="stat-card-value">{totalUsers}</div>
          <div className="stat-card-label">Usuários</div>
          {blockedUsers > 0 && <div style={{ fontSize: '11px', color: 'var(--color-error)', marginTop: '4px' }}>{blockedUsers} bloqueado(s)</div>}
        </div>
        <div className="stat-card">
          <div className="stat-card-icon blue"><Target size={20} /></div>
          <div className="stat-card-value">{totalCampaigns}</div>
          <div className="stat-card-label">Campanhas</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon green"><BarChart3 size={20} /></div>
          <div className="stat-card-value">{totalLeads}</div>
          <div className="stat-card-label">Leads Gerados</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon yellow"><CreditCard size={20} /></div>
          <div className="stat-card-value">{formatCurrency(totalRevenue)}</div>
          <div className="stat-card-label">Faturamento</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="pill-group" style={{ marginBottom: 'var(--space-lg)', overflowX: 'auto', display: 'flex', flexWrap: 'nowrap', gap: '6px' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`pill ${activeTab === tab.id ? 'active' : ''}`}
            style={{ padding: '8px 16px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 'var(--space-lg)' }}>

        {/* ── USERS TAB ── */}
        {activeTab === 'usuarios' && (
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  <th style={{ padding: 'var(--space-md)' }}>Nome</th>
                  <th style={{ padding: 'var(--space-md)' }}>Role</th>
                  <th style={{ padding: 'var(--space-md)' }}>Plano</th>
                  <th style={{ padding: 'var(--space-md)' }}>Créditos</th>
                  <th style={{ padding: 'var(--space-md)' }}>Leads</th>
                  <th style={{ padding: 'var(--space-md)' }}>Status</th>
                  <th style={{ padding: 'var(--space-md)' }}>Cadastro</th>
                  <th style={{ padding: 'var(--space-md)', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map(u => {
                  const userLeadsCount = allLeads.filter(l => l.userId === u.id).length;
                  const totalCred = getTotalCredits(u.creditWallet);
                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)', opacity: u.isBlocked ? 0.6 : 1 }}>
                      <td style={{ padding: 'var(--space-md)', fontWeight: '600' }}>
                        {u.name}
                        {u.isBlocked && <span style={{ marginLeft: '6px', fontSize: '10px', color: 'var(--color-error)', background: 'var(--color-error-bg)', padding: '2px 6px', borderRadius: '99px' }}>BLOQUEADO</span>}
                      </td>
                      <td style={{ padding: 'var(--space-md)' }}>
                        <span className={`badge badge-${u.role === 'admin' ? 'green' : 'blue'}`}>{u.role.toUpperCase()}</span>
                      </td>
                      <td style={{ padding: 'var(--space-md)', textTransform: 'capitalize' }}>{u.planId}</td>
                      <td style={{ padding: 'var(--space-md)', fontWeight: '700', color: totalCred < 10 ? 'var(--color-error)' : 'var(--text-primary)' }}>
                        {totalCred}
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '400', display: 'block' }}>
                          base:{u.creditWallet?.baseCredits || 0} + avulso:{u.creditWallet?.purchasedCredits || 0}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-md)' }}>{userLeadsCount}</td>
                      <td style={{ padding: 'var(--space-md)' }}>
                        <span className={`badge badge-${u.subscriptionStatus === 'active' ? 'green' : u.subscriptionStatus === 'trial' ? 'blue' : 'red'}`}>
                          {u.subscriptionStatus || 'trial'}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-md)', fontSize: 'var(--font-size-xs)' }}>{formatDate(u.createdAt)}</td>
                      <td style={{ padding: 'var(--space-md)', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleOpenCreditsModal(u)} title="Ajustar créditos">
                            <CreditCard size={12} /> Créditos
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleOpenPlanModal(u)} title="Alterar plano">
                            <Zap size={12} /> Plano
                          </button>
                          <button
                            className={`btn btn-sm ${u.isBlocked ? 'btn-primary' : 'btn-danger'}`}
                            onClick={() => handleOpenBlockModal(u)}
                            title={u.isBlocked ? 'Desbloquear' : 'Bloquear'}
                          >
                            {u.isBlocked ? <Unlock size={12} /> : <Lock size={12} />}
                            {u.isBlocked ? 'Reativar' : 'Bloquear'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── CAMPAIGNS TAB ── */}
        {activeTab === 'campanhas' && (
          <div>
            <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
              <select className="form-input" style={{ width: '250px' }} value={selectedUserFilter} onChange={e => setSelectedUserFilter(e.target.value)}>
                <option value="todos">Todos usuários</option>
                {allUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="table-container" style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                    <th style={{ padding: 'var(--space-md)' }}>Campanha</th>
                    <th style={{ padding: 'var(--space-md)' }}>Usuário</th>
                    <th style={{ padding: 'var(--space-md)' }}>Segmento</th>
                    <th style={{ padding: 'var(--space-md)' }}>Leads</th>
                    <th style={{ padding: 'var(--space-md)' }}>Fechados</th>
                    <th style={{ padding: 'var(--space-md)' }}>Status</th>
                    <th style={{ padding: 'var(--space-md)' }}>Criada</th>
                  </tr>
                </thead>
                <tbody>
                  {allCampaigns
                    .filter(c => selectedUserFilter === 'todos' || c.userId === selectedUserFilter)
                    .map(c => {
                      const campLeads = allLeads.filter(l => l.campaignId === c.id);
                      const closed = campLeads.filter(l => l.status === 'fechado').length;
                      return (
                        <tr key={c.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: 'var(--space-md)', fontWeight: '600' }}>{c.name}</td>
                          <td style={{ padding: 'var(--space-md)' }}>{getUserNameById(c.userId)}</td>
                          <td style={{ padding: 'var(--space-md)' }}>{c.segment || '—'}</td>
                          <td style={{ padding: 'var(--space-md)', fontWeight: '700' }}>{campLeads.length}</td>
                          <td style={{ padding: 'var(--space-md)', color: 'var(--color-success)', fontWeight: '700' }}>{closed}</td>
                          <td style={{ padding: 'var(--space-md)' }}>
                            <span className={`badge badge-${getStatusColor(c.status)}`}>{c.status}</span>
                          </td>
                          <td style={{ padding: 'var(--space-md)', fontSize: 'var(--font-size-xs)' }}>{formatDate(c.createdAt)}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── LEADS TAB ── */}
        {activeTab === 'leads' && (
          <div>
            <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-md)', flexWrap: 'wrap' }}>
              <select className="form-input" style={{ width: '220px' }} value={selectedCampaignFilter} onChange={e => setSelectedCampaignFilter(e.target.value)}>
                <option value="todos">Todas campanhas</option>
                {allCampaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className="form-input" style={{ width: '180px' }} value={selectedLeadStatusFilter} onChange={e => setSelectedLeadStatusFilter(e.target.value)}>
                <option value="todos">Todos status</option>
                <option value="novo">Novo</option>
                <option value="contactado">Contactado</option>
                <option value="respondeu">Respondeu</option>
                <option value="negociacao">Negociação</option>
                <option value="fechado">Fechado</option>
                <option value="perdido">Perdido</option>
              </select>
            </div>
            <div className="table-container" style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                    <th style={{ padding: 'var(--space-md)' }}>Lead</th>
                    <th style={{ padding: 'var(--space-md)' }}>Campanha</th>
                    <th style={{ padding: 'var(--space-md)' }}>Score</th>
                    <th style={{ padding: 'var(--space-md)' }}>Status</th>
                    <th style={{ padding: 'var(--space-md)' }}>Cidade</th>
                    <th style={{ padding: 'var(--space-md)' }}>Atualizado</th>
                  </tr>
                </thead>
                <tbody>
                  {allLeads
                    .filter(l => selectedCampaignFilter === 'todos' || l.campaignId === selectedCampaignFilter)
                    .filter(l => selectedLeadStatusFilter === 'todos' || l.status === selectedLeadStatusFilter)
                    .slice(0, 100)
                    .map(l => (
                      <tr key={l.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: 'var(--space-md)' }}>
                          <div style={{ fontWeight: '600' }}>{l.name}</div>
                          {l.username && <span className="text-green" style={{ fontSize: 'var(--font-size-xs)' }}>@{l.username}</span>}
                        </td>
                        <td style={{ padding: 'var(--space-md)' }}>{getCampaignNameById(l.campaignId)}</td>
                        <td style={{ padding: 'var(--space-md)', fontWeight: '700' }}>{l.score}</td>
                        <td style={{ padding: 'var(--space-md)' }}>
                          <span className={`badge badge-${getStatusColor(l.status)}`}>{l.status}</span>
                        </td>
                        <td style={{ padding: 'var(--space-md)' }}>{l.city || '—'}</td>
                        <td style={{ padding: 'var(--space-md)', fontSize: 'var(--font-size-xs)' }}>{formatDate(l.updatedAt)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── PLANOS TAB ── */}
        {activeTab === 'planos' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-md)' }}>
            {PLANS.map(p => {
              const usersOnPlan = allUsers.filter(u => u.planId === p.id).length;
              return (
                <div key={p.id} className="card" style={{ padding: 'var(--space-md)' }}>
                  <span className="badge badge-green" style={{ marginBottom: '8px', display: 'inline-block' }}>ATIVO</span>
                  <h4 style={{ fontSize: 'var(--font-size-md)', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>{p.name}</h4>
                  <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: '800', color: 'var(--text-primary)' }}>R$ {p.monthlyPrice}/mês</div>
                  <div className="text-xs text-muted" style={{ marginTop: '8px' }}>Créditos: {p.includedCredits}</div>
                  <div className="text-xs text-muted">Extra: R$ {p.extraLeadPrice?.toFixed(2)}</div>
                  <div style={{ marginTop: '12px', padding: '8px', background: 'var(--green-glow)', borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: '700', color: 'var(--green-primary)', textAlign: 'center' }}>
                    {usersOnPlan} usuário{usersOnPlan !== 1 ? 's' : ''}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── CREDIT TRANSACTIONS TAB ── */}
        {activeTab === 'creditos' && (
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  <th style={{ padding: 'var(--space-md)' }}>Data</th>
                  <th style={{ padding: 'var(--space-md)' }}>Usuário</th>
                  <th style={{ padding: 'var(--space-md)' }}>Ajuste</th>
                  <th style={{ padding: 'var(--space-md)' }}>Antes</th>
                  <th style={{ padding: 'var(--space-md)' }}>Depois</th>
                  <th style={{ padding: 'var(--space-md)' }}>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {creditTransactions.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: 'var(--space-md)', fontSize: 'var(--font-size-xs)' }}>{formatDateTime(t.createdAt)}</td>
                    <td style={{ padding: 'var(--space-md)' }}>{getUserNameById(t.userId)}</td>
                    <td style={{ padding: 'var(--space-md)', fontWeight: '700', color: t.amount > 0 ? 'var(--green-primary)' : t.amount < 0 ? 'var(--color-error)' : 'var(--text-muted)' }}>
                      {t.amount > 0 ? `+${t.amount}` : t.amount === 0 ? '—' : t.amount}
                    </td>
                    <td style={{ padding: 'var(--space-md)' }}>{t.balanceBefore}</td>
                    <td style={{ padding: 'var(--space-md)' }}>{t.balanceAfter}</td>
                    <td style={{ padding: 'var(--space-md)', fontSize: 'var(--font-size-sm)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── ADMIN LOGS TAB ── */}
        {activeTab === 'logs' && (
          <div className="table-container" style={{ overflowX: 'auto' }}>
            {adminLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <FileText size={40} style={{ opacity: 0.3, marginBottom: '12px', display: 'block', margin: '0 auto 12px' }} />
                <p>Nenhuma ação administrativa registrada ainda.</p>
              </div>
            ) : (
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                    <th style={{ padding: 'var(--space-md)' }}>Data</th>
                    <th style={{ padding: 'var(--space-md)' }}>Admin</th>
                    <th style={{ padding: 'var(--space-md)' }}>Ação</th>
                    <th style={{ padding: 'var(--space-md)' }}>Usuário Afetado</th>
                    <th style={{ padding: 'var(--space-md)' }}>Antes</th>
                    <th style={{ padding: 'var(--space-md)' }}>Depois</th>
                    <th style={{ padding: 'var(--space-md)' }}>Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {adminLogs.map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: 'var(--space-md)', fontSize: 'var(--font-size-xs)' }}>{formatDateTime(log.createdAt)}</td>
                      <td style={{ padding: 'var(--space-md)', fontWeight: '600' }}>{getUserNameById(log.adminId)}</td>
                      <td style={{ padding: 'var(--space-md)' }}>
                        <span style={{ fontSize: '12px' }}>{ACTION_LABELS[log.action] || log.action}</span>
                      </td>
                      <td style={{ padding: 'var(--space-md)' }}>{getUserNameById(log.targetUserId)}</td>
                      <td style={{ padding: 'var(--space-md)', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {JSON.stringify(log.previousValue).replace(/[{}"]/g, '')}
                      </td>
                      <td style={{ padding: 'var(--space-md)', fontSize: '12px', color: 'var(--green-primary)' }}>
                        {JSON.stringify(log.newValue).replace(/[{}"]/g, '')}
                      </td>
                      <td style={{ padding: 'var(--space-md)', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{log.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── FEEDBACKS TAB ── */}
        {activeTab === 'feedbacks' && (
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  <th style={{ padding: 'var(--space-md)' }}>Data</th>
                  <th style={{ padding: 'var(--space-md)' }}>Usuário</th>
                  <th style={{ padding: 'var(--space-md)' }}>Tipo</th>
                  <th style={{ padding: 'var(--space-md)' }}>Mensagem</th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.map(f => (
                  <tr key={f.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: 'var(--space-md)', fontSize: 'var(--font-size-xs)' }}>{formatDate(f.createdAt)}</td>
                    <td style={{ padding: 'var(--space-md)' }}>{getUserNameById(f.userId)}</td>
                    <td style={{ padding: 'var(--space-md)' }}>
                      <span className={`badge badge-${f.type === 'Problema' ? 'red' : f.type === 'Elogio' ? 'green' : 'blue'}`}>{f.type}</span>
                    </td>
                    <td style={{ padding: 'var(--space-md)', fontSize: 'var(--font-size-sm)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={f.message}>
                      {f.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── PAYMENTS TAB ── */}
        {activeTab === 'pagamentos' && (
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  <th style={{ padding: 'var(--space-md)' }}>Data</th>
                  <th style={{ padding: 'var(--space-md)' }}>Usuário</th>
                  <th style={{ padding: 'var(--space-md)' }}>Produto</th>
                  <th style={{ padding: 'var(--space-md)' }}>Valor</th>
                  <th style={{ padding: 'var(--space-md)' }}>Status</th>
                  <th style={{ padding: 'var(--space-md)' }}>Provedor</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: 'var(--space-md)', fontSize: 'var(--font-size-xs)' }}>{formatDate(p.createdAt)}</td>
                    <td style={{ padding: 'var(--space-md)' }}>{getUserNameById(p.userId)}</td>
                    <td style={{ padding: 'var(--space-md)', fontWeight: '600' }}>{p.productName || p.planId || '—'}</td>
                    <td style={{ padding: 'var(--space-md)' }}>{formatCurrency(p.amount)}</td>
                    <td style={{ padding: 'var(--space-md)' }}>
                      <span className="badge badge-green">Aprovado</span>
                    </td>
                    <td style={{ padding: 'var(--space-md)', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Stripe</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODALS ── */}
      {/* Credits Modal */}
      <Modal isOpen={creditsModal.open} onClose={() => setCreditsModal(m => ({ ...m, open: false }))} title={`Ajustar créditos — ${creditsModal.user?.name}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Saldo atual</label>
            <div style={{ fontWeight: '700', fontSize: '20px', color: 'var(--text-primary)' }}>
              {getTotalCredits(creditsModal.user?.creditWallet)} créditos
            </div>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Quantidade a ajustar <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>(positivo para adicionar, negativo para remover)</span>
            </label>
            <input
              type="number"
              className="form-input"
              placeholder="Ex: 50 ou -10"
              value={creditsModal.amount}
              onChange={e => setCreditsModal(m => ({ ...m, amount: e.target.value }))}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Observação (opcional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: Bônus de indicação"
              value={creditsModal.note}
              onChange={e => setCreditsModal(m => ({ ...m, note: e.target.value }))}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button className="btn btn-ghost" onClick={() => setCreditsModal(m => ({ ...m, open: false }))}>Cancelar</button>
            <button
              className="btn btn-primary"
              disabled={creditsModal.loading || !creditsModal.amount || isNaN(parseInt(creditsModal.amount)) || parseInt(creditsModal.amount) === 0}
              onClick={handleConfirmCredits}
            >
              {creditsModal.loading ? 'Salvando...' : 'Confirmar ajuste'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Plan Modal */}
      <Modal isOpen={planModal.open} onClose={() => setPlanModal(m => ({ ...m, open: false }))} title={`Alterar plano — ${planModal.user?.name}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Plano atual: <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{planModal.user?.planId}</strong></label>
            <select
              className="form-input"
              value={planModal.planId}
              onChange={e => setPlanModal(m => ({ ...m, planId: e.target.value }))}
            >
              {PLANS.map(p => <option key={p.id} value={p.id}>{p.name} ({p.includedCredits} créditos)</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Observação</label>
            <input
              type="text"
              className="form-input"
              placeholder="Motivo da alteração"
              value={planModal.note}
              onChange={e => setPlanModal(m => ({ ...m, note: e.target.value }))}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button className="btn btn-ghost" onClick={() => setPlanModal(m => ({ ...m, open: false }))}>Cancelar</button>
            <button className="btn btn-primary" disabled={planModal.loading} onClick={handleConfirmPlan}>
              {planModal.loading ? 'Salvando...' : 'Alterar plano'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Block Modal */}
      <Modal isOpen={blockModal.open} onClose={() => setBlockModal(m => ({ ...m, open: false }))} title={blockModal.user?.isBlocked ? `Reativar — ${blockModal.user?.name}` : `Bloquear — ${blockModal.user?.name}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {blockModal.user?.isBlocked ? (
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Este usuário está bloqueado{blockModal.user?.blockedReason ? ` (motivo: "${blockModal.user?.blockedReason}")` : ''}. Ao confirmar, ele voltará a ter acesso ao sistema.
            </p>
          ) : (
            <>
              <div style={{ background: 'var(--color-error-bg)', border: '1px solid var(--color-error)', borderRadius: 'var(--radius-md)', padding: '12px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <AlertTriangle size={16} color="var(--color-error)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ fontSize: '13px', color: 'var(--color-error)', margin: 0 }}>
                  O usuário não conseguirá mais acessar o sistema. Você poderá desbloquear a qualquer momento.
                </p>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Motivo do bloqueio</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Violação de termos de uso"
                  value={blockModal.reason}
                  onChange={e => setBlockModal(m => ({ ...m, reason: e.target.value }))}
                />
              </div>
            </>
          )}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button className="btn btn-ghost" onClick={() => setBlockModal(m => ({ ...m, open: false }))}>Cancelar</button>
            <button
              className={`btn ${blockModal.user?.isBlocked ? 'btn-primary' : 'btn-danger'}`}
              disabled={blockModal.loading}
              onClick={handleConfirmBlock}
            >
              {blockModal.loading ? 'Salvando...' : blockModal.user?.isBlocked ? '✓ Reativar usuário' : '🔒 Confirmar bloqueio'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
