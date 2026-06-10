import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Target,
  BarChart3,
  CreditCard,
  Shield,
  Star,
  MessageSquare,
  DollarSign,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useApp } from '../../contexts/AppContext.jsx';
import { formatDate, formatDateTime, formatCurrency, getStatusColor } from '../../utils/formatters.js';

export default function AdminPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Redirect if not admin
  useEffect(() => {
    if (user && !isAdmin) {
      navigate('/hoje');
    }
  }, [user, isAdmin, navigate]);

  const {
    allUsers,
    allCampaigns,
    allLeads,
    feedbacks,
    payments,
    creditTransactions,
    plans,
    adminUpdateUser,
    adminAddCredits,
  } = useApp();

  const [activeTab, setActiveTab] = useState('usuarios');

  // Campaign Filter in Campaigns Tab
  const [selectedUserFilter, setSelectedUserFilter] = useState('todos');

  // Leads Filter in Leads Tab
  const [selectedCampaignFilter, setSelectedCampaignFilter] = useState('todos');
  const [selectedLeadStatusFilter, setSelectedLeadStatusFilter] = useState('todos');

  if (!user || !isAdmin) return null;

  // Stats
  const totalUsers = allUsers.length;
  const totalCampaigns = allCampaigns.length;
  const totalLeads = allLeads.length;
  const totalRevenue = payments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const tabs = [
    { id: 'usuarios', label: 'Usuários' },
    { id: 'campanhas', label: 'Campanhas' },
    { id: 'leads', label: 'Leads' },
    { id: 'planos', label: 'Planos' },
    { id: 'creditos', label: 'Créditos' },
    { id: 'feedbacks', label: 'Feedbacks' },
    { id: 'pagamentos', label: 'Pagamentos' },
  ];

  const handleToggleAdmin = async (targetUser) => {
    const newRole = targetUser.role === 'admin' ? 'subscriber' : 'admin';
    try {
      await adminUpdateUser(targetUser.id, { role: newRole });
      alert(`Role do usuário ${targetUser.name} alterado para ${newRole}.`);
    } catch (err) {
      alert('Erro ao alterar permissões do usuário.');
    }
  };

  const handleAddCreditsPrompt = async (targetUserId) => {
    const amountStr = prompt('Quantidade de créditos a adicionar (pode ser negativo para remover):');
    if (amountStr === null) return;
    const amount = parseInt(amountStr);
    if (isNaN(amount) || amount === 0) {
      alert('Por favor insira um número inteiro válido.');
      return;
    }
    try {
      await adminAddCredits(targetUserId, amount);
      alert(`Ajuste de créditos efetuado com sucesso!`);
    } catch (err) {
      alert('Erro ao ajustar créditos.');
    }
  };

  const getUserNameById = (userId) => {
    const u = allUsers.find((item) => item.id === userId);
    return u ? u.name : '—';
  };

  const getCampaignNameById = (campId) => {
    const c = allCampaigns.find((item) => item.id === campId);
    return c ? c.name : '—';
  };

  return (
    <div className="page-container" style={{ padding: 'var(--space-2xl)' }}>
      {/* Top Header */}
      <div className="page-header" style={{ marginBottom: 'var(--space-2xl)' }}>
        <h1 className="page-title" style={{ fontSize: 'var(--font-size-3xl)', fontWeight: '800', color: 'var(--text-primary)' }}>Painel Administrativo</h1>
        <p className="page-subtitle" style={{ color: 'var(--text-muted)' }}>Métricas da plataforma, usuários cadastrados, faturas e logs</p>
      </div>

      {/* Admin Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="stat-card">
          <div className="stat-card-icon green"><Users size={20} /></div>
          <div className="stat-card-value">{totalUsers}</div>
          <div className="stat-card-label">Total de Usuários</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon blue"><Target size={20} /></div>
          <div className="stat-card-value">{totalCampaigns}</div>
          <div className="stat-card-label">Campanhas Ativas</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon green"><BarChart3 size={20} /></div>
          <div className="stat-card-value">{totalLeads}</div>
          <div className="stat-card-label">Leads Gerados</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon yellow"><CreditCard size={20} /></div>
          <div className="stat-card-value">{formatCurrency(totalRevenue)}</div>
          <div className="stat-card-label">Faturamento Geral</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="pill-group" style={{ marginBottom: 'var(--space-lg)', overflowX: 'auto', display: 'flex', flexWrap: 'nowrap' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`pill ${activeTab === tab.id ? 'active' : ''}`}
            style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TABS VIEWPORT */}
      <div className="card" style={{ background: 'var(--bg-card)', padding: 'var(--space-lg)' }}>
        {/* USERS TAB */}
        {activeTab === 'usuarios' && (
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  <th style={{ padding: 'var(--space-md)' }}>Nome</th>
                  <th style={{ padding: 'var(--space-md)' }}>Email</th>
                  <th style={{ padding: 'var(--space-md)' }}>Role</th>
                  <th style={{ padding: 'var(--space-md)' }}>Plano</th>
                  <th style={{ padding: 'var(--space-md)' }}>Carteira de Créditos</th>
                  <th style={{ padding: 'var(--space-md)' }}>Cadastro</th>
                  <th style={{ padding: 'var(--space-md)', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: 'var(--space-md)', fontWeight: '600' }}>{u.name}</td>
                    <td style={{ padding: 'var(--space-md)' }}>{u.email}</td>
                    <td style={{ padding: 'var(--space-md)' }}>
                      <span className={`badge badge-${u.role === 'admin' ? 'green' : 'blue'}`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-md)', textTransform: 'capitalize' }}>{u.planId}</td>
                    <td style={{ padding: 'var(--space-md)' }}>
                      <span style={{ fontSize: 'var(--font-size-xs)' }}>
                        Base: {u.creditWallet?.baseCredits || 0} | Avulsos: {u.creditWallet?.purchasedCredits || 0}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-md)', fontSize: 'var(--font-size-xs)' }}>{formatDate(u.createdAt)}</td>
                    <td style={{ padding: 'var(--space-md)', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 'var(--space-xs)' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleToggleAdmin(u)}>
                          {u.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={() => handleAddCreditsPrompt(u.id)}>
                          Ajustar Créditos
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* CAMPAIGNS TAB */}
        {activeTab === 'campanhas' && (
          <div>
            <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
              <select
                className="form-input"
                style={{ width: '250px' }}
                value={selectedUserFilter}
                onChange={(e) => setSelectedUserFilter(e.target.value)}
              >
                <option value="todos">Todos usuários</option>
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="table-container" style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                    <th style={{ padding: 'var(--space-md)' }}>Campanha</th>
                    <th style={{ padding: 'var(--space-md)' }}>Usuário</th>
                    <th style={{ padding: 'var(--space-md)' }}>Segmento</th>
                    <th style={{ padding: 'var(--space-md)' }}>Localização</th>
                    <th style={{ padding: 'var(--space-md)' }}>Qtd Leads</th>
                    <th style={{ padding: 'var(--space-md)' }}>Status</th>
                    <th style={{ padding: 'var(--space-md)' }}>Criada em</th>
                  </tr>
                </thead>
                <tbody>
                  {allCampaigns
                    .filter((c) => selectedUserFilter === 'todos' || c.userId === selectedUserFilter)
                    .map((c) => (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: 'var(--space-md)', fontWeight: '600' }}>{c.name}</td>
                        <td style={{ padding: 'var(--space-md)' }}>{getUserNameById(c.userId)}</td>
                        <td style={{ padding: 'var(--space-md)' }}>{c.segment || '—'}</td>
                        <td style={{ padding: 'var(--space-md)' }}>{c.location || '—'}</td>
                        <td style={{ padding: 'var(--space-md)' }}>{c.desiredCount || '—'}</td>
                        <td style={{ padding: 'var(--space-md)' }}>
                          <span className={`badge badge-${getStatusColor(c.status)}`}>{c.status}</span>
                        </td>
                        <td style={{ padding: 'var(--space-md)', fontSize: 'var(--font-size-xs)' }}>{formatDate(c.createdAt)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* LEADS TAB */}
        {activeTab === 'leads' && (
          <div>
            <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-md)', flexWrap: 'wrap' }}>
              <select
                className="form-input"
                style={{ width: '220px' }}
                value={selectedCampaignFilter}
                onChange={(e) => setSelectedCampaignFilter(e.target.value)}
              >
                <option value="todos">Todas campanhas</option>
                {allCampaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                className="form-input"
                style={{ width: '180px' }}
                value={selectedLeadStatusFilter}
                onChange={(e) => setSelectedLeadStatusFilter(e.target.value)}
              >
                <option value="todos">Todos status</option>
                <option value="novo">Novo</option>
                <option value="contactado">Contactado</option>
                <option value="respondeu">Respondeu</option>
                <option value="fechado">Fechado</option>
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
                    <th style={{ padding: 'var(--space-md)' }}>Última Interação</th>
                  </tr>
                </thead>
                <tbody>
                  {allLeads
                    .filter((l) => selectedCampaignFilter === 'todos' || l.campaignId === selectedCampaignFilter)
                    .filter((l) => selectedLeadStatusFilter === 'todos' || l.status === selectedLeadStatusFilter)
                    .map((l) => (
                      <tr key={l.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: 'var(--space-md)' }}>
                          <div style={{ fontWeight: '600' }}>{l.name}</div>
                          {l.username && <span className="text-green" style={{ fontSize: 'var(--font-size-xs)' }}>@{l.username}</span>}
                        </td>
                        <td style={{ padding: 'var(--space-md)' }}>{getCampaignNameById(l.campaignId)}</td>
                        <td style={{ padding: 'var(--space-md)', fontWeight: '700' }}>{l.score} pts</td>
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

        {/* PLANOS TAB */}
        {activeTab === 'planos' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-md)' }}>
            {plans.map((p) => (
              <div key={p.id} className="card card-secondary" style={{ padding: 'var(--space-md)', border: '1px solid var(--border-primary)' }}>
                <span className="badge badge-green" style={{ marginBottom: '8px' }}>ATIVO NO SISTEMA</span>
                <h4 style={{ fontSize: 'var(--font-size-md)', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>{p.name}</h4>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: '800', color: 'var(--text-primary)' }}>R$ {p.monthlyPrice}/mês</div>
                <div className="text-xs text-muted" style={{ marginTop: '8px' }}>
                  Créditos inclusos: {p.includedCredits}
                </div>
                <div className="text-xs text-muted">
                  Preço do excedente: R$ {p.extraLeadPrice.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CREDIT TRANSACTIONS TAB */}
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
                  <th style={{ padding: 'var(--space-md)' }}>Motivo / Descrição</th>
                </tr>
              </thead>
              <tbody>
                {creditTransactions.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: 'var(--space-md)', fontSize: 'var(--font-size-xs)' }}>{formatDateTime(t.createdAt)}</td>
                    <td style={{ padding: 'var(--space-md)' }}>{getUserNameById(t.userId)}</td>
                    <td style={{ padding: 'var(--space-md)', fontWeight: '700', color: t.amount > 0 ? 'var(--green-primary)' : 'var(--color-error)' }}>
                      {t.amount > 0 ? `+${t.amount}` : t.amount}
                    </td>
                    <td style={{ padding: 'var(--space-md)' }}>{t.balanceBefore}</td>
                    <td style={{ padding: 'var(--space-md)' }}>{t.balanceAfter}</td>
                    <td style={{ padding: 'var(--space-md)', fontSize: 'var(--font-size-sm)' }}>{t.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* FEEDBACKS TAB */}
        {activeTab === 'feedbacks' && (
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  <th style={{ padding: 'var(--space-md)' }}>Data</th>
                  <th style={{ padding: 'var(--space-md)' }}>Usuário</th>
                  <th style={{ padding: 'var(--space-md)' }}>Tipo</th>
                  <th style={{ padding: 'var(--space-md)' }}>Mensagem</th>
                  <th style={{ padding: 'var(--space-md)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.map((f) => (
                  <tr key={f.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: 'var(--space-md)', fontSize: 'var(--font-size-xs)' }}>{formatDate(f.createdAt)}</td>
                    <td style={{ padding: 'var(--space-md)' }}>{getUserNameById(f.userId)}</td>
                    <td style={{ padding: 'var(--space-md)' }}>
                      <span className={`badge badge-${f.type === 'Problema' ? 'red' : f.type === 'Elogio' ? 'green' : 'blue'}`}>{f.type}</span>
                    </td>
                    <td style={{ padding: 'var(--space-md)', fontSize: 'var(--font-size-sm)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={f.message}>
                      {f.message}
                    </td>
                    <td style={{ padding: 'var(--space-md)' }}>
                      <span className="badge badge-green">Lido</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAYMENTS TAB */}
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
                {payments.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: 'var(--space-md)', fontSize: 'var(--font-size-xs)' }}>{formatDate(p.createdAt)}</td>
                    <td style={{ padding: 'var(--space-md)' }}>{getUserNameById(p.userId)}</td>
                    <td style={{ padding: 'var(--space-md)', fontWeight: '600' }}>{p.productName}</td>
                    <td style={{ padding: 'var(--space-md)' }}>{formatCurrency(p.amount)}</td>
                    <td style={{ padding: 'var(--space-md)' }}>
                      <span className="badge badge-green">Aprovado</span>
                    </td>
                    <td style={{ padding: 'var(--space-md)', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Stripe Checkout</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
