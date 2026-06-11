import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, ChevronRight, ChevronLeft, Check, AlertCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { getTotalCredits } from '../../utils/creditEngine.js';
import { generatePersonalizedLeadMessage } from '../../utils/messageGenerator.js';

export default function NewCampaignModal({ isOpen, onClose }) {
  const { createCampaign, generateLeadsForCampaign } = useApp();
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  // Form states
  // Step 1
  const [name, setName] = useState('');
  const [offer, setOffer] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [segment, setSegment] = useState('');
  const [location, setLocation] = useState('');
  const [desiredCount, setDesiredCount] = useState(20);
  const [tone, setTone] = useState('direto');

  // Step 2
  const [keyword, setKeyword] = useState('');
  const [hasWhatsapp, setHasWhatsapp] = useState(true);
  const [hasInstagram, setHasInstagram] = useState(true);
  const [hasSite, setHasSite] = useState(false);
  const [hasBio, setHasBio] = useState(true);
  const [minScore, setMinScore] = useState(50);
  const [avoidDuplicates, setAvoidDuplicates] = useState(true);

  // Step 3
  const [msgSize, setMsgSize] = useState('média');
  const [channel, setChannel] = useState('whatsapp');
  const [customizationLevel, setCustomizationLevel] = useState('normal');

  // Step 4
  const [selectedMessageText, setSelectedMessageText] = useState('');
  const [previews, setPreviews] = useState({ direto: '', consultivo: '', leve: '' });

  // Sync segment and location from Step 1 to Keyword / criteria on step change
  useEffect(() => {
    if (step === 2) {
      if (!keyword && segment) setKeyword(segment);
    }
  }, [step, segment, keyword]);

  // Generate previews when reaching step 4
  useEffect(() => {
    if (step === 4) {
      const mockLead = {
        name: 'Carlos Oliveira',
        username: 'carlos_dentista',
        bio: 'Consultório Odontológico no Setor Bueno, Goiânia. Implantes e estética.',
        city: location || 'Goiânia',
        segment: segment || 'Clínica Odontológica',
      };
      const mockCampaign = { name, offer, tone, segment, location };

      const dir = generatePersonalizedLeadMessage({ lead: mockLead, campaign: mockCampaign, userOffer: offer, tone: 'direto' });
      const cons = generatePersonalizedLeadMessage({ lead: mockLead, campaign: mockCampaign, userOffer: offer, tone: 'consultivo' });
      const lev = generatePersonalizedLeadMessage({ lead: mockLead, campaign: mockCampaign, userOffer: offer, tone: 'leve' });

      // generatePersonalizedLeadMessage returns an object — extract the string
      const diretaTxt = dir?.recommendedMessage || dir?.directVersion || '';
      const consulTxt = cons?.recommendedMessage || cons?.consultativeVersion || '';
      const leveTxt = lev?.recommendedMessage || lev?.lightVersion || '';

      setPreviews({ direto: diretaTxt, consultivo: consulTxt, leve: leveTxt });

      // Default to direct
      if (!selectedMessageText) {
        setSelectedMessageText(diretaTxt);
      }
    }
  }, [step, name, offer, tone, segment, location, selectedMessageText]);

  if (!isOpen) return null;

  const totalCredits = getTotalCredits(user?.creditWallet);
  const hasEnoughCredits = isAdmin || totalCredits >= desiredCount;

  const handleNext = () => {
    if (step === 1 && (!name || !offer || !targetAudience || !segment || !location)) {
      toast.warning('Campos incompletos', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    setStep(step + 1);
  };

  const handlePrev = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    try {
      const campaignData = {
        name,
        offer,
        targetAudience,
        segment,
        location,
        desiredCount,
        tone,
        criteria: {
          keyword,
          hasWhatsapp,
          hasInstagram,
          hasSite,
          hasBio,
          minScore,
          avoidDuplicates,
        },
        messageSettings: {
          msgSize,
          channel,
          customizationLevel,
          initialTemplate: selectedMessageText,
        },
        status: 'ativa',
      };

      const newCampaign = await createCampaign(campaignData);
      toast.info('Buscando leads', 'Nossa IA está garimpando leads qualificados para sua campanha...');
      
      // Generate leads using Google Places API
      await generateLeadsForCampaign(newCampaign, desiredCount);
      
      toast.success('Campanha iniciada!', `Garimpamos ${desiredCount} leads com score otimizado.`);
      onClose();
      navigate(`/leads?campaignId=${newCampaign.id}`);
      
      // Reset state
      setStep(1);
      setName('');
      setOffer('');
      setTargetAudience('');
      setSegment('');
      setLocation('');
      setDesiredCount(20);
      setSelectedMessageText('');
    } catch (err) {
      toast.error('Erro ao criar campanha', err.message || 'Ocorreu um problema ao iniciar a prospecção.');
    }
  };

  const tones = ['direto', 'leve', 'consultivo', 'firme', 'premium'];
  const msgSizes = ['curta', 'média', 'completa'];
  const channels = ['whatsapp', 'instagram', 'email'];
  const customizationLevels = ['leve', 'normal', 'alta'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px' }}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles className="text-green" size={20} />
              Configurar Nova Campanha
            </h3>
            <p className="modal-subtitle">Prospecção de precisão guiada por inteligência artificial</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Stepper */}
        <div className="stepper" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2xl)', padding: '0 var(--space-sm)' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < 5 ? '1' : 'none' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: step >= i ? 'var(--green-primary)' : 'var(--bg-card-secondary)',
                  border: `2px solid ${step >= i ? 'var(--green-primary)' : 'var(--border-primary)'}`,
                  color: step >= i ? 'var(--text-inverse)' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                {step > i ? <Check size={16} /> : i}
              </div>
              {i < 5 && (
                <div
                  style={{
                    flex: '1',
                    height: '2px',
                    background: step > i ? 'var(--green-primary)' : 'var(--border-primary)',
                    margin: '0 8px',
                  }}
                ></div>
              )}
            </div>
          ))}
        </div>

        <div className="modal-body" style={{ minHeight: '360px' }}>
          {/* STEP 1 */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div className="form-group">
                <label className="form-label">Nome da campanha *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Clínicas odontológicas Goiânia"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">O que você vende ou oferece? *</label>
                <textarea
                  className="form-input"
                  placeholder="Ex: Gestão de tráfego pago focado em implantes e clareamento para aumentar agendamento de consultas."
                  rows={3}
                  value={offer}
                  onChange={(e) => setOffer(e.target.value)}
                  required
                ></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <div className="form-group">
                  <label className="form-label">Quem você quer prospectar? *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Dentistas proprietários"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nicho ou segmento *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Clínica Odontológica"
                    value={segment}
                    onChange={(e) => setSegment(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <div className="form-group">
                  <label className="form-label">Cidade, estado ou região *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Goiânia, GO"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Quantidade de leads desejada</label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    max="100"
                    value={desiredCount}
                    onChange={(e) => setDesiredCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 0)))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Tom da abordagem AI</label>
                <div className="pill-group">
                  {tones.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`pill ${tone === t ? 'active' : ''}`}
                      onClick={() => setTone(t)}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div className="form-group">
                <label className="form-label">Palavra-chave de busca</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Termo para procurar no Google/Instagram"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Filtros de enriquecimento</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <label className="form-checkbox" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={hasWhatsapp} onChange={(e) => setHasWhatsapp(e.target.checked)} />
                    <span>Verificar WhatsApp válido</span>
                  </label>
                  <label className="form-checkbox" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={hasInstagram} onChange={(e) => setHasInstagram(e.target.checked)} />
                    <span>Possui perfil no Instagram</span>
                  </label>
                  <label className="form-checkbox" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={hasSite} onChange={(e) => setHasSite(e.target.checked)} />
                    <span>Possui site próprio</span>
                  </label>
                  <label className="form-checkbox" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={hasBio} onChange={(e) => setHasBio(e.target.checked)} />
                    <span>Possui biografia comercial</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <div className="form-group">
                  <label className="form-label">Score mínimo desejado (0-100)</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    max="100"
                    value={minScore}
                    onChange={(e) => setMinScore(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                  />
                  <small className="text-muted">Leads abaixo deste score serão filtrados.</small>
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '12px' }}>
                  <label className="form-checkbox" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={avoidDuplicates} onChange={(e) => setAvoidDuplicates(e.target.checked)} />
                    <span>Evitar duplicados em outras campanhas</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
              <div className="form-group">
                <label className="form-label">Canal de abordagem principal</label>
                <div className="pill-group">
                  {channels.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`pill ${channel === c ? 'active' : ''}`}
                      onClick={() => setChannel(c)}
                    >
                      {c === 'whatsapp' ? 'WhatsApp' : c === 'instagram' ? 'Instagram Direct' : 'Email'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Tamanho sugerido da mensagem</label>
                <div className="pill-group">
                  {msgSizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`pill ${msgSize === s ? 'active' : ''}`}
                      onClick={() => setMsgSize(s)}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nível de personalização AI</label>
                <div className="pill-group">
                  {customizationLevels.map((l) => (
                    <button
                      key={l}
                      type="button"
                      className={`pill ${customizationLevel === l ? 'active' : ''}`}
                      onClick={() => setCustomizationLevel(l)}
                    >
                      {l.charAt(0).toUpperCase() + l.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="card card-secondary" style={{ padding: 'var(--space-md)' }}>
                <p className="text-sm text-muted" style={{ margin: '0' }}>
                  💡 A IA lerá a biografia, publicações recentes e segmento do lead para gerar quebra-gelos hiper-personalizados.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <label className="form-label">Selecione e ajuste o modelo inicial de abordagem (Exemplo Carlos Oliveira):</label>
              
              <div className="ai-previews-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-sm)' }}>
                <button
                  type="button"
                  className={`card card-secondary ${selectedMessageText === previews.direto ? 'active-border' : ''}`}
                  style={{ textAlign: 'left', padding: 'var(--space-md)', cursor: 'pointer', border: selectedMessageText === previews.direto ? '1px solid var(--green-primary)' : '1px solid var(--border-primary)' }}
                  onClick={() => setSelectedMessageText(previews.direto)}
                >
                  <strong style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', color: 'var(--green-primary)' }}>Direto</strong>
                  <p className="text-sm text-muted" style={{ display: '-webkit-box', WebkitLineClamp: '3', WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: '4px 0 0 0' }}>{previews.direto}</p>
                </button>

                <button
                  type="button"
                  className={`card card-secondary ${selectedMessageText === previews.consultivo ? 'active-border' : ''}`}
                  style={{ textAlign: 'left', padding: 'var(--space-md)', cursor: 'pointer', border: selectedMessageText === previews.consultivo ? '1px solid var(--green-primary)' : '1px solid var(--border-primary)' }}
                  onClick={() => setSelectedMessageText(previews.consultivo)}
                >
                  <strong style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', color: 'var(--green-primary)' }}>Consultivo</strong>
                  <p className="text-sm text-muted" style={{ display: '-webkit-box', WebkitLineClamp: '3', WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: '4px 0 0 0' }}>{previews.consultivo}</p>
                </button>

                <button
                  type="button"
                  className={`card card-secondary ${selectedMessageText === previews.leve ? 'active-border' : ''}`}
                  style={{ textAlign: 'left', padding: 'var(--space-md)', cursor: 'pointer', border: selectedMessageText === previews.leve ? '1px solid var(--green-primary)' : '1px solid var(--border-primary)' }}
                  onClick={() => setSelectedMessageText(previews.leve)}
                >
                  <strong style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', color: 'var(--green-primary)' }}>Leve</strong>
                  <p className="text-sm text-muted" style={{ display: '-webkit-box', WebkitLineClamp: '3', WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: '4px 0 0 0' }}>{previews.leve}</p>
                </button>
              </div>

              <div className="form-group" style={{ marginTop: 'var(--space-md)' }}>
                <label className="form-label">Edite a mensagem selecionada:</label>
                <textarea
                  className="form-input"
                  rows={6}
                  value={selectedMessageText}
                  onChange={(e) => setSelectedMessageText(e.target.value)}
                ></textarea>
              </div>
            </div>
          )}

          {/* STEP 5 */}
          {step === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <h4 style={{ fontSize: 'var(--font-size-base)', color: 'var(--text-primary)', fontWeight: '600' }}>Resumo da Configuração</h4>
              
              <div className="card card-secondary" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                <div><strong>Campanha:</strong> {name}</div>
                <div><strong>Segmento de busca:</strong> {segment} em {location}</div>
                <div><strong>Público-alvo:</strong> {targetAudience}</div>
                <div><strong>Quantidade desejada:</strong> {desiredCount} leads de alta conversão</div>
                <div><strong>Mensagem inicial via:</strong> {channel.toUpperCase()}</div>
              </div>

              <div style={{ marginTop: 'var(--space-md)' }}>
                {isAdmin ? (
                  <div className="badge badge-green" style={{ padding: 'var(--space-sm)' }}>
                    Acesso administrador: esta campanha não consumirá créditos.
                  </div>
                ) : (
                  <div className={`card ${hasEnoughCredits ? 'card-secondary' : 'card-danger'}`} style={{ border: hasEnoughCredits ? '1px solid var(--border-primary)' : '1px solid var(--color-error)', background: hasEnoughCredits ? '' : 'var(--color-error-bg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <AlertCircle className={hasEnoughCredits ? 'text-green' : 'text-danger'} />
                      <div>
                        <strong>Consumo de créditos:</strong>
                        <div>Esta campanha consumirá {desiredCount} créditos. Seu saldo atual é: {totalCredits} créditos.</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {!hasEnoughCredits && !isAdmin && (
                <div style={{ textAlign: 'center', marginTop: 'var(--space-sm)' }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ color: 'var(--green-primary)' }}
                    onClick={() => {
                      onClose();
                      navigate('/configuracoes');
                    }}
                  >
                    Fazer Upgrade ou Comprar Créditos no Clube LODZ
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-md)', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            {step > 1 && (
              <button className="btn btn-secondary" onClick={handlePrev}>
                <ChevronLeft size={16} style={{ marginRight: '4px' }} />
                Voltar
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            {step < 5 ? (
              <button className="btn btn-primary" onClick={handleNext}>
                Avançar
                <ChevronRight size={16} style={{ marginLeft: '4px' }} />
              </button>
            ) : (
              <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={!hasEnoughCredits && !isAdmin}>
                Começar prospecção
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
