import { useState } from 'react';
import { Zap, CreditCard, Shield, Settings, Bell, Star } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useApp } from '../../contexts/AppContext.jsx';
import { getTotalCredits } from '../../utils/creditEngine.js';
import { getPlanById } from '../../data/plans.js';
import BuyCreditsModal from './BuyCreditsModal.jsx';

export default function SettingsPage() {
  const { user, isAdmin, updateUser } = useAuth();
  const { plans } = useApp();
  const [buyCreditsOpen, setBuyCreditsOpen] = useState(false);

  // Reminders states
  const [whatsappPhone, setWhatsappPhone] = useState(user?.whatsappPhone || '');
  const [remindersEnabled, setRemindersEnabled] = useState(user?.whatsappRemindersEnabled || false);
  const [savingSettings, setSavingSettings] = useState(false);

  const plan = getPlanById(user?.planId);
  const totalCredits = getTotalCredits(user?.creditWallet);

  const handleSaveReminders = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 600));
    updateUser({
      whatsappPhone,
      whatsappRemindersEnabled: remindersEnabled,
    });
    setSavingSettings(false);
    alert('Preferências de notificação salvas com sucesso!');
  };

  const handleUpgradePlan = (planId) => {
    updateUser({ planId });
    alert(`Seu plano foi atualizado com sucesso para ${getPlanById(planId).name}!`);
  };

  return (
    <div className="page-container" style={{ padding: 'var(--space-2xl)' }}>
      {/* Top Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2xl)' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 'var(--font-size-3xl)', fontWeight: '800', color: 'var(--text-primary)' }}>Configurações</h1>
          <p className="page-subtitle" style={{ color: 'var(--text-muted)' }}>Gerencie sua assinatura, créditos e preferências de prospecção</p>
        </div>
        <button className="btn btn-ghost" onClick={() => alert('Tour Onboarding Reiniciado!')}>
          Ver onboarding novamente
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2xl)' }}>
        {/* Plan & Wallet Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-xl)', alignItems: 'stretch' }}>
          {/* Active Plan */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                <span className="badge badge-green">ATIVO</span>
                <Zap size={18} className="text-green" />
              </div>
              <h3 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '800', color: 'var(--text-primary)' }}>
                Plano {plan?.name || 'Starter'}
              </h3>
              <p className="text-sm text-muted" style={{ marginTop: '4px' }}>
                Cobrança ativa via Stripe. Atualize o cartão e verifique faturas no painel seguro.
              </p>
            </div>
            <button className="btn btn-secondary btn-block" style={{ marginTop: 'var(--space-lg)' }} onClick={() => alert('Redirecionando para o Stripe Billing Portal...')}>
              Gerenciar assinatura
            </button>
          </div>

          {/* Credits Display */}
          <div className="card">
            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '700', color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>
              Seus Créditos de Leads
            </h3>
            {isAdmin ? (
              <div style={{ padding: 'var(--space-lg)', background: 'var(--green-active)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--green-primary)' }}>
                <strong style={{ display: 'block', fontSize: 'var(--font-size-lg)', color: 'var(--green-primary)' }}>Acesso Administrador Ilimitado</strong>
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>Você não consome créditos durante a criação de campanhas de teste.</span>
              </div>
            ) : (
              <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-md)' }}>
                <div style={{ background: 'var(--bg-card-secondary)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '800', color: 'var(--text-primary)' }}>{user?.creditWallet?.baseCredits || 0}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Mensais Inclusos</div>
                </div>
                <div style={{ background: 'var(--bg-card-secondary)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '800', color: 'var(--text-primary)' }}>{user?.creditWallet?.purchasedCredits || 0}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Avulsos Adquiridos</div>
                </div>
                <div style={{ background: 'var(--green-active)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid var(--green-primary)' }}>
                  <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '800', color: 'var(--green-primary)' }}>{totalCredits}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>Disponíveis</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* WhatsApp Notification Reminders */}
        <div className="card">
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '700', color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>
            Lembretes diários no WhatsApp
          </h3>
          <p className="text-sm text-muted" style={{ marginBottom: 'var(--space-lg)' }}>
            Receba a fila de leads do dia e resumos de follow-up diretamente no seu número comercial de manhã.
          </p>
          <form onSubmit={handleSaveReminders} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', maxWidth: '400px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="whatsapp-input">Número do WhatsApp</label>
              <input
                id="whatsapp-input"
                type="text"
                className="form-input"
                placeholder="Ex: 5562999990000"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
              />
            </div>
            <label className="form-checkbox" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={remindersEnabled}
                onChange={(e) => setRemindersEnabled(e.target.checked)}
              />
              <span>Ativar alertas diários automático</span>
            </label>
            <button type="submit" className="btn btn-primary" style={{ width: 'fit-content' }} disabled={savingSettings}>
              {savingSettings ? 'Salvando...' : 'Salvar configurações'}
            </button>
          </form>
        </div>

        {/* Upgrade Plan Grid */}
        <div>
          <h3 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '800', color: 'var(--text-primary)', marginBottom: 'var(--space-xs)' }}>Upgrade de Plano</h3>
          <p className="text-sm text-muted" style={{ marginBottom: 'var(--space-lg)' }}>Escolha um plano ideal para o tamanho da sua operação e equipe comercial.</p>
          
          <div className="pricing-grid">
            {plans.map((p) => {
              const isCurrent = user?.planId === p.id;
              return (
                <div key={p.id} className={`pricing-card ${isCurrent ? 'current' : ''}`}>
                  {p.popular && <span className="badge badge-green pricing-card-badge">MAIS VENDIDO</span>}
                  <div className="pricing-card-name">{p.name}</div>
                  <div className="pricing-card-price">
                    R$ {p.monthlyPrice}<span>/mês</span>
                  </div>
                  <div className="text-xs text-muted" style={{ margin: 'var(--space-sm) 0' }}>
                    Inclui {p.includedCredits} leads. Excedente R$ {p.extraLeadPrice.toFixed(2)}/lead
                  </div>
                  <ul style={{ listStyle: 'none', padding: '0', margin: 'var(--space-md) 0', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                    {p.features.map((f, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: 'var(--green-primary)' }}>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    className={`btn btn-block ${isCurrent ? 'btn-secondary' : 'btn-primary'}`}
                    disabled={isCurrent}
                    onClick={() => handleUpgradePlan(p.id)}
                  >
                    {isCurrent ? 'Plano atual' : 'Fazer Upgrade'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Clube LODZ Section */}
        <div className="card" style={{ border: '1px solid var(--green-primary)', background: 'var(--bg-card-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-lg)' }}>
          <div>
            <span className="badge badge-green" style={{ marginBottom: 'var(--space-sm)' }}>CLUBE LODZ</span>
            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '800', color: 'var(--text-primary)' }}>
              Créditos Extras com Preço de Atacado
            </h3>
            <p className="text-sm text-muted" style={{ marginTop: '4px', maxWidth: '600px' }}>
              Seus créditos do plano mensal acabaram? Compre pacotes avulsos de leads baseados na hierarquia da sua assinatura comercial. 
              <strong> Os créditos comprados não expiram.</strong>
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setBuyCreditsOpen(true)}>
            <Star size={16} style={{ marginRight: '8px' }} />
            Comprar leads extras
          </button>
        </div>
      </div>

      {/* Buy Credits Modal */}
      <BuyCreditsModal isOpen={buyCreditsOpen} onClose={() => setBuyCreditsOpen(false)} />
    </div>
  );
}
