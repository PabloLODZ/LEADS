import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

function createSupabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const MESSAGE_TYPES = {
  primeira_abordagem: 'Primeira abordagem (fria)',
  followup_educado: 'Follow-up educado',
  lead_frio: 'Lead frio (sem resposta há dias)',
  direta: 'Mensagem direta e objetiva',
  objecao_preco: 'Resposta a objeção de preço',
  whatsapp_curta: 'Mensagem curta para WhatsApp',
};

function buildPrompt(lead, campaign, messageType, customInstruction) {
  const leadContext = [
    `Nome do lead: ${lead.name}`,
    lead.city ? `Cidade: ${lead.city}, ${lead.state || ''}` : '',
    lead.segment ? `Segmento/nicho: ${lead.segment}` : '',
    lead.bio ? `Bio/descrição: ${lead.bio}` : '',
    lead.googleRating ? `Avaliação Google: ${lead.googleRating} estrelas (${lead.googleReviewsCount || 0} avaliações)` : '',
    lead.notes ? `Observações do vendedor: ${lead.notes}` : '',
    lead.status ? `Status atual no funil: ${lead.status}` : '',
    lead.lossReason ? `Motivo de perda anterior: ${lead.lossReason}` : '',
  ].filter(Boolean).join('\n');

  const campaignContext = campaign ? [
    `Oferta do vendedor: ${campaign.offer || ''}`,
    `Tom da campanha: ${campaign.tone || 'consultivo'}`,
    `Canal: ${campaign.channel || 'whatsapp'}`,
  ].filter(Boolean).join('\n') : '';

  const typeInstructions = {
    primeira_abordagem: 'É a primeira vez que vamos entrar em contato. Seja natural, não pareça um robô, mencione algo específico do negócio deles.',
    followup_educado: 'Já enviamos uma mensagem antes e não houve resposta. Seja gentil e não pressione. Apenas reforce o valor.',
    lead_frio: 'O lead não respondeu há vários dias. Seja simpático, reconecte sem pressão, talvez com um ângulo diferente.',
    direta: 'Vá direto ao ponto. Seja objetivo, sem rodeios. Apresente a proposta de valor claramente.',
    objecao_preco: 'O lead mencionou que o preço está alto. Ajude a recontextualizar o valor, mostre ROI, use empatia.',
    whatsapp_curta: 'Máximo 3 linhas. Objetivo, direto, com apenas 1 pergunta ou CTA no final. Ideal para WhatsApp.',
  };

  return `Você é um especialista em prospecção B2B/B2C. Crie uma mensagem de venda personalizada e natural.

DADOS DO LEAD:
${leadContext}

CONTEXTO DA CAMPANHA:
${campaignContext}

TIPO DE MENSAGEM: ${MESSAGE_TYPES[messageType]}
INSTRUÇÃO ESPECÍFICA: ${typeInstructions[messageType]}
${customInstruction ? `INSTRUÇÃO ADICIONAL DO VENDEDOR: ${customInstruction}` : ''}
${(campaign?.planId === 'pro' || campaign?.planId === 'agency') ? '\nINSTRUÇÃO AVANÇADA DE VENDAS (PNL): Aplique gatilhos mentais sutis como escassez ou prova social. Use tom altamente persuasivo, espelhando a comunicação do lead para gerar rapport imediato. Foque em conversão rápida e dor latente.' : ''}

REGRAS OBRIGATÓRIAS:
- NÃO use frases genéricas como "espero que esteja bem" ou "tudo bem?"
- Mencione algo específico do negócio/cidade/segmento do lead
- Seja genuíno e humano
- Para WhatsApp: sem formalidade excessiva
- Máximo 150 palavras (exceto se for primeira abordagem que pode ter até 200)
- Termine com 1 CTA claro e simples

Retorne APENAS a mensagem, sem explicações, sem aspas, sem prefixos.`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  const { lead, campaign, messageType, customInstruction, userId } = req.body;

  if (!lead || !messageType || !userId) {
    return res.status(400).json({ error: 'Parâmetros obrigatórios: lead, messageType, userId.' });
  }

  if (!MESSAGE_TYPES[messageType]) {
    return res.status(400).json({
      error: `Tipo de mensagem inválido. Use: ${Object.keys(MESSAGE_TYPES).join(', ')}`
    });
  }

  try {
    const supabase = createSupabaseAdmin();

    // Verify user exists and is not blocked
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, is_blocked, base_credits, purchased_credits')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    if (profile.is_blocked) {
      return res.status(403).json({ error: 'Conta bloqueada. Entre em contato com o suporte.' });
    }

    // Admins don't consume credits for AI messages
    const isAdmin = profile.role === 'admin';

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'API de IA não configurada. Contate o suporte.' });
    }

    // Call Gemini API
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = buildPrompt(lead, campaign, messageType, customInstruction);
    const result = await model.generateContent(prompt);
    const generatedMessage = result.response.text().trim();

    // Determine credit cost
    const cost = isAdmin ? 0 : 1;
    let newBase = profile.base_credits || 0;
    let newPurchased = profile.purchased_credits || 0;

    if (!isAdmin) {
      const available = newBase + newPurchased;
      if (available < cost) {
        return res.status(403).json({ error: 'Créditos insuficientes para gerar a mensagem com IA.' });
      }
      
      let remaining = cost;
      const fromBase = Math.min(remaining, newBase);
      newBase -= fromBase;
      remaining -= fromBase;
      
      if (remaining > 0) {
        newPurchased -= remaining;
      }

      await supabase.from('profiles').update({
        base_credits: newBase,
        purchased_credits: newPurchased,
      }).eq('id', userId);
    }

    // Log the AI generation in credit_transactions
    const transaction = {
      user_id: userId,
      type: 'ai_message_generated',
      amount: -cost,
      balance_before: (profile.base_credits || 0) + (profile.purchased_credits || 0),
      balance_after: newBase + newPurchased,
      reason: `IA Especialista: ${MESSAGE_TYPES[messageType]} para "${lead.name}"`,
      description: `Tipo: ${messageType} | Lead: ${lead.name} | ${new Date().toLocaleDateString('pt-BR')}`,
    };

    const { data: txData } = await supabase.from('credit_transactions').insert(transaction).select().single();

    return res.status(200).json({
      message: generatedMessage,
      messageType,
      messageTypeLabel: MESSAGE_TYPES[messageType],
      leadName: lead.name,
      credits: { base_credits: newBase, purchased_credits: newPurchased },
      transaction: txData
    });

  } catch (err) {
    console.error('Erro ao gerar mensagem com IA:', err);

    if (err.message?.includes('API_KEY') || err.message?.includes('quota')) {
      return res.status(503).json({ error: 'Serviço de IA temporariamente indisponível. Tente novamente.' });
    }

    return res.status(500).json({ error: 'Erro ao gerar mensagem. Tente novamente.' });
  }
}
