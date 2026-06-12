import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Clock, MessageCircle, Check, ExternalLink,
  Copy, RefreshCw, Zap, AlertTriangle, TrendingUp,
  Calendar, Users, ChevronRight, Target,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import {
  getGreeting, getDayOfWeekFull, getFormattedToday,
  formatRelativeDate, getScoreClass,
} from '../../utils/formatters.js';

const TABS = [
  { id: 'respondeu', label: 'Responderam', icon: MessageCircle, color: '#00ff96', urgent: true },
  { id: 'novo',      label: 'Para abordar', icon: TrendingUp,   color: '#60a5fa' },
  { id: 'follow_up', label: 'Follow-up',    icon: Clock,        color: '#fbbf24' },
  { id: 'atrasados', label: 'Atrasados',    icon: AlertTriangle,color: '#f87171' },
];

export default function TodayPage() {
  const { user } = useAuth();
  const { leads, campaigns, updateLeadStatus, addInteraction } = useApp();
  const toast = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('respondeu');
  const [loadingId, setLoadingId] = useState(null);

  const userName = user?.name?.split(' ')[0] || '';
  const greeting = getGreeting();
  const dayOfWeek = getDayOfWeekFull();
  const formattedDate = getFormattedToday();

  // ---------- Contagens ----------
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const totalCount   = leads.length;
  const fechadoCount = leads.filter(l => l.status === 'fechado').length;

  const queues = {
    respondeu: leads.filter(l => l.status === 'respondeu'),
    novo:      leads.filter(l => l.status === 'novo'),
    follow_up: leads.filter(l => l.status === 'follow_up'),
    atrasados: leads.filter(l =>
      ['contactado', 'follow_up'].includes(l.status) &&
      l.updatedAt && new Date(l.updatedAt) < twoDaysAgo
    ),
  };

  const getCampaignName = (id) => {
    const c = campaigns.find(c => c.id === id);
    return c ? c.name : 'Campanha';
  };

  // ---------- Ações ----------
  const withLoading = async (key, fn) => {
    setLoadingId(key);
    try { await fn(); } finally { setLoadingId(null); }
  };

  const markStatus = (lead, status, label) =>
    withLoading(lead.id + status, async () => {
      await updateLeadStatus(lead.id, status);
      toast.success('Atualizado!', `${lead.name} → ${label}`);
    });

  const copyMsg = async (lead) => {
    if (!lead.personalizedMessage) {
      toast.warning('Sem mensagem', 'Este lead não possui mensagem gerada.');
      return;
    }
    await navigator.clipboard.writeText(lead.personalizedMessage);
    await addInteraction(lead.id, 'message_copied', 'Mensagem copiada via Painel Hoje', 'out', 'message_copied');
    toast.success('Copiado!', 'Mensagem na área de transferência.');
  };

  const openWhatsApp = async (lead) => {
    if (!lead.whatsappUrl) {
      toast.warning('Sem WhatsApp', 'Este lead não possui link do WhatsApp.');
      return;
    }
    window.open(lead.whatsappUrl, '_blank');
    await addInteraction(lead.id, 'whatsapp_opened', 'WhatsApp aberto via Painel Hoje', 'out', 'whatsapp_opened');
  };

  // ---------- Card ----------
  const LeadCard = ({ lead, tab }) => {
    const busy = (suf) => loadingId === lead.id + suf;
    const score = getScoreClass(lead.score);

    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        padding: '14px 16px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-lg)',
        transition: 'border-color .15s',
      }}>
        {/* Score badge */}
        <div style={{
          flexShrink: 0, width: '40px', height: '40px',
          borderRadius: '10px', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: score === 'high' ? 'rgba(0,255,150,.12)' :
                      score === 'medium' ? 'rgba(251,191,36,.12)' : 'rgba(248,113,113,.10)',
          fontSize: '13px', fontWeight: '800',
          color: score === 'high' ? 'var(--green-primary)' :
                 score === 'medium' ? '#fbbf24' : '#f87171',
        }}>
          {lead.score}
        </div>

        {/* Main info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '220px' }}>
              {lead.name}
            </span>
            {lead.city && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                📍 {lead.city}
              </span>
            )}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {getCampaignName(lead.campaignId)} · {formatRelativeDate(lead.updatedAt)}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {lead.personalizedMessage && (
            <button className="btn btn-ghost btn-sm" style={{ fontSize: '12px', padding: '5px 10px' }} onClick={() => copyMsg(lead)}>
              <Copy size={12} /> Copiar
            </button>
          )}

          {lead.whatsappUrl && (
            <button className="btn btn-ghost btn-sm" style={{ fontSize: '12px', padding: '5px 10px', color: '#25D366' }} onClick={() => openWhatsApp(lead)}>
              <ExternalLink size={12} /> WhatsApp
            </button>
          )}

          {tab === 'novo' && (
            <button
              className="btn btn-sm btn-secondary"
              style={{ fontSize: '12px', padding: '5px 10px' }}
              disabled={busy('contactado')}
              onClick={() => markStatus(lead, 'contactado', 'Contactado')}
            >
              <Check size={12} /> {busy('contactado') ? '...' : 'Abordado'}
            </button>
          )}

          {tab === 'respondeu' && (
            <button
              className="btn btn-sm btn-primary"
              style={{ fontSize: '12px', padding: '5px 10px' }}
              disabled={busy('follow_up')}
              onClick={() => markStatus(lead, 'follow_up', 'Follow-up')}
            >
              <Calendar size={12} /> {busy('follow_up') ? '...' : 'Agendar retorno'}
            </button>
          )}

          {tab === 'follow_up' && (
            <button
              className="btn btn-sm btn-secondary"
              style={{ fontSize: '12px', padding: '5px 10px' }}
              disabled={busy('respondeu')}
              onClick={() => markStatus(lead, 'respondeu', 'Respondeu')}
            >
              <MessageCircle size={12} /> {busy('respondeu') ? '...' : 'Respondeu'}
            </button>
          )}

          {tab === 'atrasados' && (
            <button
              className="btn btn-sm btn-secondary"
              style={{ fontSize: '12px', padding: '5px 10px' }}
              disabled={busy('follow_up')}
              onClick={() => markStatus(lead, 'follow_up', 'Follow-up')}
            >
              <RefreshCw size={12} /> {busy('follow_up') ? '...' : 'Reativar'}
            </button>
          )}

          <button
            className="btn btn-ghost btn-sm"
            style={{ padding: '5px 7px' }}
            onClick={() => navigate(`/leads?id=${lead.id}`)}
            title="Ver detalhes"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  };

  // ---------- Empty state ----------
  if (totalCount === 0) {
    return (
      <div className="page-container" style={{ padding: 'var(--space-2xl)' }}>
        <Header greeting={greeting} userName={userName} dayOfWeek={dayOfWeek} formattedDate={formattedDate} onNew={() => navigate('/campanhas')} />
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: 'var(--space-3xl)' }}>
          <div style={{ background: 'var(--green-glow)', color: 'var(--green-primary)', padding: 'var(--space-lg)', borderRadius: '50%', marginBottom: '16px' }}>
            <Target size={32} />
          </div>
          <h3 style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>Nenhum lead ainda</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '380px', marginBottom: '20px' }}>
            Crie uma campanha de prospecção para carregar leads qualificados no seu painel.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/campanhas')}>
            + Criar primeira campanha
          </button>
        </div>
      </div>
    );
  }

  const activeLeads = queues[activeTab] || [];
  const activeTabDef = TABS.find(t => t.id === activeTab);

  return (
    <div className="page-container" style={{ padding: 'var(--space-2xl)' }}>
      <Header greeting={greeting} userName={userName} dayOfWeek={dayOfWeek} formattedDate={formattedDate} onNew={() => navigate('/campanhas')} />

      {/* ---- Stats compactos ---- */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
        gap: '10px',
        marginBottom: '24px',
      }}>
        {[
          { label: 'Total', value: totalCount, color: 'var(--green-primary)', onClick: () => navigate('/leads') },
          { label: 'Responderam', value: queues.respondeu.length, color: '#00ff96', urgent: queues.respondeu.length > 0, onClick: () => setActiveTab('respondeu') },
          { label: 'Para abordar', value: queues.novo.length, color: '#60a5fa', onClick: () => setActiveTab('novo') },
          { label: 'Follow-up', value: queues.follow_up.length, color: '#fbbf24', onClick: () => setActiveTab('follow_up') },
          { label: 'Atrasados', value: queues.atrasados.length, color: '#f87171', onClick: () => setActiveTab('atrasados') },
          { label: 'Fechados', value: fechadoCount, color: 'var(--green-primary)', onClick: () => navigate('/leads?status=fechado') },
        ].map(s => (
          <button
            key={s.label}
            onClick={s.onClick}
            style={{
              background: 'var(--bg-card)',
              border: `1px solid ${s.urgent ? s.color : 'var(--border-primary)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '12px 10px',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all .15s',
              outline: 'none',
            }}
          >
            <div style={{ fontSize: '22px', fontWeight: '800', color: s.value > 0 ? s.color : 'var(--text-muted)', lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '500' }}>
              {s.label}
            </div>
          </button>
        ))}
      </div>

      {/* ---- Tabs ---- */}
      <div style={{
        display: 'flex', gap: '4px',
        background: 'var(--bg-card-secondary)',
        border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-lg)',
        padding: '4px',
        marginBottom: '16px',
        overflowX: 'auto',
      }}>
        {TABS.map(tab => {
          const count = queues[tab.id]?.length || 0;
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, minWidth: '100px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '9px 12px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: isActive ? 'var(--bg-card)' : 'transparent',
                color: isActive ? tab.color : 'var(--text-muted)',
                fontWeight: isActive ? '700' : '500',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all .15s',
                boxShadow: isActive ? '0 1px 4px rgba(0,0,0,.25)' : 'none',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={14} />
              {tab.label}
              {count > 0 && (
                <span style={{
                  background: isActive ? tab.color : 'var(--bg-card)',
                  color: isActive ? '#000' : 'var(--text-muted)',
                  fontSize: '11px', fontWeight: '700',
                  borderRadius: '99px', padding: '1px 7px',
                  minWidth: '20px', textAlign: 'center',
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ---- Lista da aba ativa ---- */}
      {activeLeads.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
          {activeTab === 'atrasados' ? (
            <>
              <Check size={28} style={{ color: 'var(--green-primary)', marginBottom: '10px' }} />
              <p style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>Nenhum lead atrasado!</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Todos os leads estão sendo acompanhados em dia.</p>
            </>
          ) : (
            <>
              <activeTabDef.icon size={28} style={{ color: 'var(--text-muted)', marginBottom: '10px' }} />
              <p style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>Nenhum lead aqui</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                {activeTab === 'novo' && 'Crie uma campanha para garimpar novos leads.'}
                {activeTab === 'respondeu' && 'Ninguém respondeu ainda — continue abordando!'}
                {activeTab === 'follow_up' && 'Sem follow-ups pendentes por enquanto.'}
              </p>
              {activeTab === 'novo' && (
                <button className="btn btn-primary btn-sm" style={{ marginTop: '14px' }} onClick={() => navigate('/campanhas')}>
                  <Plus size={13} /> Nova campanha
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {activeLeads.slice(0, 15).map(lead => (
            <LeadCard key={lead.id} lead={lead} tab={activeTab} />
          ))}
          {activeLeads.length > 15 && (
            <button
              className="btn btn-ghost"
              style={{ color: 'var(--text-muted)', fontSize: '13px' }}
              onClick={() => navigate(`/leads?status=${activeTab === 'atrasados' ? 'follow_up' : activeTab}`)}
            >
              Ver todos os {activeLeads.length} leads <ChevronRight size={13} />
            </button>
          )}
        </div>
      )}

      {/* Link rápido para todos */}
      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <button className="btn btn-ghost" style={{ color: 'var(--text-muted)', fontSize: '12px' }} onClick={() => navigate('/leads')}>
          <Users size={13} style={{ marginRight: '4px' }} />
          Ver todos os {totalCount} leads
        </button>
      </div>
    </div>
  );
}

function Header({ greeting, userName, dayOfWeek, formattedDate, onNew }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
      <div>
        <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '4px' }}>
          {greeting}, {userName} · {dayOfWeek}, {formattedDate}
        </span>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
          Painel de Hoje
        </h1>
      </div>
      <button className="btn btn-primary btn-sm" onClick={onNew}>
        <Plus size={14} style={{ marginRight: '6px' }} /> Nova campanha
      </button>
    </div>
  );
}
