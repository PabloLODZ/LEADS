import { useState, useEffect } from 'react';
import {
  X, Copy, ExternalLink, Instagram, Globe, Phone, MapPin,
  MessageCircle, Send, Clock, Check, AlertCircle, Eye,
  ChevronDown, ChevronUp, Star, Zap
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { formatRelativeDate, getStatusColor, getStatusLabel, truncate } from '../../utils/formatters.js';

export default function LeadDetailDrawer({ lead, isOpen, onClose }) {
  const { updateLead, updateLeadStatus, interactions, addInteraction } = useApp();
  const toast = useToast();
  const [notes, setNotes] = useState('');
  const [showVariations, setShowVariations] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (lead) {
      setNotes(lead.notes || '');
      setShowVariations(false);
    }
  }, [lead]);

  // Prevent scroll on body when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen || !lead) return null;

  const leadInteractions = interactions
    .filter(i => i.leadId === lead.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const statusColor = getStatusColor(lead.status);
  const statusLabel = getStatusLabel(lead.status);

  const handleCopyMessage = (message) => {
    if (!message) {
      toast.warning('Sem mensagem', 'Este lead não possui mensagem personalizada.');
      return;
    }
    navigator.clipboard.writeText(message).then(() => {
      toast.success('Copiado!', 'Mensagem copiada para a área de transferência.');
    }).catch(() => {
      toast.error('Erro', 'Não foi possível copiar a mensagem.');
    });
  };

  const handleOpenWhatsApp = () => {
    if (lead.whatsappUrl) {
      window.open(lead.whatsappUrl, '_blank');
    } else {
      toast.warning('Sem WhatsApp', 'Este lead não possui link do WhatsApp.');
    }
  };

  const handleStatusChange = (newStatus) => {
    updateLeadStatus(lead.id, newStatus);
    toast.success('Status atualizado', `Lead marcado como "${getStatusLabel(newStatus)}".`);
  };

  const handleSaveNotes = () => {
    setSavingNotes(true);
    setTimeout(() => {
      updateLead(lead.id, { notes });
      setSavingNotes(false);
      toast.success('Salvo', 'Observações atualizadas com sucesso.');
    }, 400);
  };

  const getInteractionIcon = (type) => {
    switch (type) {
      case 'message_sent': return <Send size={14} />;
      case 'message_received': return <MessageCircle size={14} />;
      case 'deal_closed': return <Check size={14} />;
      case 'status_change': return <AlertCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const getInteractionColor = (type) => {
    switch (type) {
      case 'message_sent': return 'text-green';
      case 'message_received': return '';
      case 'deal_closed': return 'text-green';
      default: return 'text-muted';
    }
  };

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        {/* HEADER */}
        <div className="drawer-header">
          <div>
            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 'var(--space-xs)' }}>
              {lead.name}
            </h2>
            <div className="flex items-center gap-sm" style={{ marginBottom: 'var(--space-sm)' }}>
              <span className="text-green font-semibold">{lead.username}</span>
            </div>
            <div className="flex items-center gap-sm">
              <span className={`badge badge-${statusColor}`}>{statusLabel}</span>
              <span className={`score ${lead.score >= 80 ? 'high' : lead.score >= 50 ? 'medium' : 'low'}`}>
                <Star size={14} /> {lead.score}
              </span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="drawer-body">

          {/* INFORMAÇÕES */}
          <div className="drawer-section">
            <h3 className="drawer-section-title">Informações</h3>
            <div className="flex flex-col gap-md">
              {lead.bio && (
                <div>
                  <span className="text-xs text-muted">Bio</span>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{lead.bio}</p>
                </div>
              )}
              {lead.campaignId && (
                <div className="flex items-center gap-sm">
                  <Zap size={14} className="text-muted" />
                  <span className="text-sm text-secondary">Campanha de origem:</span>
                  <span className="text-sm font-semibold">{lead.campaignName || lead.campaignId}</span>
                </div>
              )}
              {(lead.city || lead.state) && (
                <div className="flex items-center gap-sm">
                  <MapPin size={14} className="text-muted" />
                  <span className="text-sm">{[lead.city, lead.state].filter(Boolean).join(', ')}</span>
                </div>
              )}
              {lead.instagramUrl && (
                <div className="flex items-center gap-sm">
                  <Instagram size={14} className="text-muted" />
                  <a href={lead.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-sm">
                    {lead.username || 'Instagram'}
                  </a>
                </div>
              )}
              {lead.whatsappUrl && (
                <div className="flex items-center gap-sm">
                  <MessageCircle size={14} className="text-muted" />
                  <a href={lead.whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-sm">
                    WhatsApp
                  </a>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-sm">
                  <Phone size={14} className="text-muted" />
                  <span className="text-sm">{lead.phone}</span>
                </div>
              )}
              {lead.website && (
                <div className="flex items-center gap-sm">
                  <Globe size={14} className="text-muted" />
                  <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-sm">
                    {lead.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              {lead.source && (
                <div className="flex items-center gap-sm">
                  <span className="text-xs text-muted">Fonte:</span>
                  <span className={`badge badge-${lead.source === 'instagram' ? 'blue' : 'yellow'}`}>
                    {lead.source === 'instagram' ? 'Instagram' : 'Google Maps'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ABORDAGEM PERSONALIZADA */}
          <div className="drawer-section">
            <h3 className="drawer-section-title">Abordagem Personalizada</h3>

            {lead.personalizedMessage ? (
              <>
                <div className="card" style={{ background: 'var(--green-glow)', borderColor: 'var(--green-dark)', marginBottom: 'var(--space-md)' }}>
                  <p className="text-sm" style={{ color: 'var(--text-primary)', lineHeight: 1.7 }}>
                    {lead.personalizedMessage}
                  </p>
                </div>
                <div className="flex gap-sm mb-lg">
                  <button className="btn btn-sm btn-outline-green" onClick={() => handleCopyMessage(lead.personalizedMessage)}>
                    <Copy size={14} /> Copiar mensagem
                  </button>
                  <button className="btn btn-sm btn-ghost" onClick={() => setShowVariations(!showVariations)}>
                    <Eye size={14} /> {showVariations ? 'Ocultar variações' : 'Ver variações'}
                    {showVariations ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                {showVariations && (
                  <div className="flex flex-col gap-md mb-lg">
                    {lead.messageDirect && (
                      <div className="ai-response-card">
                        <div className="ai-response-label">Versão Direta</div>
                        <p className="ai-response-text">{lead.messageDirect}</p>
                        <div className="ai-response-actions">
                          <button className="btn btn-sm btn-ghost" onClick={() => handleCopyMessage(lead.messageDirect)}>
                            <Copy size={14} /> Copiar
                          </button>
                        </div>
                      </div>
                    )}
                    {lead.messageConsultative && (
                      <div className="ai-response-card">
                        <div className="ai-response-label">Versão Consultiva</div>
                        <p className="ai-response-text">{lead.messageConsultative}</p>
                        <div className="ai-response-actions">
                          <button className="btn btn-sm btn-ghost" onClick={() => handleCopyMessage(lead.messageConsultative)}>
                            <Copy size={14} /> Copiar
                          </button>
                        </div>
                      </div>
                    )}
                    {lead.messageLight && (
                      <div className="ai-response-card">
                        <div className="ai-response-label">Versão Leve</div>
                        <p className="ai-response-text">{lead.messageLight}</p>
                        <div className="ai-response-actions">
                          <button className="btn btn-sm btn-ghost" onClick={() => handleCopyMessage(lead.messageLight)}>
                            <Copy size={14} /> Copiar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {lead.personalizationReason && (
                  <div className="mb-base">
                    <span className="text-xs text-muted">Motivo da personalização</span>
                    <p className="text-sm" style={{ color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.6 }}>
                      {lead.personalizationReason}
                    </p>
                  </div>
                )}

                {lead.icebreaker && (
                  <div className="mb-base">
                    <span className="text-xs text-muted">Quebra-gelo</span>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {lead.icebreaker}
                    </p>
                  </div>
                )}

                {lead.customCta && (
                  <div className="mb-base">
                    <span className="text-xs text-muted">CTA sugerido</span>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {lead.customCta}
                    </p>
                  </div>
                )}

                {lead.detectedPainPoints && lead.detectedPainPoints.length > 0 && (
                  <div className="mb-base">
                    <span className="text-xs text-muted">Dores detectadas</span>
                    <div className="flex gap-sm flex-wrap mt-sm">
                      {lead.detectedPainPoints.map((pain, i) => (
                        <span key={i} className="badge badge-red">{pain}</span>
                      ))}
                    </div>
                  </div>
                )}

                {lead.detectedOpportunities && lead.detectedOpportunities.length > 0 && (
                  <div className="mb-base">
                    <span className="text-xs text-muted">Oportunidades detectadas</span>
                    <div className="flex gap-sm flex-wrap mt-sm">
                      {lead.detectedOpportunities.map((opp, i) => (
                        <span key={i} className="badge badge-green">{opp}</span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted">Nenhuma mensagem personalizada disponível para este lead.</p>
            )}
          </div>

          {/* OBSERVAÇÕES */}
          <div className="drawer-section">
            <h3 className="drawer-section-title">Observações</h3>
            <textarea
              className="form-input"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Adicione observações sobre este lead..."
              rows={4}
            />
            <div className="mt-sm">
              <button
                className="btn btn-sm btn-secondary"
                onClick={handleSaveNotes}
                disabled={savingNotes}
              >
                {savingNotes ? 'Salvando...' : 'Salvar observações'}
              </button>
            </div>
          </div>

          {/* HISTÓRICO */}
          <div className="drawer-section">
            <h3 className="drawer-section-title">Histórico</h3>
            {leadInteractions.length > 0 ? (
              <div className="flex flex-col gap-md">
                {leadInteractions.map(interaction => (
                  <div key={interaction.id} className="flex gap-md" style={{ alignItems: 'flex-start' }}>
                    <div className={`flex items-center justify-center ${getInteractionColor(interaction.type)}`}
                      style={{
                        width: 28, height: 28, borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-card-secondary)', flexShrink: 0, marginTop: 2
                      }}>
                      {getInteractionIcon(interaction.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p className="text-sm" style={{ lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                        {interaction.message}
                      </p>
                      <span className="text-xs text-muted">{formatRelativeDate(interaction.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">Nenhuma interação registrada ainda.</p>
            )}
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div style={{
          padding: 'var(--space-lg) var(--space-xl)',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-card)',
          position: 'sticky',
          bottom: 0
        }}>
          <div className="flex gap-sm mb-base">
            <button className="btn btn-primary btn-sm flex-1" onClick={() => handleCopyMessage(lead.personalizedMessage)}>
              <Copy size={14} /> Copiar mensagem
            </button>
            <button className="btn btn-secondary btn-sm flex-1" onClick={handleOpenWhatsApp}>
              <ExternalLink size={14} /> Abrir WhatsApp
            </button>
          </div>
          <div className="flex gap-sm flex-wrap">
            {lead.status !== 'contactado' && (
              <button className="btn btn-sm btn-ghost" onClick={() => handleStatusChange('contactado')}>Contactado</button>
            )}
            {lead.status !== 'follow_up' && (
              <button className="btn btn-sm btn-ghost" onClick={() => handleStatusChange('follow_up')}>Follow-up</button>
            )}
            {lead.status !== 'respondeu' && (
              <button className="btn btn-sm btn-ghost" onClick={() => handleStatusChange('respondeu')}>Respondeu</button>
            )}
            {lead.status !== 'fechado' && (
              <button className="btn btn-sm btn-outline-green" onClick={() => handleStatusChange('fechado')}>Fechado</button>
            )}
            {lead.status !== 'perdido' && (
              <button className="btn btn-sm btn-ghost" onClick={() => handleStatusChange('perdido')}>Perdido</button>
            )}
            {lead.status !== 'descartado' && (
              <button className="btn btn-sm btn-ghost" onClick={() => handleStatusChange('descartado')}>Descartar</button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
