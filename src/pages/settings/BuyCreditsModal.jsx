import { X, Sparkles, Star, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useApp } from '../../contexts/AppContext.jsx';
import { EXTRA_PACKS, canAccessPack, getPlanById } from '../../data/plans.js';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function BuyCreditsModal({ isOpen, onClose }) {
  const { user, updateUser } = useAuth();
  const { purchaseCredits } = useApp();
  const toast = useToast();

  if (!isOpen) return null;

  const handleBuyPack = async (pack) => {
    try {
      await purchaseCredits(pack.leads, pack.price);
      toast.success(
        'Compra concluída!',
        `Você adquiriu o pacote ${pack.name} com ${pack.leads} créditos extras.`
      );
      onClose();
    } catch (err) {
      toast.error('Erro na transação', err.message || 'Não foi possível completar a transação.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px' }}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Star className="text-green" size={20} />
              Clube LODZ
            </h3>
            <p className="modal-subtitle">Acesso exclusivo para comprar pacotes de leads pelo menor custo do mercado</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="packs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-md)', margin: 'var(--space-md) 0' }}>
            {EXTRA_PACKS.map((pack) => {
              // User plan must be equal or higher to requiredPlan
              const hasAccess = canAccessPack(user?.planId || 'starter', pack.requiredPlan);
              const requiredPlanName = getPlanById(pack.requiredPlan)?.name || pack.requiredPlan;

              return (
                <div
                  key={pack.id}
                  className={`card ${pack.popular ? 'popular' : ''}`}
                  style={{
                    position: 'relative',
                    background: 'var(--bg-card-secondary)',
                    border: pack.popular ? '2px solid var(--green-primary)' : '1px solid var(--border-primary)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: 'var(--space-lg)',
                  }}
                >
                  {pack.popular && (
                    <span className="badge badge-green" style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)' }}>
                      MAIS POPULAR
                    </span>
                  )}
                  <div>
                    <h4 style={{ fontSize: 'var(--font-size-md)', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {pack.name}
                    </h4>
                    <p className="text-xs text-muted" style={{ margin: '4px 0 var(--space-md) 0' }}>
                      {pack.description}
                    </p>

                    <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      R$ {pack.price}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: '600', color: 'var(--green-primary)', marginBottom: 'var(--space-md)' }}>
                      {pack.leads} leads <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>({(pack.pricePerLead).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/lead)</span>
                    </div>
                  </div>

                  <button
                    className={`btn btn-block ${hasAccess ? 'btn-primary' : 'btn-secondary'}`}
                    disabled={!hasAccess}
                    onClick={() => handleBuyPack(pack)}
                    style={{ fontSize: 'var(--font-size-xs)', padding: '10px' }}
                  >
                    {hasAccess ? 'Comprar agora' : `Exige plano ${requiredPlanName}`}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="card-secondary" style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: 'var(--space-lg)' }}>
            <AlertCircle size={16} className="text-green" style={{ flexShrink: 0 }} />
            <p className="text-xs text-muted" style={{ margin: '0' }}>
              Os pacotes extras exigem planos mínimos para evitar abusos na infraestrutura. Seus créditos comprados acumulam e não possuem prazo de validade.
            </p>
          </div>
        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-sm)', display: 'flex', justifyContent: 'center', gap: 'var(--space-md)', fontSize: '11px', color: 'var(--text-muted)' }}>
          <a href="#termos" style={{ color: 'inherit', textDecoration: 'underline' }}>Termos de Uso</a>
          <span>·</span>
          <a href="#privacidade" style={{ color: 'inherit', textDecoration: 'underline' }}>Políticas de Privacidade</a>
          <span>·</span>
          <a href="#suporte" style={{ color: 'inherit', textDecoration: 'underline' }}>Contato e Suporte</a>
        </div>
      </div>
    </div>
  );
}
