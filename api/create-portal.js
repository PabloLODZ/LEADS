import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

function createSupabaseAdmin() {
  return createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Parâmetro userId é obrigatório.' });
    }

    const supabase = createSupabaseAdmin();

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (!profile || !profile.stripe_customer_id) {
      return res.status(400).json({ error: 'Cliente Stripe não encontrado para este usuário.' });
    }

    const appUrl = process.env.APP_URL || process.env.VITE_APP_URL || req.headers.origin || 'http://localhost:5173';
    const returnUrl = `${appUrl}/configuracoes`;

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: returnUrl,
    });

    return res.status(200).json({ portalUrl: session.url });
  } catch (err) {
    console.error('Erro ao gerar Portal do Cliente Stripe:', err);
    return res.status(500).json({ error: 'Erro interno do servidor ao gerar portal.' });
  }
}
