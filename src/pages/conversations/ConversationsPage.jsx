import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageCircle,
  Search,
  Bot,
  Zap,
  Copy,
  Check,
  User,
  ArrowRight,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { getInitials, getStatusColor, getStatusLabel } from '../../utils/formatters.js';
import { generateSocioResponses } from '../../utils/messageGenerator.js';

export default function ConversationsPage() {
  const { leads, campaigns, addInteraction, updateLeadStatus } = useApp();
  const toast = useToast();
  const navigate = useNavigate();

  const [selectedLead, setSelectedLead] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [receivedMessage, setReceivedMessage] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedOptions, setGeneratedOptions] = useState(null);

  // Filter contacts: only show leads with status 'respondeu' or 'contactado'
  const contacts = leads.filter((lead) => {
    const isTargetStatus = lead.status === 'respondeu' || lead.status === 'contactado';
    const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (lead.username && lead.username.toLowerCase().includes(searchQuery.toLowerCase()));
    return isTargetStatus && matchesSearch;
  });

  const respondeuCount = leads.filter((l) => l.status === 'respondeu').length;

  const handleSelectLead = (lead) => {
    setSelectedLead(lead);
    setReceivedMessage('');
    setGeneratedOptions(null);
  };

  const handleGenerateResponses = async () => {
    if (!receivedMessage.trim()) {
      toast.warning('Aviso', 'Cole a resposta enviada pelo lead antes de gerar.');
      return;
    }

    setGenerating(true);
    // Simulate short network delay
    await new Promise((r) => setTimeout(r, 1000));

    const campaign = campaigns.find((c) => c.id === selectedLead.campaignId);
    
    // Generate responses using helper
    const responses = generateSocioResponses({
      lead: selectedLead,
      campaign,
      sentMessage: selectedLead.personalizedMessage,
      receivedReply: receivedMessage,
    });

    setGeneratedOptions(responses);
    setGenerating(false);
    toast.success('Respostas geradas!', 'O Sócio elaborou 3 caminhos de abordagem.');
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copiado!', 'Resposta copiada para área de transferência.');
    });
  };

  const handleUseResponse = async (responseText, label) => {
    try {
      // Add interaction to history
      await addInteraction(selectedLead.id, {
        type: 'socio_response',
        message: `[${label}] ${responseText}`,
        direction: 'sent',
      });

      // Update lead status to responded
      await updateLeadStatus(selectedLead.id, 'contactado');

      toast.success('Resposta salva!', 'Histórico de interação atualizado.');
    } catch (err) {
      toast.error('Erro', 'Não foi possível salvar a interação.');
    }
  };

  const getCampaignName = (campaignId) => {
    const c = campaigns.find((item) => item.id === campaignId);
    return c ? c.name : '—';
  };

  return (
    <div className="chat-layout" style={{ display: 'flex', height: 'calc(100vh - 0px)', overflow: 'hidden' }}>
      {/* LEFT SIDEBAR contacts */}
      <div className="chat-sidebar" style={{ width: '320px', borderRight: '1px solid #1A2B1D', display: 'flex', flexDirection: 'column', background: '#0A0F0D' }}>
        <div className="chat-sidebar-header" style={{ padding: '20px 16px', borderBottom: '1px solid #1A2B1D', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ color: '#00C85A' }}>
              <Bot size={24} />
            </div>
            <span style={{ fontWeight: '600', fontSize: '16px', color: '#F0F4F1' }}>Sócio AI</span>
          </div>
          {respondeuCount > 0 && (
            <span style={{ background: '#0D2B18', color: '#00C85A', fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '12px' }}>{respondeuCount} novos</span>
          )}
        </div>

        {/* Search */}
        <div style={{ padding: '16px', position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '28px', top: '50%', transform: 'translateY(-50%)', color: '#4A5C4D' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '36px', width: '100%', fontSize: '13px', background: '#111A14', borderColor: '#1E2E21' }}
            placeholder="Buscar lead..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Contact list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }} className="hide-scrollbar">
          {contacts.map((contact) => {
            const isActive = selectedLead?.id === contact.id;
            return (
              <div
                key={contact.id}
                className={`chat-contact ${isActive ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  margin: '4px 0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: isActive ? '#0D2B18' : 'transparent',
                  border: isActive ? '1px solid #00C85A' : '1px solid transparent',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = '#111A14';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
                onClick={() => handleSelectLead(contact)}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: '#111A14',
                    border: '1px solid #1E2E21',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '600',
                    fontSize: '12px',
                    color: '#00C85A',
                  }}
                >
                  {getInitials(contact.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '550', fontSize: '13px', color: '#F0F4F1', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {contact.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#7A8C7D', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {getCampaignName(contact.campaignId)}
                  </div>
                </div>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: contact.status === 'respondeu' ? '#00C85A' : '#3B82F6' }}></span>
              </div>
            );
          })}

          {contacts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px', color: '#7A8C7D', fontSize: '13px' }}>
              Nenhum contato encontrado.
            </div>
          )}
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div className="chat-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
        {selectedLead ? (
          <>
            {/* Header info */}
            <div className="chat-main-header" style={{ padding: 'var(--space-lg)', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-sidebar)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {selectedLead.name}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                  <span className={`badge badge-${getStatusColor(selectedLead.status)}`}>{getStatusLabel(selectedLead.status)}</span>
                  <span className="text-xs text-muted">Origem: {getCampaignName(selectedLead.campaignId)}</span>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/leads?id=${selectedLead.id}`)}>
                Ver Ficha Completa
              </button>
            </div>

            {/* Chat Body */}
            <div className="chat-main-body" style={{ flex: 1, padding: 'var(--space-xl)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
              {/* Profile Context Banner */}
              <div className="card card-secondary" style={{ padding: 'var(--space-md)' }}>
                <strong style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Bio do Lead:</strong>
                <p style={{ fontSize: 'var(--font-size-sm)', margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>{selectedLead.bio || 'Sem bio cadastrada.'}</p>
              </div>

              {/* Sent initial message */}
              {selectedLead.personalizedMessage && (
                <div style={{ alignSelf: 'flex-end', maxWidth: '75%' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', textAlign: 'right' }}>Abordagem Inicial Enviada</div>
                  <div style={{ background: 'var(--green-active)', color: 'var(--text-primary)', padding: 'var(--space-md)', borderRadius: '12px 12px 0 12px', border: '1px solid var(--green-primary)', whiteSpace: 'pre-line', fontSize: 'var(--font-size-sm)' }}>
                    {selectedLead.personalizedMessage}
                  </div>
                </div>
              )}

              {/* Socio AI Responses Panel */}
              {generatedOptions ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                  <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles className="text-green" size={16} />
                    Sugestões do Sócio
                  </h3>

                  <div className="ai-response-card">
                    <div className="ai-response-label">Resposta Direta</div>
                    <p className="ai-response-text">{generatedOptions.directResponse}</p>
                    <div className="ai-response-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => handleCopy(generatedOptions.directResponse)}>
                        <Copy size={12} style={{ marginRight: '4px' }} /> Copiar
                      </button>
                      <button className="btn btn-primary btn-sm" onClick={() => handleUseResponse(generatedOptions.directResponse, 'Direta')}>
                        Usar esta
                      </button>
                    </div>
                  </div>

                  <div className="ai-response-card">
                    <div className="ai-response-label">Resposta Firme</div>
                    <p className="ai-response-text">{generatedOptions.firmResponse}</p>
                    <div className="ai-response-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => handleCopy(generatedOptions.firmResponse)}>
                        <Copy size={12} style={{ marginRight: '4px' }} /> Copiar
                      </button>
                      <button className="btn btn-primary btn-sm" onClick={() => handleUseResponse(generatedOptions.firmResponse, 'Firme')}>
                        Usar esta
                      </button>
                    </div>
                  </div>

                  <div className="ai-response-card">
                    <div className="ai-response-label">Resposta Leve</div>
                    <p className="ai-response-text">{generatedOptions.lightResponse}</p>
                    <div className="ai-response-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => handleCopy(generatedOptions.lightResponse)}>
                        <Copy size={12} style={{ marginRight: '4px' }} /> Copiar
                      </button>
                      <button className="btn btn-primary btn-sm" onClick={() => handleUseResponse(generatedOptions.lightResponse, 'Leve')}>
                        Usar esta
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginTop: 'auto' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="socio-reply-input">Cole aqui o que o lead respondeu no WhatsApp:</label>
                    <textarea
                      id="socio-reply-input"
                      className="form-input"
                      rows={4}
                      placeholder="Ex: 'Olá, tenho interesse sim. Quanto custa o serviço?'"
                      value={receivedMessage}
                      onChange={(e) => setReceivedMessage(e.target.value)}
                    ></textarea>
                  </div>
                  <button className="btn btn-primary" onClick={handleGenerateResponses} disabled={generating || !receivedMessage.trim()}>
                    <Zap size={16} style={{ marginRight: '8px' }} />
                    {generating ? 'Gerando respostas...' : 'Gerar alternativas com o Sócio'}
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Default state when no lead selected */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: 'var(--space-3xl)', textAlign: 'center' }}>
            <div style={{ color: '#1E2E21', marginBottom: '24px' }}>
              <Bot size={48} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '500', color: '#F0F4F1', marginBottom: '12px' }}>
              Selecione uma conversa
            </h2>
            <p style={{ color: '#7A8C7D', maxWidth: '420px', fontSize: '14px', lineHeight: '1.5' }}>
              Escolha um lead na barra lateral para gerar respostas inteligentes com o Sócio AI baseadas no histórico da campanha.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
