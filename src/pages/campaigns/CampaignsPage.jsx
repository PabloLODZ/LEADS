import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Target,
  MapPin,
  Users,
  MessageCircle,
  Check,
  AlertTriangle,
  Play,
  Pause,
  Copy,
  Trash2,
  Calendar,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { formatDate, getStatusColor, getStatusLabel } from '../../utils/formatters.js';
import NewCampaignModal from './NewCampaignModal.jsx';

const PLAN_CAMPAIGN_LIMITS = {
  starter: 1,
  growth: 3,
  pro: 10,
  agency: Infinity,
};

export default function CampaignsPage() {
  const { user, isAdmin } = useAuth();
  const { campaigns, leads, updateCampaign, deleteCampaign, createCampaign } = useApp();
  const toast = useToast();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const planLimit = isAdmin ? Infinity : (PLAN_CAMPAIGN_LIMITS[user?.planId] || 0);
  const activeCampaignsCount = campaigns.filter(c => c.status === 'ativa').length;

  const handleOpenNewCampaign = () => {
    if (activeCampaignsCount >= planLimit) {
      toast.error('Limite de campanhas atingido', `Seu plano atual (${user?.planId || 'Inativo'}) permite até ${planLimit} campanha(s) ativa(s). Faça upgrade para criar mais.`);
      navigate('/configuracoes');
      return;
    }
    setModalOpen(true);
  };

  const getCampaignStats = (campaignId) => {
    const campLeads = leads.filter((l) => l.campaignId === campaignId);
    return {
      total: campLeads.length,
      contactados: campLeads.filter((l) => l.status === 'contactado' || l.status === 'follow_up').length,
      responderam: campLeads.filter((l) => l.status === 'respondeu').length,
      fechados: campLeads.filter((l) => l.status === 'fechado').length,
    };
  };

  const handleToggleStatus = async (campaign) => {
    if (campaign.status !== 'ativa' && activeCampaignsCount >= planLimit) {
      toast.error('Limite excedido', `Você já atingiu o limite de ${planLimit} campanha(s) ativa(s). Pause outra campanha ou faça upgrade.`);
      navigate('/configuracoes');
      return;
    }
    const newStatus = campaign.status === 'ativa' ? 'pausada' : 'ativa';
    try {
      await updateCampaign(campaign.id, { status: newStatus });
      toast.success(
        newStatus === 'ativa' ? 'Campanha retomada' : 'Campanha pausada',
        `A campanha "${campaign.name}" foi ${newStatus === 'ativa' ? 'ativada' : 'pausada'} com sucesso.`
      );
    } catch (err) {
      toast.error('Erro', 'Não foi possível alterar o status da campanha.');
    }
  };

  const handleDuplicate = async (campaign) => {
    try {
      const duplicated = {
        ...campaign,
        id: undefined,
        name: `${campaign.name} (Cópia)`,
        createdAt: new Date().toISOString(),
      };
      await createCampaign(duplicated);
      toast.success('Campanha duplicada', 'Uma cópia da campanha foi criada.');
    } catch (err) {
      toast.error('Erro', 'Não foi possível duplicar a campanha.');
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteCampaign(deleteConfirmId);
      toast.success('Campanha excluída', 'A campanha foi removida do sistema.');
      setDeleteConfirmId(null);
    } catch (err) {
      toast.error('Erro', 'Não foi possível excluir a campanha.');
    }
  };

  return (
    <div className="page-container" style={{ padding: 'var(--space-2xl)' }}>
      {/* Top Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2xl)' }}>
        <div>
          <span className="page-label" style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 'var(--space-xs)' }}>
            LODZ
          </span>
          <h1 className="page-title" style={{ fontSize: 'var(--font-size-3xl)', fontWeight: '800', color: 'var(--text-primary)' }}>
            Campanhas
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <div style={{ background: 'var(--bg-card)', padding: '6px 12px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-primary)', fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Target size={14} color="var(--green-primary)" />
            Ativas: <strong style={{ color: activeCampaignsCount >= planLimit ? 'var(--color-error)' : 'var(--text-primary)' }}>{activeCampaignsCount}</strong> / {planLimit === Infinity ? '∞' : planLimit}
          </div>
          <button className="btn btn-primary" onClick={handleOpenNewCampaign}>
            <Plus size={16} style={{ marginRight: '8px' }} />
            Nova campanha
          </button>
        </div>
      </div>

      {/* Campaigns list or empty state */}
      {campaigns.length === 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-lg)' }}>
          <div
            className="card card-dashed"
            onClick={handleOpenNewCampaign}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--space-3xl)',
              textAlign: 'center',
              minHeight: '250px',
            }}
          >
            <Plus size={36} className="text-green" style={{ marginBottom: 'var(--space-md)' }} />
            <h3 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--text-primary)', fontWeight: '600' }}>Nova campanha</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
              Clique aqui para configurar seu nicho de prospecção e mensagem inicial.
            </p>
          </div>
        </div>
      ) : (
        <div className="campaign-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: 'var(--space-xl)' }}>
          {/* Add Campaign creation card in list */}
          <div
            className="card card-dashed"
            onClick={handleOpenNewCampaign}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              minHeight: '240px',
            }}
          >
            <Plus size={28} className="text-green" style={{ marginBottom: 'var(--space-sm)' }} />
            <span style={{ fontSize: 'var(--font-size-base)', fontWeight: '600', color: 'var(--text-primary)' }}>Nova campanha</span>
          </div>

          {campaigns.map((camp) => {
            const stats = getCampaignStats(camp.id);
            const statusColor = getStatusColor(camp.status);

            return (
              <div key={camp.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '240px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 className="campaign-title" style={{ fontSize: 'var(--font-size-lg)', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {camp.name}
                    </h3>
                    <span className={`badge badge-${statusColor}`}>{getStatusLabel(camp.status)}</span>
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', marginTop: 'var(--space-sm)' }}>
                    {camp.segment && (
                      <span className="badge badge-gray" style={{ background: 'var(--bg-card-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}>
                        {camp.segment}
                      </span>
                    )}
                    {camp.location && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                        <MapPin size={12} />
                        {camp.location}
                      </span>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                      <Calendar size={12} />
                      {formatDate(camp.createdAt)}
                    </span>
                  </div>

                  {/* Campaign Offer */}
                  <p className="text-sm text-muted" style={{ marginTop: 'var(--space-md)', fontSize: 'var(--font-size-sm)', lineBreak: 'anywhere' }}>
                    <strong>Oferta:</strong> {camp.offer}
                  </p>

                  {/* Stats Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-sm)', margin: 'var(--space-lg) 0', padding: 'var(--space-sm)', background: 'var(--bg-card-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                    <div>
                      <div style={{ fontSize: 'var(--font-size-base)', fontWeight: '700', color: 'var(--text-primary)' }}>{stats.total}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Leads</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--font-size-base)', fontWeight: '700', color: 'var(--color-info)' }}>{stats.contactados}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Abordados</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--font-size-base)', fontWeight: '700', color: 'var(--color-warning)' }}>{stats.responderam}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Respostas</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--font-size-base)', fontWeight: '700', color: 'var(--green-primary)' }}>{stats.fechados}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fechados</div>
                    </div>
                  </div>
                </div>

                {/* Actions row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-md)' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/leads?campaignId=${camp.id}`)}>
                      Ver leads
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleToggleStatus(camp)}>
                      {camp.status === 'ativa' ? (
                        <>
                          <Pause size={12} style={{ marginRight: '4px' }} />
                          Pausar
                        </>
                      ) : (
                        <>
                          <Play size={12} style={{ marginRight: '4px' }} />
                          Retomar
                        </>
                      )}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDuplicate(camp)}>
                      <Copy size={12} style={{ marginRight: '4px' }} />
                      Duplicar
                    </button>
                  </div>
                  <button className="btn btn-danger btn-sm" style={{ padding: '6px' }} onClick={() => handleDeleteClick(camp.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Campaign Creation Stepper Modal */}
      <NewCampaignModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="modal confirm-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
              <div style={{ background: 'var(--color-error-bg)', color: 'var(--color-error)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-md) auto' }}>
                <AlertTriangle size={24} />
              </div>
              <h3 className="modal-title" style={{ fontSize: 'var(--font-size-lg)', fontWeight: '700', marginBottom: 'var(--space-xs)' }}>
                Excluir campanha?
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-lg)' }}>
                Essa ação não pode ser desfeita. Todos os leads associados a ela continuarão no CRM, mas não farão mais parte da campanha.
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
                <button className="btn btn-secondary" onClick={() => setDeleteConfirmId(null)}>
                  Cancelar
                </button>
                <button className="btn btn-danger" onClick={handleConfirmDelete}>
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
