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
import { generateChatResponse } from '../../utils/messageGenerator.js';

export default function ConversationsPage() {
  const { leads, campaigns, addInteraction, updateLeadStatus } = useApp();
  const toast = useToast();
  const navigate = useNavigate();

  const [selectedLead, setSelectedLead] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

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
    setChatInput('');
    setChatHistory([{
      role: 'ai',
      content: `Olá! Vi que o lead **${lead.name}** é do segmento de **${lead.segment || 'negócios'}**. Cole o que ele respondeu ou me diga qual é a objeção dele para eu te ajudar a fechar essa venda.`
    }]);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatInput('');
    
    const newHistory = [...chatHistory, { role: 'user', content: userMsg }];
    setChatHistory(newHistory);
    setGenerating(true);

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 1000));

    // Generate AI chat response
    const response = generateChatResponse(selectedLead, userMsg, newHistory);

    setChatHistory([...newHistory, {
      role: 'ai',
      content: response.content,
      suggestion: response.suggestion
    }]);
    
    setGenerating(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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
      <div className="chat-sidebar" style={{ width: '320px', borderRight: '1px solid var(--border-primary)', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
        <div className="chat-sidebar-header" style={{ padding: '20px 16px', borderBottom: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ color: 'var(--green-primary)' }}>
              <Bot size={24} />
            </div>
            <span style={{ fontWeight: '600', fontSize: '16px', color: 'var(--text-primary)' }}>Sócio AI</span>
          </div>
          {respondeuCount > 0 && (
            <span style={{ background: 'var(--green-dark)', color: 'var(--green-primary)', fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '12px' }}>{respondeuCount} novos</span>
          )}
        </div>

        {/* Search */}
        <div style={{ padding: '16px', position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '28px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '36px', width: '100%', fontSize: '13px', background: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
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
                  background: isActive ? 'var(--green-dark)' : 'transparent',
                  border: isActive ? '1px solid var(--green-primary)' : '1px solid transparent',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'var(--bg-card)';
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
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '600',
                    fontSize: '12px',
                    color: 'var(--green-primary)',
                  }}
                >
                  {getInitials(contact.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '550', fontSize: '13px', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {contact.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {getCampaignName(contact.campaignId)}
                  </div>
                </div>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: contact.status === 'respondeu' ? 'var(--green-primary)' : 'var(--color-info)' }}></span>
              </div>
            );
          })}

          {contacts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)', fontSize: '13px' }}>
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
              <div className="card card-secondary" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                <strong style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Contexto do Lead:</strong>
                <p style={{ fontSize: 'var(--font-size-sm)', margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>{selectedLead.bio || 'Sem bio cadastrada.'}</p>
                {selectedLead.personalizedMessage && (
                  <div style={{ marginTop: '8px', padding: '8px', background: 'var(--bg-primary)', borderRadius: '6px', fontSize: '12px', border: '1px solid var(--border-primary)' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Primeira abordagem enviada:</span>
                    <span style={{ color: 'var(--text-primary)' }}>{selectedLead.personalizedMessage}</span>
                  </div>
                )}
              </div>

              {/* Chat History */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                {chatHistory.map((msg, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%'
                  }}>
                    {/* Avatar */}
                    <div style={{ 
                      width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: msg.role === 'user' ? 'var(--bg-card)' : 'var(--green-dark)',
                      border: '1px solid',
                      borderColor: msg.role === 'user' ? 'var(--border-primary)' : 'var(--green-primary)',
                      color: msg.role === 'user' ? 'var(--text-secondary)' : 'var(--green-primary)'
                    }}>
                      {msg.role === 'user' ? <User size={16} /> : <Bot size={18} />}
                    </div>

                    {/* Bubble */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{
                        background: msg.role === 'user' ? 'var(--bg-card)' : 'transparent',
                        border: msg.role === 'user' ? '1px solid var(--border-primary)' : 'none',
                        padding: msg.role === 'user' ? '12px 16px' : '0',
                        borderRadius: msg.role === 'user' ? '12px 0 12px 12px' : '0',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        lineHeight: '1.5'
                      }}>
                        {/* Process bold text for AI messages */}
                        {msg.role === 'ai' ? (
                          <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                        ) : (
                          msg.content
                        )}
                      </div>

                      {/* AI Suggestion Card */}
                      {msg.suggestion && (
                        <div style={{
                          background: 'var(--bg-card-secondary)',
                          border: '1px solid var(--border-primary)',
                          borderRadius: '12px',
                          padding: '16px',
                          marginTop: '4px'
                        }}>
                          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--green-primary)', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Sparkles size={12} />
                            Sugestão de Resposta
                          </div>
                          <p style={{ color: 'var(--text-primary)', fontSize: '14px', lineHeight: '1.5', margin: '0 0 16px 0' }}>
                            {msg.suggestion}
                          </p>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => handleCopy(msg.suggestion)}>
                              <Copy size={14} style={{ marginRight: '6px' }} /> Copiar
                            </button>
                            <button className="btn btn-primary btn-sm" onClick={() => handleUseResponse(msg.suggestion, 'Chat AI')}>
                              <Check size={14} style={{ marginRight: '6px' }} /> Salvar no histórico
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {generating && (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--green-dark)', border: '1px solid var(--green-primary)', color: 'var(--green-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Bot size={18} />
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Digitando...</div>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Input Area */}
            <div style={{ padding: 'var(--space-md) var(--space-xl)', borderTop: '1px solid var(--border-primary)', background: 'var(--bg-primary)' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px', padding: '8px' }}>
                <textarea
                  className="form-input"
                  style={{ border: 'none', background: 'transparent', width: '100%', resize: 'none', padding: '8px', maxHeight: '120px', minHeight: '44px' }}
                  rows={chatInput.split('\n').length > 1 ? Math.min(chatInput.split('\n').length, 4) : 1}
                  placeholder="Cole o que o lead respondeu ou peça uma sugestão..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={generating}
                />
                <button 
                  className="btn btn-primary" 
                  style={{ width: '40px', height: '40px', padding: 0, borderRadius: '8px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={handleSendMessage}
                  disabled={generating || !chatInput.trim()}
                >
                  <ArrowRight size={18} />
                </button>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px' }}>
                O Sócio AI pode cometer erros. Revise a mensagem antes de enviar para o lead.
              </div>
            </div>
          </>
        ) : (
          /* Default state when no lead selected */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: 'var(--space-3xl)', textAlign: 'center' }}>
            <div style={{ color: 'var(--border-primary)', marginBottom: '24px' }}>
              <Bot size={48} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '12px' }}>
              Selecione uma conversa
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', fontSize: '14px', lineHeight: '1.5' }}>
              Escolha um lead na barra lateral para gerar respostas inteligentes com o Sócio AI baseadas no histórico da campanha.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
