import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

function createSupabaseAdmin() {
  return createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const PLAN_CREDITS = {
  starter: 50,
  growth: 120,
  pro: 300,
  agency: 750,
};

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function getPlanIdFromPriceId(priceId) {
  const priceMap = {
    [process.env.STRIPE_PRICE_STARTER || 'price_starter']: 'starter',
    [process.env.STRIPE_PRICE_GROWTH || 'price_growth']: 'growth',
    [process.env.STRIPE_PRICE_PRO || 'price_pro']: 'pro',
    [process.env.STRIPE_PRICE_AGENCY || 'price_agency']: 'agency',
  };
  return priceMap[priceId] || null;
}

async function handleCheckoutCompleted(session, supabase) {
  const metadata = session.metadata || {};
  const userId = metadata.userId;

  if (!userId) {
    console.error('checkout.session.completed: userId ausente nos metadados.');
    return;
  }

  // ========== COMPRA DE CRÉDITOS ==========
  if (metadata.type === 'credits') {
    const credits = parseInt(metadata.credits, 10);
    if (!credits || credits <= 0) {
      console.error('checkout.session.completed (credits): quantidade de créditos inválida:', metadata.credits);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('purchased_credits')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Erro ao buscar perfil para créditos:', profileError);
      return;
    }

    const newPurchasedCredits = (profile.purchased_credits || 0) + credits;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ purchased_credits: newPurchasedCredits })
      .eq('id', userId);

    if (updateError) {
      console.error('Erro ao atualizar créditos comprados:', updateError);
      return;
    }

    await supabase.from('credit_transactions').insert({
      user_id: userId,
      type: 'purchase',
      amount: credits,
      reason: `Compra de pacote ${metadata.packId || 'avulso'} — ${credits} créditos`,
    });

    await supabase.from('payments').insert({
      user_id: userId,
      stripe_session_id: session.id,
      stripe_payment_id: session.payment_intent,
      amount: session.amount_total,
      status: 'aprovado',
      product_type: 'creditos_avulsos',
      credits_purchased: credits,
    });

    console.log(`Créditos adicionados: ${credits} para o usuário ${userId}`);
    return;
  }

  // ========== ASSINATURA ==========
  if (session.mode === 'subscription') {
    const subscriptionId = session.subscription;
    const planId = metadata.planId;

    if (!planId) {
      console.error('checkout.session.completed (subscription): planId ausente nos metadados.');
      return;
    }

    const planCredits = PLAN_CREDITS[planId] || 0;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        plan_id: planId,
        subscription_status: 'active',
        stripe_customer_id: session.customer,
        base_credits: planCredits,
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Erro ao atualizar assinatura no perfil:', updateError);
      return;
    }

    await supabase.from('payments').insert({
      user_id: userId,
      plan_id: planId,
      stripe_session_id: session.id,
      amount: session.amount_total,
      status: 'aprovado',
      product_type: 'plano',
    });

    console.log(`Assinatura ativada: plano ${planId} para o usuário ${userId}`);
    return;
  }
}

async function handleSubscriptionUpdated(subscription, supabase) {
  const customerId = subscription.customer;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (profileError || !profile) {
    console.error('Erro ao buscar perfil por stripe_customer_id:', customerId, profileError);
    return;
  }

  const priceId = subscription.items?.data?.[0]?.price?.id;
  const planId = getPlanIdFromPriceId(priceId);

  const statusMap = {
    active: 'active',
    past_due: 'past_due',
    canceled: 'cancelled',
    unpaid: 'past_due',
    trialing: 'trial',
    incomplete: 'trial',
    incomplete_expired: 'cancelled',
    paused: 'cancelled',
  };

  const subscriptionStatus = statusMap[subscription.status] || subscription.status;

  const updateData = {
    subscription_status: subscriptionStatus,
  };

  if (planId) {
    updateData.plan_id = planId;
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', profile.id);

  if (updateError) {
    console.error('Erro ao atualizar status da assinatura:', updateError);
    return;
  }

  console.log(`Assinatura atualizada: status ${subscriptionStatus} para o usuário ${profile.id}`);
}

async function handleSubscriptionDeleted(subscription, supabase) {
  const customerId = subscription.customer;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (profileError || !profile) {
    console.error('Erro ao buscar perfil para cancelamento:', customerId, profileError);
    return;
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'cancelled',
      plan_id: 'starter',
      base_credits: 0,
    })
    .eq('id', profile.id);

  if (updateError) {
    console.error('Erro ao cancelar assinatura no perfil:', updateError);
    return;
  }

  console.log(`Assinatura cancelada para o usuário ${profile.id}`);
}

async function handleInvoicePaymentSucceeded(invoice, supabase) {
  if (invoice.billing_reason !== 'subscription_cycle') {
    return;
  }

  const customerId = invoice.customer;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, plan_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (profileError || !profile) {
    console.error('Erro ao buscar perfil para renovação:', customerId, profileError);
    return;
  }

  const planCredits = PLAN_CREDITS[profile.plan_id] || 0;

  if (planCredits > 0) {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ base_credits: planCredits })
      .eq('id', profile.id);

    if (updateError) {
      console.error('Erro ao renovar créditos do plano:', updateError);
      return;
    }

    await supabase.from('credit_transactions').insert({
      user_id: profile.id,
      type: 'plan_renewal',
      amount: planCredits,
      reason: `Renovação mensal do plano ${profile.plan_id} — ${planCredits} créditos`,
    });

    console.log(`Créditos renovados: ${planCredits} para o usuário ${profile.id} (plano ${profile.plan_id})`);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  let event;

  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return res.status(400).json({ error: 'Assinatura do webhook ausente.' });
    }

    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Erro ao verificar assinatura do webhook:', err.message);
    return res.status(400).json({ error: `Falha na verificação do webhook: ${err.message}` });
  }

  const supabase = createSupabaseAdmin();

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object, supabase);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object, supabase);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object, supabase);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object, supabase);
        break;

      default:
        console.log(`Evento não tratado: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error(`Erro ao processar evento ${event.type}:`, err);
    return res.status(500).json({ error: 'Erro ao processar o evento do webhook.' });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
