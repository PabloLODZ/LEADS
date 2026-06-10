import { useNavigate } from 'react-router-dom';
import {
  Target,
  Users,
  Plus,
  Clock,
  MessageCircle,
  Check,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import {
  getGreeting,
  getDayOfWeekFull,
  getFormattedToday,
  formatRelativeDate,
  getStatusColor,
  getStatusLabel,
  getScoreClass,
} from '../../utils/formatters.js';

export default function TodayPage() {
  const { user } = useAuth();
  const { leads, campaigns, updateLeadStatus } = useApp();
  const navigate = useNavigate();

  const handleCreateCampaign = () => navigate('/campanhas');

  const greeting = getGreeting();
  const userName = user?.name || '';
  const dayOfWeek = getDayOfWeekFull();
  const formattedDate = getFormattedToday();

  // Stats calculation
  const totalCount = leads.length;
  const novoCount = leads.filter(l => l.status === 'novo').length;
  const followUpCount = leads.filter(l => l.status === 'follow_up').length;
  const respondeuCount = leads.filter(l => l.status === 'respondeu').length;
  const fechadoCount = leads.filter(l => l.status === 'fechado').length;

  // Queues
  const newLeads = leads.filter(l => l.status === 'novo').slice(0, 5);
  const followUpLeads = leads.filter(l => l.status === 'follow_up').slice(0, 5);
  const respondeuLeads = leads.filter(l => l.status === 'respondeu').slice(0, 5);
  const highScoringLeads = [...leads].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 5);

  const handleMarkAsContacted = async (leadId) => {
    await updateLeadStatus(leadId, 'contactado');
  };

  const getCampaignName = (campaignId) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    return campaign ? campaign.name : 'Campanha de prospecção';
  };

  const renderLeadCard = (lead) => {
    const scoreClass = getScoreClass(lead.score);
    const statusColor = getStatusColor(lead.status);

    return (
      <div key={lead.id} className="card lead-item-card" style={{ marginBottom: 'var(--space-md)', padding: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <span className="font-semibold" style={{ fontSize: 'var(--font-size-base)' }}>{lead.name}</span>
              {lead.username && <span className="text-green" style={{ fontSize: 'var(--font-size-sm)' }}>@{lead.username}</span>}
            </div>
            <div className="text-sm text-muted" style={{ marginTop: '2px' }}>
              {getCampaignName(lead.campaignId)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginTop: 'var(--space-sm)' }}>
              <span className={`badge badge-${statusColor}`}>{getStatusLabel(lead.status)}</span>
              <span className={`score ${scoreClass}`}>
                {lead.score} pts
              </span>
              <span className="text-xs text-muted">
                Interação: {formatRelativeDate(lead.updatedAt)}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate(`/leads?id=${lead.id}`)}
            >
              Ver lead
            </button>
            {lead.whatsappUrl && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => window.open(lead.whatsappUrl, '_blank')}
              >
                <ExternalLink size={14} style={{ marginRight: '4px' }} />
                WhatsApp
              </button>
            )}
            {lead.status === 'novo' && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => handleMarkAsContacted(lead.id)}
              >
                <Check size={14} style={{ marginRight: '4px' }} />
                Abordado
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page-container" style={{ padding: 'var(--space-2xl)' }}>
      {/* Top Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2xl)' }}>
        <div>
          <span className="page-label" style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 'var(--space-xs)' }}>
            {greeting}, {userName} · {dayOfWeek}, {formattedDate}
          </span>
          <h1 className="page-title" style={{ fontSize: 'var(--font-size-3xl)', fontWeight: '800', color: 'var(--text-primary)' }}>
            Aqui está o que fazer hoje
          </h1>
        </div>
        <button className="btn btn-primary" onClick={handleCreateCampaign}>
          <Plus size={16} style={{ marginRight: '8px' }} />
          Nova campanha
        </button>
      </div>

      {totalCount === 0 ? (
        <div className="empty-state card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 'var(--space-3xl)' }}>
          <div className="empty-state-icon" style={{ background: 'var(--green-glow)', color: 'var(--green-primary)', padding: 'var(--space-lg)', borderRadius: 'var(--radius-full)', marginBottom: 'var(--space-lg)' }}>
            <Target size={32} />
          </div>
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '700', color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>
            Nenhum lead ainda.
          </h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '400px', marginBottom: 'var(--space-xl)' }}>
            Crie uma campanha de prospecção comercial para carregar leads qualificados no seu painel.
          </p>
          <button className="btn btn-primary" onClick={handleCreateCampaign}>
            + Criar primeira campanha
          </button>
        </div>
      ) : (
        <>
          {/* Stats Row */}
          <div className="stats-grid">
            <div className="stat-card" onClick={() => navigate('/leads')}>
              <div className="stat-card-icon green"><Users size={20} /></div>
              <div className="stat-card-value">{totalCount}</div>
              <div className="stat-card-label">Total de leads</div>
            </div>
            <div className="stat-card" onClick={() => navigate('/leads?status=novo')}>
              <div className="stat-card-icon blue"><Plus size={20} /></div>
              <div className="stat-card-value">{novoCount}</div>
              <div className="stat-card-label">Novos leads</div>
            </div>
            <div className="stat-card" onClick={() => navigate('/leads?status=follow_up')}>
              <div className="stat-card-icon yellow"><Clock size={20} /></div>
              <div className="stat-card-value">{followUpCount}</div>
              <div className="stat-card-label">Em follow-up</div>
            </div>
            <div className="stat-card" onClick={() => navigate('/leads?status=respondeu')}>
              <div className="stat-card-icon green"><MessageCircle size={20} /></div>
              <div className="stat-card-value">{respondeuCount}</div>
              <div className="stat-card-label">Responderam</div>
            </div>
            <div className="stat-card" onClick={() => navigate('/leads?status=fechado')}>
              <div className="stat-card-icon green"><Check size={20} /></div>
              <div className="stat-card-value">{fechadoCount}</div>
              <div className="stat-card-label">Fechados</div>
            </div>
          </div>

          {/* Section Queues */}
          <div className="today-queues" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-2xl)' }}>
            {respondeuLeads.length > 0 && (
              <div>
                <h3 className="section-title" style={{ fontSize: 'var(--font-size-lg)', fontWeight: '700', color: 'var(--text-primary)', marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <MessageCircle size={18} className="text-green" />
                  Leads que responderam ({respondeuCount})
                </h3>
                {respondeuLeads.map(renderLeadCard)}
              </div>
            )}

            {newLeads.length > 0 && (
              <div>
                <h3 className="section-title" style={{ fontSize: 'var(--font-size-lg)', fontWeight: '700', color: 'var(--text-primary)', marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <Plus size={18} style={{ color: 'var(--color-info)' }} />
                  Leads novos para abordar ({novoCount})
                </h3>
                {newLeads.map(renderLeadCard)}
              </div>
            )}

            {followUpLeads.length > 0 && (
              <div>
                <h3 className="section-title" style={{ fontSize: 'var(--font-size-lg)', fontWeight: '700', color: 'var(--text-primary)', marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <Clock size={18} style={{ color: 'var(--color-warning)' }} />
                  Follow-ups pendentes ({followUpCount})
                </h3>
                {followUpLeads.map(renderLeadCard)}
              </div>
            )}

            {highScoringLeads.length > 0 && (
              <div>
                <h3 className="section-title" style={{ fontSize: 'var(--font-size-lg)', fontWeight: '700', color: 'var(--text-primary)', marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <Target size={18} style={{ color: 'var(--green-primary)' }} />
                  Leads com maior score (Top 5)
                </h3>
                {highScoringLeads.map(renderLeadCard)}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
