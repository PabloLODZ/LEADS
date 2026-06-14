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
  { id: 'respondeu', label: 'Responderam', icon: MessageCircle, color: 'var(--color-success)', urgent: true },
  { id: 'novo',      label: 'Para abordar', icon: TrendingUp,   color: 'var(--color-info)' },
  { id: 'follow_up', label: 'Follow-up',    icon: Clock,        color: 'var(--color-warning)' },
  { id: 'atrasados', label: 'Atrasados',    icon: AlertTriangle,color: 'var(--color-error)' },
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
        display: 'flex', alignItems: 'center', gap: '16px',
        padding: '12px 16px',
        background: 'var(--bg-primary)', /* Clean background */
        borderBottom: '1px solid var(--border-primary)', /* Simple list style instead of card */
        transition: 'background-color .15s',
      }}
      className="hover-bg-card"
      >
        {/* Minimal Score badge */}
        <div style={{
          flexShrink: 0, width: '8px', height: '8px',
          borderRadius: '50%',
          background: score === 'high' ? 'var(--green-primary)' :
                      score === 'medium' ? 'var(--color-warning)' : 'var(--color-error)',
        }} title={`Score: ${lead.score}`} />

        {/* Main info */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
            <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '250px' }}>
              {lead.name}
            </span>
            {lead.city && (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                · {lead.city}
              </span>
            )}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {getCampaignName(lead.campaignId)} · atualizado {formatRelativeDate(lead.updatedAt)}
          </div>
        </div>

        {/* Actions - minimalist */}
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'center' }}>
          {lead.personalizedMessage && (
            <button className="btn btn-ghost btn-sm" style={{ padding: '6px' }} onClick={() => copyMsg(lead)} title="Copiar mensagem">
              <Copy size={16} />
            </button>
          )}

          {lead.whatsappUrl && (
            <button className="btn btn-ghost btn-sm" style={{ padding: '6px', color: '#25D366' }} onClick={() => openWhatsApp(lead)} title="Abrir WhatsApp">
              <MessageCircle size={16} />
            </button>
          )}

          {tab === 'novo' && (
            <button
              className="btn btn-sm btn-ghost"
              style={{ padding: '6px', color: 'var(--color-success)' }}
              disabled={busy('contactado')}
              onClick={() => markStatus(lead, 'contactado', 'Contactado')}
              title="Marcar como abordado"
            >
              <Check size={16} />
            </button>
          )}

          {tab === 'respondeu' && (
            <button
              className="btn btn-sm btn-primary"
              style={{ padding: '6px' }}
              disabled={busy('follow_up')}
              onClick={() => markStatus(lead, 'follow_up', 'Follow-up')}
              title="Agendar retorno"
            >
              <Calendar size={16} />
            </button>
          )}

          {tab === 'follow_up' && (
            <button className="btn btn-sm btn-ghost" style={{ padding: '6px', color: 'var(--color-success)' }} disabled={busy('_cont')} onClick={() => markStatus(lead, 'contactado', 'Contactado')} title="Novo FUP">
              <Check size={16} />
            </button>
          )}

          {tab === 'atrasados' && (
            <button className="btn btn-sm btn-ghost" style={{ padding: '6px', color: 'var(--color-success)' }} disabled={busy('_cont')} onClick={() => markStatus(lead, 'contactado', 'Contactado')} title="FUP">
              <Check size={16} />
            </button>
          )}

          <button className="btn btn-ghost btn-sm" style={{ padding: '6px' }} onClick={() => navigate(`/leads?id=${lead.id}`)}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  if (totalCount === 0) {
    return (
      <div className="page-container" style={{ padding: 'var(--space-2xl)' }}>
        <Header greeting={greeting} userName={userName} dayOfWeek={dayOfWeek} formattedDate={formattedDate} onNew={() => navigate('/campanhas')} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: 'var(--space-3xl)' }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
            <Target size={48} />
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

      {/* Content wrapper */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-2xl)', marginTop: 'var(--space-xl)' }}>
        {/* Left Column: Tasks */}
        <div>
          {/* Custom Tabs */}
          <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)', overflowX: 'auto', paddingBottom: '8px' }}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const count = queues[tab.id].length;
              if (count === 0 && tab.id === 'atrasados') return null;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 20px',
                    background: isActive ? 'var(--bg-card)' : 'transparent',
                    border: '1px solid',
                    borderColor: isActive ? tab.color : 'transparent',
                    borderRadius: 'var(--radius-full)',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                    cursor: 'pointer', transition: 'all 0.2s',
                    fontSize: '14px', fontWeight: '600',
                  }}
                >
                  {tab.urgent && count > 0 && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-error)' }} />}
                  <tab.icon size={16} color={isActive ? tab.color : 'currentColor'} />
                  {tab.label}
                  <span style={{
                    background: isActive ? `${tab.color}20` : 'var(--bg-hover)',
                    color: isActive ? tab.color : 'inherit',
                    padding: '2px 8px', borderRadius: '10px', fontSize: '12px',
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* List area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {activeLeads.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-4xl) 0', color: 'var(--text-muted)' }}>
                <Check size={48} style={{ color: 'var(--green-primary)', opacity: 0.5, margin: '0 auto var(--space-lg)' }} />
                <p>Tudo limpo por aqui! Nenhuma tarefa pendente nesta fila.</p>
              </div>
            ) : (
              activeLeads.map(lead => <LeadCard key={lead.id} lead={lead} tab={activeTab} />)
            )}
          </div>
        </div>

        {/* Right Column: Mini Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
           <div style={{ background: 'var(--bg-card-secondary)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', border: '1px solid var(--border-primary)' }}>
             <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
               <Target size={14} color="var(--green-primary)" />
               Visão Geral
             </h4>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total de Leads</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{totalCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Fechados</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-success)' }}>{fechadoCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Para abordar</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-info)' }}>{queues.novo.length}</span>
                </div>
             </div>
           </div>
        </div>
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
