import { useState } from 'react';
import {
  Sparkles, Copy, ThumbsUp, ThumbsDown, AlertCircle,
  ChevronDown, Loader, RotateCcw, MessageSquare,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { useApp } from '../../contexts/AppContext.jsx';

const MESSAGE_TYPES = [
  { id: 'primeira_abordagem', label: '🚀 Primeira abordagem', description: 'Para leads ainda não contactados', locked: false, cost: 1 },
  { id: 'direta',            label: '⚡ Mensagem direta',    description: 'Objetiva, sem rodeios', locked: false, cost: 1 },
  { id: 'whatsapp_curta',    label: '📱 WhatsApp curta',     description: 'Máximo 3 linhas, ideal p/ WA', locked: false, cost: 1 },
  { id: 'followup_educado',   label: '📩 Follow-up educado',  description: 'Depois de uma mensagem sem resposta', locked: false, cost: 1 },
  { id: 'lead_frio',         label: '❄️ Lead frio',          description: 'Sem resposta há vários dias', locked: false, cost: 1 },
  { id: 'objecao_preco',     label: '💰 Objeção de preço',   description: 'Lead disse que está caro', locked: false, cost: 1 },
  { id: 'analise_psicologica', label: '🧠 Análise Psicológica', description: 'Usa PNL para analisar a bio do lead', premium: true, cost: 2 },
  { id: 'extrator_objecoes',   label: '🛡️ Extrator de Objeções', description: 'Antecipa as barreiras de compra do lead', premium: true, cost: 2 },
];

const FEEDBACK_OPTIONS = [
  { id: 'boa',          label: '👍 Boa!',           color: 'var(--color-success)' },
  { id: 'muito_generica', label: '😐 Genérica',     color: 'var(--color-warning)' },
  { id: 'muito_longa',  label: '📏 Muito longa',    color: 'var(--color-warning)' },
  { id: 'melhorar_tom', label: '🎭 Melhorar tom',   color: 'var(--color-info)' },
  { id: 'mais_objetiva',label: '🎯 Mais objetiva',  color: 'var(--color-info)' },
];

export default function SocioIAPanel({ lead, campaign }) {
  const { user, isAdmin, updateUser } = useAuth();
  const toast = useToast();
  const { addInteraction, setCreditTransactions } = useApp();

  const [selectedType, setSelectedType] = useState('primeira_abordagem');
  const [customInstruction, setCustomInstruction] = useState('');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(null);
  const [showCustom, setShowCustom] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const selectedTypeDef = MESSAGE_TYPES.find(t => t.id === selectedType);
  const isStarter = user?.planId === 'starter' && !isAdmin;
  const isCustomLocked = (user?.planId === 'starter' || user?.planId === 'growth') && !isAdmin;

  const isProOrAgency = user?.planId === 'pro' || user?.planId === 'agency';

  const handleTypeSelect = (type) => {
    if (type.premium && !isProOrAgency && !isAdmin) {
      toast.error('Recurso Avançado', 'Faça upgrade para o plano PRO ou AGENCY para acessar a Análise Psicológica e PNL avançada.');
      return;
    }
    setSelectedType(type.id);
    setShowTypeDropdown(false);
    setGeneratedMessage('');
    setFeedbackGiven(null);
  };

  const handleGenerate = async () => {
    if (!lead?.id || !user?.id) return;
    setIsGenerating(true);
    setGeneratedMessage('');
    setFeedbackGiven(null);

    try {
      const response = await fetch('/api/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead: {
            name: lead.name,
            city: lead.city,
            state: lead.state,
            segment: lead.segment,
            bio: lead.bio,
            googleRating: lead.googleRating,
            googleReviewsCount: lead.googleReviewsCount,
            notes: lead.notes,
            status: lead.status,
            lossReason: lead.lossReason,
          },
          campaign: campaign ? {
            offer: campaign.offer,
            tone: campaign.tone,
            channel: campaign.channel,
          } : null,
          messageType: selectedType,
          customInstruction: customInstruction.trim() || null,
          userId: user.id,
          campaign: campaign ? {
            ...campaign,
            planId: user?.planId,
          } : { planId: user?.planId },
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro ao gerar mensagem.');
      }

      const data = await response.json();
      setGeneratedMessage(data.message);

      if (data.credits) {
        updateUser({
          creditWallet: {
            baseCredits: data.credits.base_credits,
            purchasedCredits: data.credits.purchased_credits,
          }
        });
      }

      if (data.transaction) {
        setCreditTransactions(prev => [{
          id: data.transaction.id,
          userId: data.transaction.user_id,
          type: data.transaction.type,
          amount: data.transaction.amount,
          balanceBefore: data.transaction.balance_before,
          balanceAfter: data.transaction.balance_after,
          reason: data.transaction.reason,
          createdAt: data.transaction.created_at,
        }, ...prev]);
      }

      // Log in interactions
      await addInteraction(
        lead.id,
        'ai_message',
        `Mensagem IA gerada (${data.messageTypeLabel}): ${data.message.substring(0, 100)}...`,
        'out',
        'ai_message_generated',
        { messageType: selectedType, fullMessage: data.message, cost: selectedTypeDef.cost || 1 }
      );

      toast.success('Mensagem gerada!', 'Revise e copie para o WhatsApp.');
    } catch (err) {
      toast.error('Erro na IA', err.message || 'Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedMessage) return;
    await navigator.clipboard.writeText(generatedMessage);
    await addInteraction(
      lead.id,
      'message_copied',
      `Mensagem IA copiada (${selectedTypeDef?.label})`,
      'out',
      'message_copied',
      { source: 'ia_especialista' }
    );
    toast.success('Copiado!', 'Mensagem na área de transferência.');
  };

  const handleFeedback = (feedbackId) => {
    setFeedbackGiven(feedbackId);
    const option = FEEDBACK_OPTIONS.find(f => f.id === feedbackId);
    toast.info('Obrigado!', `Feedback "${option?.label}" registrado.`);

    if (feedbackId === 'muito_generica' || feedbackId === 'muito_longa' || feedbackId === 'mais_objetiva') {
      // Auto-suggest regeneration
      setTimeout(() => {
        toast.info('Dica', 'Adicione uma instrução específica e gere novamente!');
        setShowCustom(true);
      }, 1200);
    }
  };

  return (
    <div style={{
      background: 'var(--bg-card-secondary)',
      border: '1px solid var(--border-primary)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-lg)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)' }}>
        <div style={{
          width: '28px', height: '28px',
          background: 'linear-gradient(135deg, var(--green-primary), #00a0e9)',
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Sparkles size={14} color="#000" />
        </div>
        <div>
          <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-primary)' }}>IA Especialista</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Gerador inteligente de mensagens</div>
        </div>
      </div>

      {/* Type selector */}
      <div style={{ marginBottom: 'var(--space-md)', position: 'relative' }}>
        <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Tipo de mensagem
        </label>
        <button
          onClick={() => setShowTypeDropdown(!showTypeDropdown)}
          style={{
            width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '9px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', cursor: 'pointer',
            fontSize: '13px', fontWeight: '600',
          }}
        >
          <span>{selectedTypeDef?.label}</span>
          <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: showTypeDropdown ? 'rotate(180deg)' : 'none' }} />
        </button>
        {showTypeDropdown && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
            background: 'var(--bg-card)', border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-md)', overflow: 'hidden',
            boxShadow: 'var(--shadow-lg)', marginTop: '4px',
          }}>
            {MESSAGE_TYPES.map(type => {
              const isLocked = type.premium && (!isProOrAgency && !isAdmin);
              return (
                <div
                  key={type.id}
                  style={{
                    padding: '12px',
                    borderBottom: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    background: selectedType === type.id ? 'var(--bg-active)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onClick={() => handleTypeSelect(type)}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {type.label}
                      {type.premium && (!isProOrAgency && !isAdmin) && (
                        <span style={{ fontSize: '10px', background: 'var(--color-warning-bg)', color: 'var(--color-warning)', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertCircle size={10} /> PRO
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {type.description}
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
                    ⚡ {type.cost} Crédito{type.cost > 1 ? 's' : ''}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Custom instruction toggle */}
      <div style={{ marginBottom: 'var(--space-md)' }}>
        <button
          onClick={() => {
            if (isCustomLocked) {
              toast.error('Recurso Pro', 'Instruções personalizadas são exclusivas do plano Pro ou superior.');
              return;
            }
            setShowCustom(!showCustom);
          }}
          style={{ background: 'none', border: 'none', color: isCustomLocked ? 'var(--text-muted)' : 'var(--text-muted)', fontSize: '12px', cursor: isCustomLocked ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px', opacity: isCustomLocked ? 0.6 : 1 }}
        >
          <MessageSquare size={12} />
          {showCustom ? 'Ocultar instrução personalizada' : 'Adicionar instrução personalizada'}
          {isCustomLocked && <span style={{ fontSize: '10px', background: 'var(--bg-app)', padding: '2px 4px', borderRadius: '4px', color: 'var(--text-muted)', marginLeft: '4px' }}>PRO</span>}
        </button>
        {showCustom && !isCustomLocked && (
          <textarea
            className="form-input"
            style={{ marginTop: '8px', fontSize: '13px', minHeight: '60px', resize: 'none' }}
            placeholder="Ex: Mencione que trabalhamos com clientes da cidade deles. Seja mais empático..."
            value={customInstruction}
            onChange={e => setCustomInstruction(e.target.value)}
            maxLength={300}
          />
        )}
      </div>

      {/* Generate button */}
      <button
        className="btn btn-primary"
        style={{ width: '100%', marginBottom: 'var(--space-md)', position: 'relative', overflow: 'hidden' }}
        onClick={handleGenerate}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <>
            <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} />
            Gerando com IA...
          </>
        ) : (
          <>
            <Sparkles size={15} />
            {generatedMessage ? 'Gerar novamente' : 'Gerar mensagem'}
          </>
        )}
      </button>

      {/* Generated message */}
      {generatedMessage && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--green-primary)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-md)',
          marginBottom: 'var(--space-sm)',
        }}>
          <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.7, marginBottom: '10px', whiteSpace: 'pre-wrap' }}>
            {generatedMessage}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleCopy}
            >
              <Copy size={13} /> Copiar mensagem
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleGenerate}
              disabled={isGenerating}
              style={{ fontSize: '12px' }}
            >
              <RotateCcw size={12} /> Regerar
            </button>
          </div>

          {/* Feedback */}
          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Como foi essa mensagem?</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {FEEDBACK_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleFeedback(opt.id)}
                  style={{
                    padding: '3px 10px', borderRadius: '99px', fontSize: '11px', cursor: 'pointer',
                    border: `1px solid ${feedbackGiven === opt.id ? opt.color : 'var(--border-primary)'}`,
                    background: feedbackGiven === opt.id ? `${opt.color}20` : 'transparent',
                    color: feedbackGiven === opt.id ? opt.color : 'var(--text-muted)',
                    fontWeight: feedbackGiven === opt.id ? '700' : '400',
                    transition: 'all 0.15s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Info footer */}
      {!generatedMessage && !isGenerating && (
        <div style={{ textAlign: 'center', padding: 'var(--space-md)' }}>
          <Sparkles size={24} color="var(--text-muted)" style={{ margin: '0 auto var(--space-md)' }} />
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            A IA Especialista usa dados do lead (cidade, segmento, bio, observações) para criar abordagens persuasivas focadas em conversão.
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-warning)', marginTop: '12px', fontWeight: '600' }}>
            Custo: ⚡ {selectedTypeDef?.cost || 1} Crédito
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
