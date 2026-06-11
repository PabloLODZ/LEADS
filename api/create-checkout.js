import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

function createSupabaseAdmin() {
  return createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const PLAN_PRICES = {
  starter: process.env.STRIPE_PRICE_STARTER || 'price_starter',
  growth: process.env.STRIPE_PRICE_GROWTH || 'price_growth',
  pro: process.env.STRIPE_PRICE_PRO || 'price_pro',
  agency: process.env.STRIPE_PRICE_AGENCY || 'price_agency',
};

const PACKS = {
  booster: { price: 3700, credits: 35, name: 'Booster' },
  'sdr-junior': { price: 6700, credits: 80, name: 'SDR Júnior' },
  'maquina-vendas': { price: 9700, credits: 150, name: 'Máquina de Vendas' },
  'escala-total': { price: 19700, credits: 400, name: 'Escala Total' },
};

async function getOrCreateStripeCustomer(stripe, supabase, userId, userEmail) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id;
  }

  const customer = await stripe.customers.create({
    email: userEmail,
    metadata: { userId },
  });

  await supabase
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId);

  return customer.id;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const { type, planId, packId, userId, userEmail } = req.body;

    if (!type || !userId || !userEmail) {
      return res.status(400).json({
        error: 'Parâmetros obrigatórios ausentes. Envie type, userId e userEmail.',
      });
    }

    const supabase = createSupabaseAdmin();
    const appUrl = process.env.VITE_APP_URL || req.headers.origin;
    const successUrl = `${appUrl}/configuracoes?payment=success`;
    const cancelUrl = `${appUrl}/configuracoes?payment=cancelled`;

    // ========== ASSINATURA ==========
    if (type === 'subscription') {
      if (!planId) {
        return res.status(400).json({ error: 'O parâmetro planId é obrigatório para assinaturas.' });
      }

      const priceId = PLAN_PRICES[planId];
      if (!priceId) {
        return res.status(400).json({
          error: `Plano inválido: "${planId}". Planos disponíveis: ${Object.keys(PLAN_PRICES).join(', ')}.`,
        });
      }

      const customerId = await getOrCreateStripeCustomer(stripe, supabase, userId, userEmail);

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        metadata: {
          userId,
          planId,
          type: 'subscription',
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      return res.status(200).json({ checkoutUrl: session.url });
    }

    // ========== CRÉDITOS AVULSOS ==========
    if (type === 'credits') {
      if (!packId) {
        return res.status(400).json({ error: 'O parâmetro packId é obrigatório para compra de créditos.' });
      }

      const pack = PACKS[packId];
      if (!pack) {
        return res.status(400).json({
          error: `Pacote inválido: "${packId}". Pacotes disponíveis: ${Object.keys(PACKS).join(', ')}.`,
        });
      }

      const customerId = await getOrCreateStripeCustomer(stripe, supabase, userId, userEmail);

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'brl',
              product_data: {
                name: `Pacote ${pack.name} — ${pack.credits} créditos`,
                description: `${pack.credits} créditos para geração de leads na plataforma LODZ.`,
              },
              unit_amount: pack.price,
            },
            quantity: 1,
          },
        ],
        metadata: {
          userId,
          packId,
          credits: String(pack.credits),
          type: 'credits',
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      return res.status(200).json({ checkoutUrl: session.url });
    }

    return res.status(400).json({
      error: `Tipo inválido: "${type}". Use "subscription" ou "credits".`,
    });
  } catch (err) {
    console.error('Erro inesperado em create-checkout:', err);
    return res.status(500).json({ error: 'Erro interno do servidor. Tente novamente mais tarde.' });
  }
}
