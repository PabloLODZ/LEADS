// api/setup-stripe.js
// ⚠️ ENDPOINT DE CONFIGURAÇÃO - Use apenas UMA vez após o primeiro deploy!
// Acesse: https://SEU-SITE.vercel.app/api/setup-stripe?token=lodz-setup-2024
// Copie os price IDs retornados e coloque nas variáveis de ambiente do Vercel.
// DEPOIS DISSO, delete este arquivo por segurança.

import Stripe from 'stripe';

export default async function handler(req, res) {
  // Segurança básica: só aceita GET com um token secreto
  const { token } = req.query;
  if (token !== 'lodz-setup-2024') {
    return res.status(401).json({ error: 'Não autorizado. Use ?token=lodz-setup-2024' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const results = {};

    // =============================================
    // PLANOS DE ASSINATURA (mensais)
    // =============================================

    // Starter - R$ 67/mês (50 créditos)
    const starterProduct = await stripe.products.create({
      name: 'Plano Starter',
      description: '50 créditos por mês. Ideal para quem está começando.',
      metadata: { credits: '50', plan_id: 'starter' },
    });
    const starterPrice = await stripe.prices.create({
      product: starterProduct.id,
      unit_amount: 6700,
      currency: 'brl',
      recurring: { interval: 'month' },
      metadata: { plan_id: 'starter', credits: '50' },
    });
    results.STRIPE_PRICE_STARTER = starterPrice.id;

    // Growth - R$ 147/mês (120 créditos)
    const growthProduct = await stripe.products.create({
      name: 'Plano Growth',
      description: '120 créditos por mês. Para crescer com consistência.',
      metadata: { credits: '120', plan_id: 'growth' },
    });
    const growthPrice = await stripe.prices.create({
      product: growthProduct.id,
      unit_amount: 14700,
      currency: 'brl',
      recurring: { interval: 'month' },
      metadata: { plan_id: 'growth', credits: '120' },
    });
    results.STRIPE_PRICE_GROWTH = growthPrice.id;

    // Pro - R$ 297/mês (300 créditos)
    const proProduct = await stripe.products.create({
      name: 'Plano Pro',
      description: '300 créditos por mês. Para times de vendas.',
      metadata: { credits: '300', plan_id: 'pro' },
    });
    const proPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 29700,
      currency: 'brl',
      recurring: { interval: 'month' },
      metadata: { plan_id: 'pro', credits: '300' },
    });
    results.STRIPE_PRICE_PRO = proPrice.id;

    // Agency - R$ 597/mês (750 créditos)
    const agencyProduct = await stripe.products.create({
      name: 'Plano Agency',
      description: '750 créditos por mês. Para agências e grandes equipes.',
      metadata: { credits: '750', plan_id: 'agency' },
    });
    const agencyPrice = await stripe.prices.create({
      product: agencyProduct.id,
      unit_amount: 59700,
      currency: 'brl',
      recurring: { interval: 'month' },
      metadata: { plan_id: 'agency', credits: '750' },
    });
    results.STRIPE_PRICE_AGENCY = agencyPrice.id;

    // =============================================
    // PACOTES DE CRÉDITOS (pagamento único)
    // =============================================

    // Booster - R$ 37 (35 créditos)
    const boosterProduct = await stripe.products.create({
      name: 'Pacote Booster',
      description: '35 créditos extras.',
      metadata: { credits: '35', pack_id: 'booster' },
    });
    const boosterPrice = await stripe.prices.create({
      product: boosterProduct.id,
      unit_amount: 3700,
      currency: 'brl',
      metadata: { pack_id: 'booster', credits: '35' },
    });
    results.STRIPE_PRICE_BOOSTER = boosterPrice.id;

    // SDR Júnior - R$ 67 (80 créditos)
    const sdrProduct = await stripe.products.create({
      name: 'Pacote SDR Júnior',
      description: '80 créditos extras.',
      metadata: { credits: '80', pack_id: 'sdr' },
    });
    const sdrPrice = await stripe.prices.create({
      product: sdrProduct.id,
      unit_amount: 6700,
      currency: 'brl',
      metadata: { pack_id: 'sdr', credits: '80' },
    });
    results.STRIPE_PRICE_SDR = sdrPrice.id;

    // Máquina de Vendas - R$ 97 (150 créditos)
    const maquinaProduct = await stripe.products.create({
      name: 'Pacote Máquina de Vendas',
      description: '150 créditos extras.',
      metadata: { credits: '150', pack_id: 'maquina' },
    });
    const maquinaPrice = await stripe.prices.create({
      product: maquinaProduct.id,
      unit_amount: 9700,
      currency: 'brl',
      metadata: { pack_id: 'maquina', credits: '150' },
    });
    results.STRIPE_PRICE_MAQUINA = maquinaPrice.id;

    // Escala Total - R$ 197 (400 créditos)
    const escalaProduct = await stripe.products.create({
      name: 'Pacote Escala Total',
      description: '400 créditos extras.',
      metadata: { credits: '400', pack_id: 'escala' },
    });
    const escalaPrice = await stripe.prices.create({
      product: escalaProduct.id,
      unit_amount: 19700,
      currency: 'brl',
      metadata: { pack_id: 'escala', credits: '400' },
    });
    results.STRIPE_PRICE_ESCALA = escalaPrice.id;

    return res.status(200).json({
      success: true,
      message: '✅ Todos os produtos criados com sucesso! Copie os IDs abaixo e configure nas variáveis de ambiente do Vercel.',
      price_ids: results,
      instrucoes: [
        '1. Copie cada ID acima',
        '2. Vá em Vercel → seu projeto → Settings → Environment Variables',
        '3. Adicione cada variável com seu respectivo valor',
        '4. Faça um novo deploy (Deployments → Redeploy)',
        '5. APAGUE este arquivo api/setup-stripe.js por segurança',
      ],
    });
  } catch (error) {
    console.error('Erro ao criar produtos no Stripe:', error);
    return res.status(500).json({
      error: 'Erro ao criar produtos',
      details: error.message,
    });
  }
}
