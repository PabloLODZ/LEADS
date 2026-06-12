import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target, Users, Plus, Clock, MessageCircle, Check,
  ExternalLink, ChevronRight, Copy, RefreshCw, Zap,
  AlertTriangle, TrendingUp, Calendar,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import {
  getGreeting, getDayOfWeekFull, getFormattedToday,
  formatRelativeDate, getStatusColor, getStatusLabel, getScoreClass,
} from '../../utils/formatters.js';

export default function TodayPage() {
  const { user } = useAuth();
  const { leads, campaigns, updateLeadStatus, addInteraction } = useApp();
  const toast = useToast();
  const navigate = useNavigate();

  const [loadingId, setLoadingId] = useState(null);

  const greeting = getGreeting();
  const userName = user?.name?.split(' ')[0] || '';
  const dayOfWeek = getDayOfWeekFull();
  const formattedDate = getFormattedToday();

  // --- Stats ---
  const totalCount = leads.length;
  const novoCount = leads.filter(l => l.status === 'novo').length;
  const followUpCount = leads.filter(l => l.status === 'follow_up').length;
  const respondeuCount = leads.filter(l => l.status === 'respondeu').length;
  const fechadoCount = leads.filter(l => l.status === 'fechado').length;

  // --- Queues ---
  // Responderam — maior prioridade
  const respondeuLeads = leads.filter(l => l.status === 'respondeu').slice(0, 8);

  // Novos para abordar (ainda não contatados)
  const newLeads = leads.filter(l => l.status === 'novo').slice(0, 8);

  // Follow-ups pendentes
  const followUpLeads = leads.filter(l => l.status === 'follow_up').slice(0, 8);

  // Leads sem resposta há mais de 2 dias (contactado ou follow_up, updatedAt antigo)
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const overdueLeads = leads.filter(l =>
    ['contactado', 'follow_up'].includes(l.status) &&
    l.updatedAt && new Date(l.updatedAt) < twoDaysAgo
  ).slice(0, 6);

  const getCampaignName = (campaignId) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    return campaign ? campaign.name : 'Campanha';
  };

  // --- Actions ---
  const doAction = async (leadId, action) => {
    setLoadingId(leadId + action);
    try {
      await action(leadId);
    } finally {
      setLoadingId(null);
    }
  };

  const handleMarkContacted = async (lead) => {
    setLoadingId(lead.id + 'contact');
    await updateLeadStatus(lead.id, 'contactado');
    toast.success('Marcado!', `${lead.name} marcado como contactado.`);
    setLoadingId(null);
  };

  const handleMarkFollowUp = async (lead) => {
    setLoadingId(lead.id + 'followup');
    await updateLeadStatus(lead.id, 'follow_up');
    toast.info('Follow-up agendado', `${lead.name} movido para Follow-up.`);
    setLoadingId(null);
  };

  const handleMarkRespondeu = async (lead) => {
    setLoadingId(lead.id + 'respondeu');
    await updateLeadStatus(lead.id, 'respondeu');
    toast.success('Respondeu!', `${lead.name} marcado como respondeu.`);
    setLoadingId(null);
  };

  const handleCopyMessage = async (lead) => {
    if (!lead.personalizedMessage) {
      toast.warning('Sem mensagem', 'Este lead não possui mensagem personalizada.');
      return;
    }
    await navigator.clipboard.writeText(lead.personalizedMessage);
    await addInteraction(lead.id, 'message_copied', 'Mensagem copiada via Painel Hoje', 'out', 'message_copied');
    toast.success('Copiado!', 'Mensagem copiada para a área de transferência.');
  };

  const handleOpenWhatsApp = async (lead) => {
    if (!lead.whatsappUrl) {
      toast.warning('Sem WhatsApp', 'Este lead não possui link do WhatsApp.');
      return;
    }
    window.open(lead.whatsappUrl, '_blank');
    await addInteraction(lead.id, 'whatsapp_opened', 'WhatsApp aberto via Painel Hoje', 'out', 'whatsapp_opened');
  };

  // --- Lead Card ---
  const renderLeadCard = (lead, queueType = 'novo') => {
    const scoreClass = getScoreClass(lead.score);
    const isLoading = (id, suf) => loadingId === id + suf;

    const nextActionLabel = {
      novo: 'Abordar agora',
      respondeu: 'Responder agora ⚡',
      follow_up: 'Retomar contato',
      contactado: 'Verificar resposta',
    }[queueType] || 'Ação pendente';

    const nextActionColor = {
      respondeu: 'var(--green-primary)',
      novo: 'var(--color-info)',
      follow_up: 'var(--color-warning)',
    }[queueType];

    return (
      <div key={lead.id} style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-md) var(--space-lg)',
        marginBottom: 'var(--space-sm)',
        transition: 'border-color 0.2s',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
          {/* Lead info */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: 'var(--font-size-base)' }}>
                {lead.name}
              </span>
              <span className={`score ${scoreClass}`} style={{ fontSize: '11px' }}>{lead.score} pts</span>
              {lead.city && (
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>📍 {lead.city}</span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              {getCampaignName(lead.campaignId)} · {formatRelativeDate(lead.updatedAt)}
            </div>
            {/* Next action indicator */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              fontSize: '11px', fontWeight: '600',
              color: nextActionColor || 'var(--text-muted)',
              background: nextActionColor ? `${nextActionColor}18` : 'var(--bg-card-secondary)',
              padding: '3px 8px', borderRadius: '99px',
            }}>
              <Zap size={10} />
              {nextActionLabel}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
            {lead.personalizedMessage && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '12px', padding: '5px 10px' }}
                onClick={() => handleCopyMessage(lead)}
              >
                <Copy size={12} /> Copiar msg
              </button>
            )}

            {lead.whatsappUrl && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '12px', padding: '5px 10px', color: '#25D366' }}
                onClick={() => handleOpenWhatsApp(lead)}
              >
                <ExternalLink size={12} /> WhatsApp
              </button>
            )}

            {queueType === 'novo' && (
              <button
                className="btn btn-sm btn-secondary"
                style={{ fontSize: '12px', padding: '5px 10px' }}
                disabled={isLoading(lead.id, 'contact')}
                onClick={() => handleMarkContacted(lead)}
              >
                <Check size={12} /> {isLoading(lead.id, 'contact') ? '...' : 'Abordado'}
              </button>
            )}

            {queueType === 'respondeu' && (
              <button
                className="btn btn-sm btn-primary"
                style={{ fontSize: '12px', padding: '5px 10px' }}
                disabled={isLoading(lead.id, 'followup')}
                onClick={() => handleMarkFollowUp(lead)}
              >
                <Calendar size={12} /> {isLoading(lead.id, 'followup') ? '...' : 'Agendar retorno'}
              </button>
            )}

            {queueType === 'follow_up' && (
              <button
                className="btn btn-sm btn-secondary"
                style={{ fontSize: '12px', padding: '5px 10px' }}
                disabled={isLoading(lead.id, 'respondeu')}
                onClick={() => handleMarkRespondeu(lead)}
              >
                <MessageCircle size={12} /> {isLoading(lead.id, 'respondeu') ? '...' : 'Respondeu'}
              </button>
            )}

            {(queueType === 'overdue') && (
              <button
                className="btn btn-sm btn-secondary"
                style={{ fontSize: '12px', padding: '5px 10px' }}
                onClick={() => handleMarkFollowUp(lead)}
              >
                <RefreshCw size={12} /> Reativar
              </button>
            )}

            <button
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '12px', padding: '5px 8px' }}
              onClick={() => navigate(`/leads?id=${lead.id}`)}
              title="Ver detalhes do lead"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const SectionHeader = ({ icon, title, count, color }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      marginBottom: 'var(--space-md)', marginTop: 'var(--space-xl)',
    }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '8px',
        background: `${color}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: color,
      }}>
        {icon}
      </div>
      <div>
        <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
          {title}
        </h3>
      </div>
      <span style={{
        marginLeft: 'auto', fontSize: '12px', fontWeight: '700',
        background: 'var(--bg-card-secondary)', padding: '2px 10px',
        borderRadius: '99px', color: 'var(--text-muted)',
      }}>
        {count}
      </span>
    </div>
  );

  return (
    <div className="page-container" style={{ padding: 'var(--space-2xl)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2xl)', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{
            display: 'block', fontSize: '11px', fontWeight: '700',
            color: 'var(--text-muted)', textTransform: 'uppercase',
            letterSpacing: '1.5px', marginBottom: '6px',
          }}>
            {greeting}, {userName} · {dayOfWeek}, {formattedDate}
          </span>
          <h1 className="page-title" style={{ fontSize: 'var(--font-size-3xl)', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
            Painel de Hoje
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: 'var(--font-size-sm)' }}>
            Aqui estão suas prioridades de prospecção para hoje
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/campanhas')}>
          <Plus size={16} style={{ marginRight: '6px' }} />
          Nova campanha
        </button>
      </div>

      {totalCount === 0 ? (
        /* Empty State */
        <div className="card" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', textAlign: 'center', padding: 'var(--space-3xl)',
        }}>
          <div style={{
            background: 'var(--green-glow)', color: 'var(--green-primary)',
            padding: 'var(--space-lg)', borderRadius: '50%', marginBottom: 'var(--space-lg)',
          }}>
            <Target size={32} />
          </div>
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '700', color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>
            Nenhum lead ainda
          </h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '400px', marginBottom: 'var(--space-xl)' }}>
            Crie uma campanha de prospecção comercial para carregar leads qualificados no seu painel.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/campanhas')}>
            + Criar primeira campanha
          </button>
        </div>
      ) : (
        <>
          {/* Stats Row */}
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--space-base)', marginBottom: 'var(--space-xl)' }}>
            <div className="stat-card" onClick={() => navigate('/leads')} style={{ cursor: 'pointer' }}>
              <div className="stat-card-icon green"><Users size={18} /></div>
              <div className="stat-card-value">{totalCount}</div>
              <div className="stat-card-label">Total de leads</div>
            </div>
            <div className="stat-card" onClick={() => navigate('/leads?status=novo')} style={{ cursor: 'pointer' }}>
              <div className="stat-card-icon blue"><Plus size={18} /></div>
              <div className="stat-card-value">{novoCount}</div>
              <div className="stat-card-label">Novos para abordar</div>
            </div>
            <div className="stat-card" onClick={() => navigate('/leads?status=respondeu')} style={{ cursor: 'pointer' }}>
              <div className="stat-card-icon green"><MessageCircle size={18} /></div>
              <div className="stat-card-value" style={respondeuCount > 0 ? { color: 'var(--green-primary)' } : {}}>
                {respondeuCount}
              </div>
              <div className="stat-card-label">Responderam ⚡</div>
            </div>
            <div className="stat-card" onClick={() => navigate('/leads?status=follow_up')} style={{ cursor: 'pointer' }}>
              <div className="stat-card-icon yellow"><Clock size={18} /></div>
              <div className="stat-card-value">{followUpCount}</div>
              <div className="stat-card-label">Follow-ups</div>
            </div>
            <div className="stat-card" onClick={() => navigate('/leads?status=fechado')} style={{ cursor: 'pointer' }}>
              <div className="stat-card-icon green"><Check size={18} /></div>
              <div className="stat-card-value">{fechadoCount}</div>
              <div className="stat-card-label">Fechados</div>
            </div>
            {overdueLeads.length > 0 && (
              <div className="stat-card" style={{ borderColor: 'var(--color-warning)' }}>
                <div className="stat-card-icon yellow"><AlertTriangle size={18} /></div>
                <div className="stat-card-value" style={{ color: 'var(--color-warning)' }}>{overdueLeads.length}</div>
                <div className="stat-card-label">Atrasados (+2d)</div>
              </div>
            )}
          </div>

          {/* Queues */}
          <div>

            {/* RESPONDERAM — máxima prioridade */}
            {respondeuLeads.length > 0 && (
              <div>
                <SectionHeader
                  icon={<MessageCircle size={16} />}
                  title="Responderam — Responda agora!"
                  count={respondeuCount}
                  color="var(--green-primary)"
                />
                {respondeuLeads.map(lead => renderLeadCard(lead, 'respondeu'))}
              </div>
            )}

            {/* ATRASADOS */}
            {overdueLeads.length > 0 && (
              <div>
                <SectionHeader
                  icon={<AlertTriangle size={16} />}
                  title="Sem resposta há mais de 2 dias"
                  count={overdueLeads.length}
                  color="var(--color-warning)"
                />
                {overdueLeads.map(lead => renderLeadCard(lead, 'overdue'))}
              </div>
            )}

            {/* FOLLOW-UPS */}
            {followUpLeads.length > 0 && (
              <div>
                <SectionHeader
                  icon={<Clock size={16} />}
                  title="Follow-ups pendentes"
                  count={followUpCount}
                  color="var(--color-warning)"
                />
                {followUpLeads.map(lead => renderLeadCard(lead, 'follow_up'))}
              </div>
            )}

            {/* NOVOS PARA ABORDAR */}
            {newLeads.length > 0 && (
              <div>
                <SectionHeader
                  icon={<TrendingUp size={16} />}
                  title="Novos leads para abordar"
                  count={novoCount}
                  color="var(--color-info)"
                />
                {newLeads.map(lead => renderLeadCard(lead, 'novo'))}
              </div>
            )}

            {/* Estado vazio quando há leads mas nenhuma ação pendente */}
            {respondeuLeads.length === 0 && newLeads.length === 0 && followUpLeads.length === 0 && overdueLeads.length === 0 && (
              <div className="card" style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
                <Check size={32} style={{ color: 'var(--green-primary)', marginBottom: '12px' }} />
                <h3 style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Tudo em dia! 🎉
                </h3>
                <p style={{ color: 'var(--text-muted)', maxWidth: '360px', margin: '0 auto 20px' }}>
                  Não há ações pendentes para hoje. Crie uma nova campanha para garimpar mais leads.
                </p>
                <button className="btn btn-primary" onClick={() => navigate('/campanhas')}>
                  <Plus size={14} style={{ marginRight: '6px' }} />
                  Garimpar mais leads
                </button>
              </div>
            )}

            {/* Ver todos */}
            {totalCount > 0 && (
              <div style={{ textAlign: 'center', marginTop: 'var(--space-2xl)' }}>
                <button
                  className="btn btn-ghost"
                  onClick={() => navigate('/leads')}
                  style={{ color: 'var(--text-muted)' }}
                >
                  Ver todos os {totalCount} leads <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
