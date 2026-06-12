import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3, Users, MessageCircle, TrendingUp, Target,
  CheckCircle, XCircle, CreditCard, Sparkles, Filter,
  Calendar, ChevronRight, AlertTriangle, Zap,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { getTotalCredits } from '../../utils/creditEngine.js';
import { formatDate } from '../../utils/formatters.js';

const PERIODS = [
  { id: 'hoje',   label: 'Hoje',     days: 0 },
  { id: '7d',     label: '7 dias',   days: 7 },
  { id: '30d',    label: '30 dias',  days: 30 },
  { id: '90d',    label: '90 dias',  days: 90 },
  { id: 'todos',  label: 'Todos',    days: -1 },
];

function isWithinPeriod(dateStr, days) {
  if (days === -1) return true;
  const now = new Date();
  const date = new Date(dateStr);
  if (days === 0) {
    return date.toDateString() === now.toDateString();
  }
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() - days);
  return date >= cutoff;
}

function KpiCard({ icon: Icon, label, value, color = 'var(--green-primary)', sub, onClick }) {
  return (
    <div
      className="stat-card"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
          background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={18} color={color} />
        </div>
        {onClick && <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{label}</div>
      {sub && <div style={{ fontSize: '11px', color, marginTop: '4px', fontWeight: '600' }}>{sub}</div>}
    </div>
  );
}

function MiniBar({ label, value, maxValue, color }) {
  const pct = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>{value}</span>
      </div>
      <div style={{ height: '6px', background: 'var(--bg-hover)', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, background: color,
          borderRadius: '99px', transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { leads, campaigns, creditTransactions, interactions } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [period, setPeriod] = useState('30d');
  const [campaignFilter, setCampaignFilter] = useState('todos');

  const currentPeriod = PERIODS.find(p => p.id === period);

  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const inPeriod = isWithinPeriod(l.createdAt, currentPeriod.days);
      const inCampaign = campaignFilter === 'todos' || l.campaignId === campaignFilter;
      return inPeriod && inCampaign;
    });
  }, [leads, period, campaignFilter, currentPeriod.days]);

  const filteredTx = useMemo(() => {
    return creditTransactions.filter(t => isWithinPeriod(t.createdAt, currentPeriod.days));
  }, [creditTransactions, period, currentPeriod.days]);

  const filteredInteractions = useMemo(() => {
    return interactions.filter(i => isWithinPeriod(i.createdAt, currentPeriod.days));
  }, [interactions, period, currentPeriod.days]);

  // KPIs
  const totalLeads = filteredLeads.length;
  const novos = filteredLeads.filter(l => l.status === 'novo').length;
  const abordados = filteredLeads.filter(l => ['contactado', 'follow_up'].includes(l.status)).length;
  const responderam = filteredLeads.filter(l => ['respondeu', 'qualificado', 'negociacao', 'fechado'].includes(l.status)).length;
  const negociacao = filteredLeads.filter(l => l.status === 'negociacao').length;
  const fechados = filteredLeads.filter(l => l.status === 'fechado').length;
  const perdidos = filteredLeads.filter(l => l.status === 'perdido').length;
  const taxaConversao = totalLeads > 0 ? ((fechados / totalLeads) * 100).toFixed(1) : '0.0';
  const taxaResposta = totalLeads > 0 ? ((responderam / totalLeads) * 100).toFixed(1) : '0.0';

  const creditosConsumidos = filteredTx
    .filter(t => t.amount < 0 || t.type === 'lead_generation')
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);

  const mensagensIA = filteredInteractions.filter(i =>
    i.eventType === 'ai_message_generated' || i.type === 'ai_message'
  ).length;

  // Campaign performance
  const campaignStats = useMemo(() => {
    return campaigns.map(c => {
      const campLeads = filteredLeads.filter(l => l.campaignId === c.id);
      const totalCamp = campLeads.length;
      const respondCamp = campLeads.filter(l => ['respondeu', 'qualificado', 'negociacao', 'fechado'].includes(l.status)).length;
      const closedCamp = campLeads.filter(l => l.status === 'fechado').length;
      const taxa = totalCamp > 0 ? ((closedCamp / totalCamp) * 100).toFixed(1) : '0.0';
      const taxaResp = totalCamp > 0 ? ((respondCamp / totalCamp) * 100).toFixed(1) : '0.0';
      return { ...c, totalLeads: totalCamp, responderam: respondCamp, fechados: closedCamp, taxa, taxaResposta: taxaResp };
    }).filter(c => c.totalLeads > 0).sort((a, b) => parseFloat(b.taxaResposta) - parseFloat(a.taxaResposta));
  }, [campaigns, filteredLeads]);

  const maxCampLeads = Math.max(...campaignStats.map(c => c.totalLeads), 1);

  // Insights
  const leadsAtrasados = leads.filter(l => {
    if (!l.lastInteractionAt || ['fechado', 'perdido'].includes(l.status)) return false;
    const days = (Date.now() - new Date(l.lastInteractionAt).getTime()) / (1000 * 60 * 60 * 24);
    return days > 3 && l.status !== 'novo';
  });

  const leadsSemResposta = leads.filter(l => l.status === 'contactado').length;

  const bestCampaign = campaignStats[0];

  return (
    <div className="page-container" style={{ padding: 'var(--space-2xl)' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1 className="page-title">Relatórios</h1>
          <p className="page-subtitle">Visão geral da sua performance de prospecção</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <Filter size={14} style={{ color: 'var(--text-muted)', alignSelf: 'center' }} />
          {PERIODS.map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`pill ${period === p.id ? 'active' : ''}`}
              style={{ padding: '6px 14px', fontSize: '12px' }}
            >
              {p.label}
            </button>
          ))}
        </div>
        <select
          className="form-input"
          style={{ width: '200px', fontSize: '13px', padding: '7px 12px' }}
          value={campaignFilter}
          onChange={e => setCampaignFilter(e.target.value)}
        >
          <option value="todos">Todas as campanhas</option>
          {campaigns.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Insights */}
      {(leadsAtrasados.length > 0 || leadsSemResposta > 0 || bestCampaign) && (
        <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)', flexWrap: 'wrap' }}>
          {leadsAtrasados.length > 0 && (
            <div style={{
              background: 'var(--color-warning-bg)', border: '1px solid var(--color-warning)',
              borderRadius: 'var(--radius-md)', padding: '10px 16px',
              display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: '1 1 auto',
            }} onClick={() => navigate('/leads?status=follow_up')}>
              <AlertTriangle size={16} color="var(--color-warning)" />
              <span style={{ fontSize: '13px', color: 'var(--color-warning)', fontWeight: '600' }}>
                {leadsAtrasados.length} retorno{leadsAtrasados.length !== 1 ? 's' : ''} atrasado{leadsAtrasados.length !== 1 ? 's' : ''}
              </span>
              <ChevronRight size={13} style={{ color: 'var(--color-warning)', marginLeft: 'auto' }} />
            </div>
          )}
          {leadsSemResposta > 0 && (
            <div style={{
              background: 'var(--color-info-bg)', border: '1px solid var(--color-info)',
              borderRadius: 'var(--radius-md)', padding: '10px 16px',
              display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: '1 1 auto',
            }} onClick={() => navigate('/leads?status=contactado')}>
              <MessageCircle size={16} color="var(--color-info)" />
              <span style={{ fontSize: '13px', color: 'var(--color-info)', fontWeight: '600' }}>
                {leadsSemResposta} lead{leadsSemResposta !== 1 ? 's' : ''} sem resposta
              </span>
              <ChevronRight size={13} style={{ color: 'var(--color-info)', marginLeft: 'auto' }} />
            </div>
          )}
          {bestCampaign && (
            <div style={{
              background: 'var(--green-glow)', border: '1px solid var(--green-primary)',
              borderRadius: 'var(--radius-md)', padding: '10px 16px',
              display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 auto',
            }}>
              <Zap size={16} color="var(--green-primary)" />
              <span style={{ fontSize: '13px', color: 'var(--green-primary)', fontWeight: '600' }}>
                "{bestCampaign.name}" tem melhor taxa de resposta ({bestCampaign.taxaResposta}%)
              </span>
            </div>
          )}
        </div>
      )}

      {/* KPI Grid */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-2xl)' }}>
        <KpiCard icon={Users} label="Total de Leads" value={totalLeads} color="var(--green-primary)" onClick={() => navigate('/leads')} />
        <KpiCard icon={Target} label="Novos" value={novos} color="var(--color-info)" onClick={() => navigate('/leads?status=novo')} />
        <KpiCard icon={MessageCircle} label="Abordados" value={abordados} color="var(--color-warning)" onClick={() => navigate('/leads?status=contactado')} />
        <KpiCard icon={TrendingUp} label="Responderam" value={responderam} color="var(--color-info)" sub={`${taxaResposta}% de resposta`} />
        <KpiCard icon={BarChart3} label="Em Negociação" value={negociacao} color="var(--color-warning)" />
        <KpiCard icon={CheckCircle} label="Fechados" value={fechados} color="var(--color-success)" sub={`${taxaConversao}% de conversão`} onClick={() => navigate('/leads?status=fechado')} />
        <KpiCard icon={XCircle} label="Perdidos" value={perdidos} color="var(--color-error)" onClick={() => navigate('/leads?status=perdido')} />
        <KpiCard icon={CreditCard} label="Créditos usados" value={creditosConsumidos} color="var(--color-warning)" />
        <KpiCard icon={Sparkles} label="Mensagens IA" value={mensagensIA} color="var(--green-primary)" />
      </div>

      {/* Bottom Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 'var(--space-xl)' }}>

        {/* Funil de conversão */}
        <div className="card">
          <h3 style={{ fontWeight: '700', marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} color="var(--green-primary)" />
            Funil de Conversão
          </h3>
          {totalLeads === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Nenhum lead no período selecionado.</p>
          ) : (
            <>
              <MiniBar label="Total de leads" value={totalLeads} maxValue={totalLeads} color="var(--color-info)" />
              <MiniBar label="Abordados" value={abordados + responderam + negociacao + fechados} maxValue={totalLeads} color="var(--color-warning)" />
              <MiniBar label="Responderam" value={responderam} maxValue={totalLeads} color="var(--color-info)" />
              <MiniBar label="Em negociação" value={negociacao} maxValue={totalLeads} color="var(--color-warning)" />
              <MiniBar label="Fechados" value={fechados} maxValue={totalLeads} color="var(--color-success)" />
              <MiniBar label="Perdidos" value={perdidos} maxValue={totalLeads} color="var(--color-error)" />
            </>
          )}
        </div>

        {/* Performance por campanha */}
        <div className="card">
          <h3 style={{ fontWeight: '700', marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={18} color="var(--green-primary)" />
            Performance por Campanha
          </h3>
          {campaignStats.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Nenhuma campanha com leads no período.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {campaignStats.slice(0, 6).map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '6px', height: '36px', background: 'var(--green-primary)',
                    borderRadius: '3px', flexShrink: 0,
                    opacity: parseFloat(c.taxaResposta) > 0 ? Math.max(0.3, parseFloat(c.taxaResposta) / 100) : 0.2,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {c.totalLeads} leads · {c.fechados} fechados
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: parseFloat(c.taxaResposta) > 20 ? 'var(--color-success)' : 'var(--text-primary)' }}>
                      {c.taxaResposta}%
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>resp.</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Créditos - Extrato simplificado */}
        <div className="card">
          <h3 style={{ fontWeight: '700', marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={18} color="var(--green-primary)" />
            Extrato de Créditos
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '400', marginLeft: 'auto' }}>
              Saldo: {getTotalCredits(user?.creditWallet)}
            </span>
          </h3>
          {filteredTx.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Nenhuma transação no período.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {filteredTx.slice(0, 8).map(t => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ flex: 1, minWidth: 0, marginRight: '8px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.reason || t.description || t.type}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatDate(t.createdAt)}</div>
                  </div>
                  <span style={{
                    fontWeight: '700', fontSize: '13px', flexShrink: 0,
                    color: t.amount > 0 ? 'var(--color-success)' : t.amount < 0 ? 'var(--color-error)' : 'var(--text-muted)',
                  }}>
                    {t.amount > 0 ? `+${t.amount}` : t.amount === 0 ? '—' : t.amount}
                  </span>
                </div>
              ))}
              {filteredTx.length > 8 && (
                <button
                  style={{ fontSize: '12px', color: 'var(--green-primary)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', marginTop: '4px' }}
                  onClick={() => navigate('/configuracoes')}
                >
                  Ver extrato completo →
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
