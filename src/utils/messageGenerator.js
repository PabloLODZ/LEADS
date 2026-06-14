// ==================================================
// LODZ - Gerador de Mensagens Personalizadas
// ==================================================
// Função que conecta com a API do Groq (Llama 3)
import Groq from "groq-sdk";

const PAIN_POINTS = {
  'clínica odontológica': ['agenda vazia em horários ociosos', 'dificuldade em atrair pacientes de alto valor', 'dependência de indicação boca a boca'],
  'barbearia': ['clientes que não retornam', 'dificuldade em atrair público premium', 'baixa visibilidade online na região'],
  'academia': ['evasão de alunos nos primeiros meses', 'sazonalidade nas matrículas', 'concorrência com treinos em casa'],
  'clínica de estética': ['concorrência alta em procedimentos populares', 'dificuldade em justificar preço premium', 'dependência de redes sociais orgânicas'],
  'restaurante': ['mesas vazias em dias de semana', 'baixa recorrência de clientes', 'dificuldade em competir com delivery'],
  'pet shop': ['concorrência com grandes redes', 'sazonalidade em alguns serviços', 'dificuldade em fidelizar tutores'],
  'imobiliária': ['ciclo de venda longo', 'leads que só pesquisam sem comprar', 'alto custo por lead qualificado'],
  'escritório de advocacia': ['dificuldade em prospectar sem parecer antiético', 'concorrência com advogados de redes sociais', 'clientes que buscam preço baixo'],
  'consultório médico': ['dependência de convênios com baixo retorno', 'dificuldade em atrair pacientes particulares', 'agenda com horários ociosos'],
  'loja de roupas': ['concorrência com e-commerce', 'estoque parado por falta de giro', 'dificuldade em criar senso de urgência'],
  'default': ['baixa visibilidade online', 'dificuldade em atrair novos clientes', 'dependência de indicações']
};

const OPPORTUNITIES = {
  'clínica odontológica': ['campanhas para clareamento e implantes atraem pacientes de ticket alto', 'conteúdo educativo gera confiança antes da consulta'],
  'barbearia': ['campanhas locais atraem homens da região', 'pacotes mensais aumentam recorrência'],
  'academia': ['campanhas de matrícula com urgência convertem rápido', 'parcerias com nutricionistas ampliam a base'],
  'clínica de estética': ['antes e depois gera prova social poderosa', 'campanhas sazonais para datas comemorativas'],
  'restaurante': ['promoções de segunda a quarta lotam mesas ociosas', 'cardápio digital aumenta ticket médio'],
  'pet shop': ['programas de fidelidade retêm clientes', 'conteúdo sobre cuidados gera autoridade'],
  'imobiliária': ['tours virtuais qualificam leads antes da visita', 'remarketing mantém imóveis na mente do comprador'],
  'escritório de advocacia': ['conteúdo educativo sobre direitos atrai leads qualificados', 'presença no Google Maps gera consultas orgânicas'],
  'consultório médico': ['agendamento online reduz atrito', 'campanhas para checkups atraem pacientes recorrentes'],
  'loja de roupas': ['lançamentos exclusivos criam senso de urgência', 'provador virtual reduz trocas e devoluções'],
  'default': ['presença digital ativa atrai novos clientes todos os dias', 'campanhas segmentadas reduzem custo de aquisição']
};

function findSegmentKey(segment) {
  if (!segment) return 'default';
  const s = segment.toLowerCase();
  for (const key of Object.keys(PAIN_POINTS)) {
    if (key === 'default') continue;
    if (s.includes(key) || key.includes(s)) return key;
  }
  return 'default';
}

function extractKeyInfo(lead) {
  const parts = [];
  if (lead.bio) {
    const services = lead.bio.split(',').map(s => s.trim()).filter(Boolean);
    if (services.length > 0) parts.push(services.slice(0, 3).join(', '));
  }
  if (lead.city) parts.push(lead.city);
  return parts.join(' em ');
}

function generateIcebreaker(lead, campaign) {
  const name = lead.name || 'pessoal';
  const city = lead.city || '';
  const segment = lead.segment || '';

  const options = [
    `Oi, ${name}! Vi o trabalho de vocês${city ? ` em ${city}` : ''} e achei muito bacana.`,
    `Fala, ${name}! Estava pesquisando sobre ${segment.toLowerCase()}${city ? ` em ${city}` : ''} e encontrei vocês.`,
    `E aí, ${name}! Vi que vocês têm uma proposta bem interessante${city ? ` aí em ${city}` : ''}.`,
    `Oi, equipe ${name}! Cheguei até vocês pesquisando ${segment.toLowerCase()} na região${city ? ` de ${city}` : ''}.`,
  ];

  return options[Math.floor(Math.random() * options.length)];
}

