import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useApp } from '../../contexts/AppContext.jsx';
import { Navigate, useLocation } from 'react-router-dom';
import { Radar, Zap, Shield, Star, LogOut, Loader2 } from 'lucide-react';
import { getPlanById } from '../../data/plans.js';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function SubscriptionGuard({ children }) {
  const { user, isAdmin, isLoading, logout } = useAuth();
  const { plans, upgradePlan } = useApp();
  const location = useLocation();
  const toast = useToast();
  const [upgradingPlan, setUpgradingPlan] = useState(null);

  if (isLoading) return null; // Let the layout/auth handle the initial loading state

  // Admins always have access
  if (isAdmin) return children;

  // If user hasn't finished onboarding or doesn't have an active subscription, block them.
  // Note: we consider 'trial' and 'active' as valid statuses.
  const isValidSubscription = user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'trial';
  
  if (user && !isValidSubscription) {
    // Show Paywall UI
    
    const handleUpgradePlan = async (planId) => {
      setUpgradingPlan(planId);
      try {
        await upgradePlan(planId);
        // Will redirect to Stripe Checkout
      } catch (err) {
        toast.error('Erro ao processar assinatura. Tente novamente.');
        setUpgradingPlan(null);
      }
    };

    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-app)', display: 'flex', flexDirection: 'column' }}>
        {/* Simple Header */}
        <header style={{ padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-primary)', background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="logo-icon" style={{ width: 32, height: 32 }}><Radar size={18} /></div>
            <span className="logo-text" style={{ fontSize: '18px' }}>LODZ</span>
          </div>
          <button className="btn btn-ghost" onClick={logout}><LogOut size={16} style={{ marginRight: '6px' }} /> Sair da conta</button>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ textAlign: 'center', maxWidth: '600px', marginBottom: '40px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '16px' }}>
              {user.subscriptionStatus === 'cancelled' ? 'Sua assinatura está inativa' : 'Escolha seu plano para começar'}
            </h1>
            <p style={{ fontSize: '16px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Para acessar o CRM, gerar leads qualificados e usar o nosso Sócio IA, você precisa ter uma assinatura ativa. Escolha o plano que melhor se adapta à sua operação.
            </p>
          </div>

          <div className="pricing-grid" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            {plans.filter(p => p.isActive).map((p) => (
              <div key={p.id} className="pricing-card" style={{ background: 'var(--bg-card)' }}>
                {p.popular && <span className="badge badge-green pricing-card-badge">MAIS VENDIDO</span>}
                <div className="pricing-card-name">{p.name}</div>
                <div className="pricing-card-price">
                  R$ {p.monthlyPrice}<span>/mês</span>
                </div>
                <div className="text-xs text-muted" style={{ margin: 'var(--space-sm) 0' }}>
                  Inclui {p.includedCredits} leads. Excedente R$ {p.extraLeadPrice.toFixed(2)}/lead
                </div>
                <ul style={{ listStyle: 'none', padding: '0', margin: 'var(--space-md) 0', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {p.features.map((f, i) => {
                    const isLocked = f.toLowerCase().includes('bloqueado');
                    const isPartial = f.toLowerCase().includes('parcial');
                    const isFeatured = f.toLowerCase().includes('ilimitadas') || f.toLowerCase().includes('vip') || f.toLowerCase().includes('tudo liberado') || f.toLowerCase().includes('completos');
                    
                    return (
                      <li key={i} style={{ 
                        display: 'flex', alignItems: 'center', gap: '8px', 
                        opacity: isLocked ? 0.5 : 1,
                        color: isFeatured ? 'var(--text-primary)' : 'inherit',
                        fontWeight: isFeatured ? '600' : 'normal',
                      }}>
                        {isLocked ? (
                          <span style={{ color: 'var(--text-muted)' }}>✕</span>
                        ) : isPartial ? (
                          <span style={{ color: 'var(--color-warning)' }}>~</span>
                        ) : (
                          <span style={{ color: 'var(--green-primary)' }}>✓</span>
                        )}
                        {f}
                      </li>
                    );
                  })}
                </ul>
                <button
                  className={`btn btn-block ${p.popular ? 'btn-primary' : 'btn-secondary'}`}
                  disabled={upgradingPlan !== null}
                  onClick={() => handleUpgradePlan(p.id)}
                >
                  {upgradingPlan === p.id ? <Loader2 className="spinner" size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Assinar agora'}
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '40px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px' }}>
            <Shield size={16} /> Pagamento seguro e processado via Stripe
          </div>
        </main>
      </div>
    );
  }

  // Active subscription or Trial, allow access
  return children;
}
