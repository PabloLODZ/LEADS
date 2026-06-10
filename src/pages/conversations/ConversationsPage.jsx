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
      <div className="chat-sidebar" style={{ width: '320px', borderRight: '1px solid var(--border-primary)', display: 'flex', flexDirection: 'column', background: 'var(--bg-sidebar)' }}>
        <div className="chat-sidebar-header" style={{ padding: 'var(--space-lg)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'var(--green-glow)', color: 'var(--green-primary)', padding: '6px', borderRadius: '8px' }}>
              <Bot size={20} />
            </div>
            <span style={{ fontWeight: '700', fontSize: 'var(--font-size-md)', color: 'var(--text-primary)' }}>Sócio AI</span>
          </div>
          {respondeuCount > 0 && (
            <span className="badge badge-green">{respondeuCount} aguardando</span>
          )}
        </div>

        {/* Search */}
        <div style={{ padding: 'var(--space-md)', position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '24px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '32px', width: '100%', fontSize: 'var(--font-size-xs)' }}
            placeholder="Buscar lead..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Contact list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 var(--space-xs)' }}>
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
                  padding: 'var(--space-md)',
                  margin: '4px var(--space-sm)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  background: isActive ? 'var(--green-active)' : '',
                  border: isActive ? '1px solid var(--green-primary)' : '1px solid transparent',
                }}
                onClick={() => handleSelectLead(contact)}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'var(--bg-card-secondary)',
                    border: '1px solid var(--border-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '600',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {getInitials(contact.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '600', fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {contact.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {getCampaignName(contact.campaignId)}
                  </div>
                </div>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: contact.status === 'respondeu' ? 'var(--green-primary)' : 'var(--color-info)' }}></span>
              </div>
            );
          })}

          {contacts.length === 0 && (
            <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
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
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--green-glow)', color: 'var(--green-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-lg)' }}>
              <Bot size={32} />
            </div>
            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '700', color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>
              Conversa com o Sócio AI
            </h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '500px', marginBottom: 'var(--space-2xl)', fontSize: 'var(--font-size-sm)' }}>
              Quando um lead responder à sua prospecção inicial no WhatsApp, cole a resposta dele aqui. 
              O Sócio lerá o contexto da campanha e criará três jeitos inteligentes de continuar o diálogo.
            </p>

            {/* Steps Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-lg)', width: '100%', maxWidth: '600px' }}>
              <div className="card" style={{ padding: 'var(--space-md)' }}>
                <span className="text-green" style={{ fontWeight: '700', fontSize: 'var(--font-size-base)' }}>1. Selecione</span>
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)', marginTop: '4px' }}>Escolha um lead respondido ou abordado na lista ao lado.</p>
              </div>
              <div className="card" style={{ padding: 'var(--space-md)' }}>
                <span className="text-green" style={{ fontWeight: '700', fontSize: 'var(--font-size-base)' }}>2. Cole a resposta</span>
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)', marginTop: '4px' }}>Insira a mensagem que você recebeu no WhatsApp.</p>
              </div>
              <div className="card" style={{ padding: 'var(--space-md)' }}>
                <span className="text-green" style={{ fontWeight: '700', fontSize: 'var(--font-size-base)' }}>3. Copie o melhor</span>
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)', marginTop: '4px' }}>Selecione o tom ideal e responda ao cliente em segundos.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