function generateCTA(lead, campaign) {
  const options = [
    'Posso te mostrar uma ideia rápida de como isso funcionaria para vocês?',
    'Quer que eu te mande um exemplo de campanha para esse perfil?',
    'Posso te enviar uma proposta personalizada?',
    'Que tal a gente bater um papo rápido sobre isso?',
    'Posso te mostrar como outros negócios parecidos estão fazendo?',
  ];

  return options[Math.floor(Math.random() * options.length)];
}

export function generatePersonalizedLeadMessage({
  lead,
  campaign,
  userOffer = '',
  tone = 'consultivo',
  channel = 'whatsapp',
  personalizationLevel = 'normal'
}) {
  const segmentKey = findSegmentKey(lead.segment);
  const painPoints = PAIN_POINTS[segmentKey] || PAIN_POINTS['default'];
  const opportunities = OPPORTUNITIES[segmentKey] || OPPORTUNITIES['default'];
  const keyInfo = extractKeyInfo(lead);
  const name = lead.name || 'pessoal';
  const offer = userOffer || campaign?.offer || 'soluções digitais';
  const city = lead.city || '';
  const segment = (lead.segment || '').toLowerCase();
  const bio = lead.bio || '';

  // Build personalization reason
  const reasonParts = [];
  if (bio) reasonParts.push(`bio menciona "${bio.substring(0, 60)}"`);
  if (segment) reasonParts.push(`segmento: ${segment}`);
  if (city) reasonParts.push(`localização: ${city}`);
  const personalizationReason = `Mensagem criada com base no fato de o lead ser ${segment ? `um(a) ${segment}` : 'um negócio'}${city ? ` em ${city}` : ''}${bio ? ` com foco em ${bio.split(',')[0]?.trim()?.toLowerCase()}` : ''}.`;

  // Generate icebreaker
  const icebreaker = generateIcebreaker(lead, campaign);

  // Generate CTA
  const customCTA = generateCTA(lead, campaign);

  // Build the main messages based on tone
  const bioRef = bio ? ` Vi que vocês trabalham com ${bio.toLowerCase().substring(0, 80)}.` : '';
  const cityRef = city ? ` em ${city}` : '';
  const segmentRef = segment ? ` de ${segment}` : '';

  // Contextual body
  let contextBody = '';
  if (personalizationLevel === 'alta' && bio) {
    const services = bio.split(',').map(s => s.trim()).filter(Boolean);
    if (services.length > 1) {
      contextBody = `Esse tipo de serviço — ${services.slice(0, 2).join(' e ').toLowerCase()} — tem um público específico que busca ativamente por isso online. `;
    } else {
      contextBody = `${services[0]} é um serviço que muita gente procura ativamente na internet. `;
    }
  } else if (personalizationLevel === 'normal') {
    contextBody = `Esse tipo de negócio depende muito de constância na agenda, e é justamente nisso que ${offer.toLowerCase()} pode ajudar. `;
  } else {
    contextBody = '';
  }

  // Direct version
  const directMessage = `Oi, ${name}!${bioRef} Trabalho com ${offer.toLowerCase()} e tenho ajudado negócios${segmentRef}${cityRef} a atrair mais clientes qualificados. ${customCTA}`;

  // Consultative version
  const consultativeMessage = `Oi, pessoal da ${name}!${bioRef} ${contextBody}Uma campanha bem segmentada${cityRef} pode ajudar a atrair pessoas interessadas${segmentRef ? ` em ${segment}` : ''} na região. ${customCTA}`;

  // Light version
  const lightMessage = `Fala, ${name}!${bioRef ? ` Curti muito o trabalho de vocês${cityRef}.` : ` Vi vocês${cityRef} e achei o perfil bem interessante.`} Tenho uma ideia simples que pode ajudar a trazer mais clientes. Posso compartilhar?`;

  // Select recommended based on tone
  let recommendedMessage;
  switch (tone) {
    case 'direto': recommendedMessage = directMessage; break;
    case 'leve': recommendedMessage = lightMessage; break;
    case 'firme': recommendedMessage = directMessage; break;
    case 'premium': recommendedMessage = consultativeMessage; break;
    case 'consultivo':
    default: recommendedMessage = consultativeMessage; break;
  }

  return {
    recommendedMessage,
    directVersion: directMessage,
    consultativeVersion: consultativeMessage,
    lightVersion: lightMessage,
    personalizationReason,
    icebreaker,
    customCTA,
    detectedPainPoints: painPoints.slice(0, 2),
    detectedOpportunities: opportunities.slice(0, 2),
  };
}

// Prompt for future AI integration
export const AI_SYSTEM_PROMPT = `Você é um especialista em prospecção comercial. Sua tarefa é criar mensagens personalizadas para leads específicos, evitando mensagens genéricas. Analise os dados do lead, a bio, o segmento, a cidade, a campanha e a oferta do usuário. Crie uma mensagem natural, curta, com contexto real do lead, mostrando que a abordagem foi pensada para aquele negócio. Gere também uma versão direta, uma consultiva e uma leve. Nunca use frases genéricas demais. Sempre que possível, mencione o nicho, serviço, cidade, diferencial ou dor provável do lead.`;

