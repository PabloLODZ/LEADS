import { useState } from 'react';
import { Zap, CreditCard, Shield, Settings, Bell, Star, TrendingDown, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useApp } from '../../contexts/AppContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { getTotalCredits } from '../../utils/creditEngine.js';
import { getPlanById } from '../../data/plans.js';
import { formatDate, formatDateTime } from '../../utils/formatters.js';
import BuyCreditsModal from './BuyCreditsModal.jsx';

export default function SettingsPage() {
  const { user, isAdmin, updateUser } = useAuth();
  const { plans, creditTransactions, upgradePlan } = useApp();
  const toast = useToast();
  const [buyCreditsOpen, setBuyCreditsOpen] = useState(false);
  const [upgradingPlan, setUpgradingPlan] = useState(null);

  // Reminders states
  const [whatsappPhone, setWhatsappPhone] = useState(user?.whatsappPhone || '');
  const [remindersEnabled, setRemindersEnabled] = useState(user?.whatsappRemindersEnabled || false);
  const [savingSettings, setSavingSettings] = useState(false);

  const plan = getPlanById(user?.planId);
  const totalCredits = getTotalCredits(user?.creditWallet);

  const handleSaveReminders = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await updateUser({
        whatsappPhone,
        whatsappRemindersEnabled: remindersEnabled,
      });
      toast.success('Preferências de notificação salvas com sucesso!');
    } catch (err) {
      toast.error('Erro ao salvar configurações.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleUpgradePlan = async (planId) => {
    setUpgradingPlan(planId);
    try {
      await upgradePlan(planId);
      // User will be redirected to Stripe Checkout
    } catch (err) {
      toast.error('Erro ao iniciar upgrade. Tente novamente.');
      setUpgradingPlan(null);
    }
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
            <button className="btn btn-secondary btn-block" style={{ marginTop: 'var(--space-lg)' }} onClick={() => window.open('https://billing.stripe.com', '_blank')}>
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
                    disabled={isCurrent || upgradingPlan === p.id}
                    onClick={() => handleUpgradePlan(p.id)}
                  >
                    {isCurrent ? 'Plano atual' : upgradingPlan === p.id ? 'Redirecionando...' : 'Fazer Upgrade'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Credit Statement */}
        {!isAdmin && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '700', color: 'var(--text-primary)' }}>Extrato de Créditos</h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Saldo atual: <strong style={{ color: 'var(--text-primary)' }}>{totalCredits} créditos</strong></span>
            </div>

            {totalCredits < 10 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'var(--color-error-bg)', border: '1px solid var(--color-error)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)' }}>
                <AlertCircle size={15} color="var(--color-error)" />
                <span style={{ fontSize: '13px', color: 'var(--color-error)', fontWeight: '600' }}>
                  Seu saldo está baixo! Você tem apenas {totalCredits} crédito{totalCredits !== 1 ? 's' : ''} restante{totalCredits !== 1 ? 's' : ''}.
                </span>
                <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setBuyCreditsOpen(true)}>
                  Comprar agora
                </button>
              </div>
            )}

            {creditTransactions.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Nenhuma movimentação de créditos ainda.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                      <th style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Data</th>
                      <th style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Descrição</th>
                      <th style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Ajuste</th>
                      <th style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {creditTransactions.slice(0, 20).map(t => (
                      <tr key={t.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--text-muted)' }}>{formatDate(t.createdAt)}</td>
                        <td style={{ padding: '8px 12px', fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.reason || t.description || t.type}
                        </td>
                        <td style={{ padding: '8px 12px', fontWeight: '700', color: t.amount > 0 ? 'var(--color-success)' : t.amount < 0 ? 'var(--color-error)' : 'var(--text-muted)' }}>
                          {t.amount > 0 ? `+${t.amount}` : t.amount === 0 ? '—' : t.amount}
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: '13px', color: 'var(--text-primary)', fontWeight: '600' }}>
                          {t.balanceAfter}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {creditTransactions.length > 20 && (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '12px' }}>
                    Mostrando as 20 movimentações mais recentes.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Buy Credits Modal */}
      <BuyCreditsModal isOpen={buyCreditsOpen} onClose={() => setBuyCreditsOpen(false)} />
    </div>
  );
}
