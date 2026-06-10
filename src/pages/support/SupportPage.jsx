import { useState } from 'react';
import { MessageCircle, Mail, ChevronDown } from 'lucide-react';

export default function SupportPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const toggleFaq = (idx) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  const faqItems = [
    {
      q: 'Como criar uma campanha?',
      a: 'Acesse o menu "Campanhas" e clique no botão "+ Nova campanha". O assistente irá guiar você em 5 passos rápidos: definição da oferta, critérios de busca do lead, formato da personalização, validação da abordagem modelo da inteligência artificial e confirmação.',
    },
    {
      q: 'Como os créditos funcionam?',
      a: 'Cada lead gerado na sua campanha consome 1 crédito. Os planos mensais renovam e recarregam o seu saldo base mensalmente. Seus créditos base expiram no fim do ciclo de cobrança mensal, mas os créditos avulsos comprados no Clube LODZ não expiram nunca.',
    },
    {
      q: 'Como comprar leads extras?',
      a: 'Se você atingir seu limite de leads mensais, acesse a aba "Configurações" e clique em "Comprar leads extras" no painel do Clube LODZ. Lá você encontrará pacotes de crédito com descontos progressivos dependendo do nível da sua assinatura ativa.',
    },
    {
      q: 'Como o Sócio gera respostas?',
      a: 'Quando um lead responder a uma prospecção sua no WhatsApp, copie a resposta dele e cole no assistente na página "Conversas". O Sócio lê o histórico e gera 3 alternativas: Direta (para agendar reuniões rapidamente), Firme (para frisar diferenciais) e Leve (para manter diálogo amigável).',
    },
    {
      q: 'Como fazer upgrade de plano?',
      a: 'Para mudar de assinatura, acesse "Configurações", role até a tabela de preços e clique em "Fazer Upgrade" no plano desejado. O sistema recalcula os créditos proporcionais e atualiza sua cobrança de forma automatizada.',
    },
    {
      q: 'Como ativar lembretes no WhatsApp?',
      a: 'Vá na tela "Configurações" e insira seu telefone no formato DDI + DDD + Número (ex: 5562999990000) no painel "Lembretes no WhatsApp", selecione a caixa de ativação diária e salve as mudanças.',
    },
  ];

  return (
    <div className="page-container" style={{ padding: 'var(--space-2xl)' }}>
      {/* Top Header */}
      <div className="page-header" style={{ marginBottom: 'var(--space-2xl)' }}>
        <h1 className="page-title" style={{ fontSize: 'var(--font-size-3xl)', fontWeight: '800', color: 'var(--text-primary)' }}>Suporte</h1>
        <p className="page-subtitle" style={{ color: 'var(--text-muted)' }}>Precisa de ajuda com a plataforma LODZ?</p>
      </div>

      {/* Contact Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)', marginBottom: 'var(--space-2xl)' }}>
        <div className="card" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ background: 'var(--green-glow)', color: 'var(--green-primary)', padding: '12px', borderRadius: '12px' }}>
            <MessageCircle size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: '700', color: 'var(--text-primary)' }}>Fale no WhatsApp</h3>
            <p className="text-sm text-muted" style={{ margin: '4px 0 12px 0' }}>Fale direto com a nossa equipe de suporte comercial em tempo real.</p>
            <button className="btn btn-primary btn-sm" onClick={() => window.open('https://wa.me/5562999990000', '_blank')}>
              Abrir WhatsApp
            </button>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ background: 'var(--color-info-bg)', color: 'var(--color-info)', padding: '12px', borderRadius: '12px' }}>
            <Mail size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: '700', color: 'var(--text-primary)' }}>Suporte por Email</h3>
            <p className="text-sm text-muted" style={{ margin: '4px 0 12px 0' }}>Mande suas dúvidas para suporte@lodz.com. Respondemos em até 24 horas úteis.</p>
            <button className="btn btn-secondary btn-sm" onClick={() => window.open('mailto:suporte@lodz.com')}>
              Enviar email
            </button>
          </div>
        </div>
      </div>

      {/* FAQ section */}
      <div>
        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '800', color: 'var(--text-primary)', marginBottom: 'var(--space-lg)' }}>
          Perguntas Frequentes
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {faqItems.map((item, idx) => {
            const isOpen = openFaqIndex === idx;

            return (
              <div
                key={idx}
                className="faq-item card"
                style={{ padding: 'var(--space-md) var(--space-lg)', cursor: 'pointer', background: 'var(--bg-card)' }}
                onClick={() => toggleFaq(idx)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: '600', color: 'var(--text-primary)', margin: '0' }}>
                    {item.q}
                  </h4>
                  <ChevronDown
                    size={18}
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s',
                      color: 'var(--text-muted)',
                    }}
                  />
                </div>
                {isOpen && (
                  <p className="text-sm text-muted" style={{ marginTop: 'var(--space-md)', lineHeight: '1.6', margin: 'var(--space-md) 0 0 0' }}>
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