// For future AI API integration
export async function generateWithAI(lead, campaign, offer, tone) {
  // TODO: Replace with actual AI API call
  // const response = await fetch('/api/ai/generate-message', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ lead, campaign, offer, tone, systemPrompt: AI_SYSTEM_PROMPT })
  // });
  // return response.json();

  // For now, use template-based generation
  return generatePersonalizedLeadMessage({ lead, campaign, userOffer: offer, tone });
}

// Generate AI Sócio responses for conversation replies
export function generateSocioResponses({ lead, campaign, sentMessage, receivedReply }) {
  const name = lead?.name || 'lead';
  const segment = lead?.segment || '';
  const offer = campaign?.offer || 'soluções';

  const directResponse = `Que bom que respondeu, ${name}! Vou direto ao ponto: posso te mostrar em 5 minutos como ${offer.toLowerCase()} já ajudou negócios de ${segment.toLowerCase()} a aumentar o faturamento. Quando seria um bom horário para uma call rápida?`;

  const firmResponse = `${name}, fico feliz com a resposta! Olha, eu realmente acredito que tem uma oportunidade grande aqui para vocês. Já ajudei outros negócios de ${segment.toLowerCase()} com resultados bem expressivos. Posso te mandar um case rápido? Aí você decide se faz sentido conversar mais.`;

  const lightResponse = `Show, ${name}! Sem pressão nenhuma. Posso te mandar um material bem rápido mostrando como funciona? Aí você vê com calma e, se fizer sentido, a gente conversa. 😊`;

  return {
    directResponse,
    firmResponse,
    lightResponse,
  };
}

// Generate conversational AI responses based on user prompt and lead context
const SOCIO_AI_SYSTEM_PROMPT = `Você é o "Sócio AI", um especialista sênior em vendas B2B e prospecção da plataforma LODZ.
Seu objetivo é ajudar o usuário (assinante) a converter seus leads, contornar objeções e escrever respostas no WhatsApp.
O usuário vai colar mensagens do lead ou pedir dicas.
Regras de Comportamento:
1. Seja sempre consultivo, inteligente, prático e focado em conversão.
2. Fale de forma fluida e conversacional. Use um tom de parceiro de negócios ("sócio").
3. Quando você for sugerir uma mensagem exata para o usuário enviar ao lead, destaque-a claramente entre aspas para facilitar a cópia.
4. Responda em Português do Brasil.
5. Seja direto, sem introduções robóticas do tipo "Olá, sou uma inteligência artificial".`;

const getAI = () => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey, dangerouslyAllowBrowser: true });
};

export async function generateChatResponse(lead, userMessage, chatHistory = []) {
  try {
    const ai = getAI();
    if (!ai) {
      return {
        content: "⚠️ **Chave de API não configurada.** Para que eu funcione com o cérebro do Groq (Llama 3), você precisa adicionar `VITE_GROQ_API_KEY` no seu arquivo `.env.local` e reiniciar a aplicação."
      };
    }

    const messages = [
      { role: "system", content: SOCIO_AI_SYSTEM_PROMPT }
    ];

    // Format history for Groq API
    for (let i = 0; i < chatHistory.length - 1; i++) {
      const msg = chatHistory[i];
      // Skip the very first local generated welcome message
      if (i === 0 && msg.role === 'ai') continue;
      
      messages.push({
        role: msg.role === 'ai' ? 'assistant' : 'user',
        content: msg.content
      });
    }

    // Inject context on the first interaction
    let prompt = userMessage;
    if (chatHistory.length <= 2) {
      prompt = `[CONTEXTO DO LEAD - Nome: ${lead?.name || 'Desconhecido'} | Segmento: ${lead?.segment || 'Não informado'} | Bio: ${lead?.bio || 'Nenhuma'} | Primeira abordagem que enviamos: ${lead?.personalizedMessage || 'Nenhuma'}]\n\nMensagem do usuário: ${userMessage}`;
    }

    messages.push({ role: "user", content: prompt });

    const completion = await ai.chat.completions.create({
      messages: messages,
      model: "llama3-70b-8192",
      temperature: 0.7,
      max_tokens: 1024,
    });

    const responseText = completion.choices[0]?.message?.content || "";

    return {
      content: responseText
    };

  } catch (error) {
    console.error("Erro no Groq AI:", error);
    const errorMsg = error?.message || "Erro desconhecido";
    return {
      content: `❌ **Falha na conexão com a IA**\n\nOcorreu um erro ao conectar com o Groq. Motivo técnico: \`${errorMsg}\``
    };
  }
}
