import { useState, useEffect } from 'react';
import {
  X, Copy, ExternalLink, Instagram, Globe, Phone, MapPin,
  MessageCircle, Send, Clock, Check, AlertCircle, Eye,
  ChevronDown, ChevronUp, Star, Zap, TrendingUp, Handshake,
  XCircle, RefreshCw, Calendar,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { formatRelativeDate, formatDateTime, getStatusColor, getStatusLabel, truncate, LEAD_STATUSES, LOSS_REASONS } from '../../utils/formatters.js';
import SocioIAPanel from '../../components/leads/SocioIAPanel.jsx';

export default function LeadDetailDrawer({ lead, isOpen, onClose }) {
  const { updateLead, updateLeadStatus, interactions, addInteraction, campaigns } = useApp();
  const toast = useToast();
  const leadCampaign = campaigns?.find(c => c.id === lead?.campaignId) || null;
  const [notes, setNotes] = useState('');
  const [showVariations, setShowVariations] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  // Modal "Perdido"
  const [showLostModal, setShowLostModal] = useState(false);
  const [lossReason, setLossReason] = useState('');
  const [customLossReason, setCustomLossReason] = useState('');

  useEffect(() => {
    if (lead) {
      setNotes(lead.notes || '');
      setShowVariations(false);
      setShowLostModal(false);
      setLossReason('');
      setCustomLossReason('');
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

  const handleCopyMessage = async (message, label = 'Mensagem') => {
    if (!message) {
      toast.warning('Sem mensagem', 'Este lead não possui mensagem personalizada.');
      return;
    }
    try {
      await navigator.clipboard.writeText(message);
      toast.success('Copiado!', 'Mensagem copiada para a área de transferência.');
      // Register event
      await addInteraction(lead.id, 'message_copied', `Mensagem copiada: ${label}`, 'out', 'message_copied', { label });
    } catch {
      toast.error('Erro', 'Não foi possível copiar a mensagem.');
    }
  };

  const handleOpenWhatsApp = async () => {
    if (lead.whatsappUrl) {
      window.open(lead.whatsappUrl, '_blank');
      await addInteraction(lead.id, 'whatsapp_opened', `WhatsApp aberto: ${lead.whatsappUrl}`, 'out', 'whatsapp_opened');
    } else {
      toast.warning('Sem WhatsApp', 'Este lead não possui link do WhatsApp.');
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (newStatus === 'perdido') {
      setShowLostModal(true);
      return;
    }
    await updateLeadStatus(lead.id, newStatus);
    toast.success('Status atualizado', `Lead marcado como "${getStatusLabel(newStatus)}".`);
  };

  const handleConfirmLost = async () => {
    const reason = lossReason === 'Outro' ? customLossReason : lossReason;
    if (!reason) {
      toast.warning('Informe o motivo', 'Selecione ou escreva o motivo da perda.');
      return;
    }
    await updateLeadStatus(lead.id, 'perdido', reason);
    toast.info('Lead marcado como perdido', `Motivo registrado: ${reason}`);
    setShowLostModal(false);
    setLossReason('');
    setCustomLossReason('');
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await updateLead(lead.id, { notes });
      await addInteraction(lead.id, 'note_added', `Observação atualizada`, 'system', 'note_added');
      toast.success('Salvo', 'Observações atualizadas com sucesso.');
    } catch {
      toast.error('Erro', 'Não foi possível salvar as observações.');
    } finally {
      setSavingNotes(false);
    }
  };

  const getInteractionIcon = (interaction) => {
    const type = interaction.eventType || interaction.type;
    switch (type) {
      case 'message_sent': return <Send size={13} />;
      case 'message_copied': return <Copy size={13} />;
      case 'message_received': return <MessageCircle size={13} />;
      case 'whatsapp_opened': return <ExternalLink size={13} />;
      case 'deal_closed': return <Check size={13} />;
      case 'status_changed':
      case 'status_change': return <RefreshCw size={13} />;
      case 'note_added': return <Clock size={13} />;
      case 'return_scheduled': return <Calendar size={13} />;
      default: return <Clock size={13} />;
    }
  };

  const getInteractionColor = (interaction) => {
    const type = interaction.eventType || interaction.type;
    switch (type) {
      case 'message_sent':
      case 'message_copied': return 'var(--green-primary)';
      case 'whatsapp_opened': return 'var(--green-primary)';
      case 'deal_closed': return 'var(--green-primary)';
      case 'status_changed':
      case 'status_change': return 'var(--color-info)';
      default: return 'var(--text-muted)';
    }
  };

  // Status transition buttons (excluding current status and 'descartado')
  const statusButtons = [
    { value: 'contactado', label: 'Contactado', icon: <Send size={13} /> },
    { value: 'follow_up', label: 'Follow-up', icon: <Clock size={13} /> },
    { value: 'respondeu', label: 'Respondeu', icon: <MessageCircle size={13} /> },
    { value: 'qualificado', label: 'Qualificado', icon: <TrendingUp size={13} /> },
    { value: 'negociacao', label: 'Em Negociação', icon: <Handshake size={13} /> },
    { value: 'fechado', label: 'Fechado ✓', icon: <Check size={13} />, primary: true },
    { value: 'perdido', label: 'Perdido', icon: <XCircle size={13} />, danger: true },
  ].filter(b => b.value !== lead.status);

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
              {lead.lossReason && (
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-error)', fontStyle: 'italic' }}>
                  Motivo: {lead.lossReason}
                </span>
              )}
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
              {lead.googleRating && (
                <div className="flex items-center gap-sm">
                  <Star size={14} className="text-muted" />
                  <span className="text-sm">{lead.googleRating} ⭐ ({lead.googleReviewsCount || 0} avaliações)</span>
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
                  <button className="btn btn-sm btn-outline-green" onClick={() => handleCopyMessage(lead.personalizedMessage, 'Principal')}>
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
                          <button className="btn btn-sm btn-ghost" onClick={() => handleCopyMessage(lead.messageDirect, 'Direta')}>
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
                          <button className="btn btn-sm btn-ghost" onClick={() => handleCopyMessage(lead.messageConsultative, 'Consultiva')}>
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
                          <button className="btn btn-sm btn-ghost" onClick={() => handleCopyMessage(lead.messageLight, 'Leve')}>
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

          {/* SÓCIO IA PANEL */}
          <div className="drawer-section">
            <SocioIAPanel lead={lead} campaign={leadCampaign} />
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
            <h3 className="drawer-section-title">Histórico de Ações</h3>
            {leadInteractions.length > 0 ? (
              <div className="flex flex-col" style={{ gap: '2px' }}>
                {leadInteractions.map(interaction => (
                  <div key={interaction.id} style={{
                    display: 'flex', gap: '10px', alignItems: 'flex-start',
                    padding: '8px 0', borderBottom: '1px solid var(--border-subtle)',
                  }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-card-secondary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, marginTop: 2,
                      color: getInteractionColor(interaction),
                    }}>
                      {getInteractionIcon(interaction)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p className="text-sm" style={{ lineHeight: 1.5, color: 'var(--text-secondary)', margin: 0 }}>
                        {interaction.message}
                      </p>
                      <span className="text-xs text-muted">{formatRelativeDate(interaction.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center', padding: 'var(--space-lg)',
                background: 'var(--bg-card-secondary)', borderRadius: 'var(--radius-md)',
              }}>
                <Clock size={20} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                <p className="text-sm text-muted">Nenhuma ação registrada ainda.</p>
                <p className="text-xs text-muted">As ações serão registradas automaticamente ao copiar mensagens, abrir o WhatsApp e alterar o status.</p>
              </div>
            )}
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div style={{
          padding: 'var(--space-lg) var(--space-xl)',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-card)',
          position: 'sticky',
          bottom: 0,
        }}>
          <div className="flex gap-sm mb-base">
            <button className="btn btn-primary btn-sm flex-1" onClick={() => handleCopyMessage(lead.personalizedMessage, 'Principal')}>
              <Copy size={14} /> Copiar mensagem
            </button>
            <button className="btn btn-secondary btn-sm flex-1" onClick={handleOpenWhatsApp}>
              <ExternalLink size={14} /> Abrir WhatsApp
            </button>
          </div>

          {/* Status change buttons */}
          <div style={{ marginBottom: 'var(--space-xs)' }}>
            <span className="text-xs text-muted" style={{ display: 'block', marginBottom: '6px' }}>Mover para:</span>
            <div className="flex gap-sm flex-wrap">
              {statusButtons.map(btn => (
                <button
                  key={btn.value}
                  className={`btn btn-sm ${btn.primary ? 'btn-outline-green' : btn.danger ? 'btn-ghost' : 'btn-ghost'}`}
                  style={btn.danger ? { color: 'var(--color-error)', borderColor: 'var(--color-error)' } : {}}
                  onClick={() => handleStatusChange(btn.value)}
                >
                  {btn.icon} {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Motivo da Perda */}
      {showLostModal && (
        <div className="modal-overlay" style={{ zIndex: 10000 }} onClick={() => setShowLostModal(false)}>
          <div className="modal" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <XCircle size={18} style={{ color: 'var(--color-error)' }} />
                  Marcar como Perdido
                </h3>
                <p className="modal-subtitle">Registre o motivo para melhorar suas próximas abordagens</p>
              </div>
              <button className="modal-close" onClick={() => setShowLostModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Motivo da perda *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {LOSS_REASONS.map(r => (
                    <label key={r} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 14px', borderRadius: 'var(--radius-md)',
                      border: `1px solid ${lossReason === r ? 'var(--color-error)' : 'var(--border-primary)'}`,
                      background: lossReason === r ? 'rgba(239,68,68,0.08)' : 'var(--bg-card-secondary)',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                      <input
                        type="radio"
                        name="lossReason"
                        value={r}
                        checked={lossReason === r}
                        onChange={() => setLossReason(r)}
                        style={{ accentColor: 'var(--color-error)' }}
                      />
                      <span className="text-sm">{r}</span>
                    </label>
                  ))}
                </div>
              </div>
              {lossReason === 'Outro' && (
                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label className="form-label">Descreva o motivo</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Cliente já tem parceiro fixo..."
                    value={customLossReason}
                    onChange={e => setCustomLossReason(e.target.value)}
                    autoFocus
                  />
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <button className="btn btn-secondary" onClick={() => setShowLostModal(false)}>Cancelar</button>
              <button
                className="btn btn-primary"
                style={{ background: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                onClick={handleConfirmLost}
                disabled={!lossReason}
              >
                Confirmar perda
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
