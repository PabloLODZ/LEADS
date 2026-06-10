import { generatePersonalizedLeadMessage } from '../utils/messageGenerator.js';

// ==================================================
// MOCK DATA — LODZ
// ==================================================

// USERS
export const MOCK_USERS = [
  {
    id: 'usr_admin',
    name: 'Admin LODZ',
    email: 'admin@lodz.com',
    passwordHash: 'admin123',
    avatarUrl: null,
    role: 'admin',
    planId: 'agency',
    subscriptionStatus: 'ativo',
    stripeCustomerId: 'cus_admin_mock',
    whatsappPhone: '',
    whatsappRemindersEnabled: false,
    onboardingCompleted: true,
    creditWallet: { baseCredits: 999, purchasedCredits: 0 },
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-06-01T00:00:00Z',
  },
  {
    id: 'usr_lucas',
    name: 'Lucas',
    email: 'lucas@teste.com',
    passwordHash: '123456',
    avatarUrl: null,
    role: 'subscriber',
    planId: 'starter',
    subscriptionStatus: 'ativo',
    stripeCustomerId: 'cus_lucas_mock',
    whatsappPhone: '62999990001',
    whatsappRemindersEnabled: true,
    onboardingCompleted: true,
    creditWallet: { baseCredits: 38, purchasedCredits: 12 },
    createdAt: '2025-05-01T00:00:00Z',
    updatedAt: '2025-06-10T00:00:00Z',
  }
];

// CAMPAIGNS
export const MOCK_CAMPAIGNS = [
  {
    id: 'cmp_1',
    userId: 'usr_lucas',
    name: 'Clínicas odontológicas Goiânia',
    offer: 'Gestão de tráfego para clínicas',
    targetAudience: 'Dentistas e clínicas odontológicas',
    segment: 'Clínica odontológica',
    location: 'Goiânia, GO',
    tone: 'consultivo',
    desiredLeads: 15,
    generatedLeads: 8,
    contactedLeads: 5,
    respondedLeads: 2,
    closedLeads: 1,
    status: 'ativa',
    initialMessage: '',
    messageSize: 'média',
    channel: 'whatsapp',
    personalizationLevel: 'normal',
    createdAt: '2025-06-01T10:00:00Z',
    updatedAt: '2025-06-08T14:00:00Z',
  },
  {
    id: 'cmp_2',
    userId: 'usr_lucas',
    name: 'Barbearias premium São Paulo',
    offer: 'Social media e anúncios locais',
    targetAudience: 'Barbearias de alto padrão',
    segment: 'Barbearia',
    location: 'São Paulo, SP',
    tone: 'direto',
    desiredLeads: 20,
    generatedLeads: 12,
    contactedLeads: 8,
    respondedLeads: 3,
    closedLeads: 0,
    status: 'ativa',
    initialMessage: '',
    messageSize: 'curta',
    channel: 'instagram',
    personalizationLevel: 'alta',
    createdAt: '2025-06-03T09:00:00Z',
    updatedAt: '2025-06-09T16:00:00Z',
  },
  {
    id: 'cmp_3',
    userId: 'usr_lucas',
    name: 'Academias em Belo Horizonte',
    offer: 'Marketing digital para academias',
    targetAudience: 'Academias e estúdios de musculação',
    segment: 'Academia',
    location: 'Belo Horizonte, MG',
    tone: 'leve',
    desiredLeads: 10,
    generatedLeads: 6,
    contactedLeads: 2,
    respondedLeads: 1,
    closedLeads: 0,
    status: 'pausada',
    initialMessage: '',
    messageSize: 'completa',
    channel: 'whatsapp',
    personalizationLevel: 'normal',
    createdAt: '2025-06-05T11:00:00Z',
    updatedAt: '2025-06-07T10:00:00Z',
  }
];

// LEADS — raw data, messages generated below
const RAW_LEADS = [
  // Campaign 1 — Clinicas Goiânia
  { id: 'lead_1', userId: 'usr_lucas', campaignId: 'cmp_1', name: 'Odonto Prime', username: '@odontoprime.gyn', bio: 'Implantes, clareamento e ortodontia em Goiânia', phone: '(62) 3333-1001', whatsappUrl: 'https://wa.me/5562933311001', instagramUrl: 'https://instagram.com/odontoprime.gyn', website: 'https://odontoprime.com.br', city: 'Goiânia', state: 'GO', source: 'instagram', score: 87, status: 'novo', segment: 'Clínica odontológica', notes: '', lastInteractionAt: '2025-06-09T10:00:00Z', createdAt: '2025-06-02T10:00:00Z' },
  { id: 'lead_2', userId: 'usr_lucas', campaignId: 'cmp_1', name: 'Studio Bella Face', username: '@studiobella.gyn', bio: 'Harmonização facial, limpeza de pele e protocolos personalizados em Goiânia', phone: '(62) 3333-1002', whatsappUrl: 'https://wa.me/5562933311002', instagramUrl: 'https://instagram.com/studiobella.gyn', website: '', city: 'Goiânia', state: 'GO', source: 'instagram', score: 92, status: 'contactado', segment: 'Clínica de estética', notes: 'Respondeu no WhatsApp perguntando sobre valores.', lastInteractionAt: '2025-06-08T15:30:00Z', createdAt: '2025-06-02T10:05:00Z' },
  { id: 'lead_3', userId: 'usr_lucas', campaignId: 'cmp_1', name: 'Clínica Sorriso Perfeito', username: '@sorrisoperfeito', bio: 'Ortodontia invisível, lentes de contato dental, clareamento a laser', phone: '(62) 3333-1003', whatsappUrl: 'https://wa.me/5562933311003', instagramUrl: 'https://instagram.com/sorrisoperfeito', website: 'https://sorrisoperfeito.com', city: 'Goiânia', state: 'GO', source: 'google_maps', score: 78, status: 'respondeu', segment: 'Clínica odontológica', notes: 'Interessado, pediu proposta.', lastInteractionAt: '2025-06-09T08:00:00Z', createdAt: '2025-06-03T09:00:00Z' },
  { id: 'lead_4', userId: 'usr_lucas', campaignId: 'cmp_1', name: 'Odonto Excellence', username: '@odontoexcellence', bio: 'Próteses, implantes e estética dental', phone: '(62) 3333-1004', whatsappUrl: '', instagramUrl: 'https://instagram.com/odontoexcellence', website: '', city: 'Goiânia', state: 'GO', source: 'instagram', score: 65, status: 'contactado', segment: 'Clínica odontológica', notes: '', lastInteractionAt: '2025-06-07T12:00:00Z', createdAt: '2025-06-03T09:30:00Z' },
  { id: 'lead_5', userId: 'usr_lucas', campaignId: 'cmp_1', name: 'Dr. Marcos Almeida', username: '@dr.marcosalmeida', bio: 'Cirurgião-dentista | Implantodontia | Goiânia', phone: '(62) 3333-1005', whatsappUrl: 'https://wa.me/5562933311005', instagramUrl: 'https://instagram.com/dr.marcosalmeida', website: 'https://drmarcosalmeida.com.br', city: 'Goiânia', state: 'GO', source: 'instagram', score: 90, status: 'fechado', segment: 'Clínica odontológica', notes: 'Fechou pacote de 3 meses!', lastInteractionAt: '2025-06-10T09:00:00Z', createdAt: '2025-06-02T11:00:00Z' },
  { id: 'lead_6', userId: 'usr_lucas', campaignId: 'cmp_1', name: 'OdontoKids Goiânia', username: '@odontokids.gyn', bio: 'Odontopediatria com amor e cuidado', phone: '(62) 3333-1006', whatsappUrl: 'https://wa.me/5562933311006', instagramUrl: 'https://instagram.com/odontokids.gyn', website: '', city: 'Goiânia', state: 'GO', source: 'google_maps', score: 55, status: 'descartado', segment: 'Clínica odontológica', notes: 'Não tem interesse no momento.', lastInteractionAt: '2025-06-05T10:00:00Z', createdAt: '2025-06-04T10:00:00Z' },
  { id: 'lead_7', userId: 'usr_lucas', campaignId: 'cmp_1', name: 'Dra. Fernanda Costa', username: '@drafernandaodonto', bio: 'Especialista em lentes de contato dental | Sorriso natural', phone: '(62) 3333-1007', whatsappUrl: 'https://wa.me/5562933311007', instagramUrl: 'https://instagram.com/drafernandaodonto', website: '', city: 'Goiânia', state: 'GO', source: 'instagram', score: 82, status: 'follow_up', segment: 'Clínica odontológica', notes: 'Follow-up para segunda-feira', lastInteractionAt: '2025-06-09T16:00:00Z', createdAt: '2025-06-04T14:00:00Z' },
  { id: 'lead_8', userId: 'usr_lucas', campaignId: 'cmp_1', name: 'Clínica Dental Art', username: '@clinicadentalart', bio: 'Estética dental, facetas e reabilitação oral', phone: '(62) 3333-1008', whatsappUrl: 'https://wa.me/5562933311008', instagramUrl: 'https://instagram.com/clinicadentalart', website: 'https://dentalart.com.br', city: 'Goiânia', state: 'GO', source: 'google_maps', score: 73, status: 'novo', segment: 'Clínica odontológica', notes: '', lastInteractionAt: null, createdAt: '2025-06-05T10:00:00Z' },

  // Campaign 2 — Barbearias SP
  { id: 'lead_9', userId: 'usr_lucas', campaignId: 'cmp_2', name: 'Barbearia Dom Corte', username: '@domcorte.sp', bio: 'Corte masculino, barba, pigmentação e atendimento premium', phone: '(11) 9999-2001', whatsappUrl: 'https://wa.me/5511999992001', instagramUrl: 'https://instagram.com/domcorte.sp', website: 'https://domcorte.com.br', city: 'São Paulo', state: 'SP', source: 'instagram', score: 95, status: 'respondeu', segment: 'Barbearia', notes: 'Muito interessado, quer ver portfolio.', lastInteractionAt: '2025-06-09T11:00:00Z', createdAt: '2025-06-04T09:00:00Z' },
  { id: 'lead_10', userId: 'usr_lucas', campaignId: 'cmp_2', name: 'Barba Negra Premium', username: '@barbanegrapremium', bio: 'A barbearia mais premiada de SP | Corte, barba, tratamentos', phone: '(11) 9999-2002', whatsappUrl: 'https://wa.me/5511999992002', instagramUrl: 'https://instagram.com/barbanegrapremium', website: 'https://barbanegra.com', city: 'São Paulo', state: 'SP', source: 'instagram', score: 88, status: 'contactado', segment: 'Barbearia', notes: '', lastInteractionAt: '2025-06-08T14:00:00Z', createdAt: '2025-06-04T09:15:00Z' },
  { id: 'lead_11', userId: 'usr_lucas', campaignId: 'cmp_2', name: 'The King Barber', username: '@thekingbarber.sp', bio: 'Cortes modernos, barba desenhada, pigmentação capilar', phone: '(11) 9999-2003', whatsappUrl: 'https://wa.me/5511999992003', instagramUrl: 'https://instagram.com/thekingbarber.sp', website: '', city: 'São Paulo', state: 'SP', source: 'instagram', score: 72, status: 'novo', segment: 'Barbearia', notes: '', lastInteractionAt: null, createdAt: '2025-06-05T10:00:00Z' },
  { id: 'lead_12', userId: 'usr_lucas', campaignId: 'cmp_2', name: 'Corte & Estilo', username: '@corteeestilo', bio: 'Barbearia completa | Corte, barba, sobrancelha e skin care', phone: '(11) 9999-2004', whatsappUrl: 'https://wa.me/5511999992004', instagramUrl: 'https://instagram.com/corteeestilo', website: 'https://corteeestilo.com.br', city: 'São Paulo', state: 'SP', source: 'google_maps', score: 68, status: 'contactado', segment: 'Barbearia', notes: 'Visualizou a mensagem, não respondeu ainda.', lastInteractionAt: '2025-06-07T16:00:00Z', createdAt: '2025-06-05T10:30:00Z' },
  { id: 'lead_13', userId: 'usr_lucas', campaignId: 'cmp_2', name: 'Barbearia Studio M', username: '@studiom.barber', bio: 'Ambiente premium | Cerveja artesanal | Corte masculino', phone: '(11) 9999-2005', whatsappUrl: '', instagramUrl: 'https://instagram.com/studiom.barber', website: '', city: 'São Paulo', state: 'SP', source: 'instagram', score: 81, status: 'respondeu', segment: 'Barbearia', notes: 'Respondeu com interesse mas quer pensar.', lastInteractionAt: '2025-06-09T09:30:00Z', createdAt: '2025-06-05T11:00:00Z' },
  { id: 'lead_14', userId: 'usr_lucas', campaignId: 'cmp_2', name: 'Don Pablo Barber', username: '@donpablobarber', bio: 'Barbearia old school | Atendimento com hora marcada', phone: '(11) 9999-2006', whatsappUrl: 'https://wa.me/5511999992006', instagramUrl: 'https://instagram.com/donpablobarber', website: '', city: 'São Paulo', state: 'SP', source: 'instagram', score: 60, status: 'perdido', segment: 'Barbearia', notes: 'Disse que já tem agência.', lastInteractionAt: '2025-06-06T14:00:00Z', createdAt: '2025-06-05T11:30:00Z' },
  { id: 'lead_15', userId: 'usr_lucas', campaignId: 'cmp_2', name: 'Classic Cuts SP', username: '@classiccuts.sp', bio: 'Corte clássico e moderno | 3 unidades em SP', phone: '(11) 9999-2007', whatsappUrl: 'https://wa.me/5511999992007', instagramUrl: 'https://instagram.com/classiccuts.sp', website: 'https://classiccuts.com.br', city: 'São Paulo', state: 'SP', source: 'google_maps', score: 84, status: 'follow_up', segment: 'Barbearia', notes: 'Combinou retorno para próxima semana.', lastInteractionAt: '2025-06-08T10:00:00Z', createdAt: '2025-06-06T09:00:00Z' },
  { id: 'lead_16', userId: 'usr_lucas', campaignId: 'cmp_2', name: 'Groomers Club', username: '@groomersclub', bio: 'Men grooming | Barba, cabelo, skin care e produtos premium', phone: '(11) 9999-2008', whatsappUrl: 'https://wa.me/5511999992008', instagramUrl: 'https://instagram.com/groomersclub', website: 'https://groomersclub.com.br', city: 'São Paulo', state: 'SP', source: 'instagram', score: 91, status: 'contactado', segment: 'Barbearia', notes: '', lastInteractionAt: '2025-06-09T15:00:00Z', createdAt: '2025-06-06T10:00:00Z' },
  { id: 'lead_17', userId: 'usr_lucas', campaignId: 'cmp_2', name: 'Razor Sharp Barber', username: '@razorsharp.sp', bio: 'Navalha, degradê e barba artesanal', phone: '(11) 9999-2009', whatsappUrl: 'https://wa.me/5511999992009', instagramUrl: 'https://instagram.com/razorsharp.sp', website: '', city: 'São Paulo', state: 'SP', source: 'instagram', score: 76, status: 'novo', segment: 'Barbearia', notes: '', lastInteractionAt: null, createdAt: '2025-06-07T09:00:00Z' },
  { id: 'lead_18', userId: 'usr_lucas', campaignId: 'cmp_2', name: 'Alpha Barber House', username: '@alphabarberhouse', bio: 'Barbearia conceito em Pinheiros | Corte, barba e cerveja', phone: '(11) 9999-2010', whatsappUrl: 'https://wa.me/5511999992010', instagramUrl: 'https://instagram.com/alphabarberhouse', website: 'https://alphabarber.com', city: 'São Paulo', state: 'SP', source: 'instagram', score: 85, status: 'contactado', segment: 'Barbearia', notes: 'Mandou mensagem no Instagram.', lastInteractionAt: '2025-06-09T17:00:00Z', createdAt: '2025-06-07T10:00:00Z' },
  { id: 'lead_19', userId: 'usr_lucas', campaignId: 'cmp_2', name: 'Corte Real Barber', username: '@corterealbarber', bio: 'Tradição e estilo | Desde 2015', phone: '(11) 9999-2011', whatsappUrl: 'https://wa.me/5511999992011', instagramUrl: 'https://instagram.com/corterealbarber', website: '', city: 'São Paulo', state: 'SP', source: 'google_maps', score: 62, status: 'novo', segment: 'Barbearia', notes: '', lastInteractionAt: null, createdAt: '2025-06-08T09:00:00Z' },
  { id: 'lead_20', userId: 'usr_lucas', campaignId: 'cmp_2', name: 'Uppercut Studio', username: '@uppercutstudio', bio: 'Barbearia e tattoo | Arte em cada detalhe', phone: '(11) 9999-2012', whatsappUrl: 'https://wa.me/5511999992012', instagramUrl: 'https://instagram.com/uppercutstudio', website: 'https://uppercutstudio.com', city: 'São Paulo', state: 'SP', source: 'instagram', score: 79, status: 'respondeu', segment: 'Barbearia', notes: 'Pediu mais informações sobre preço.', lastInteractionAt: '2025-06-10T08:00:00Z', createdAt: '2025-06-08T10:00:00Z' },

  // Campaign 3 — Academias BH
  { id: 'lead_21', userId: 'usr_lucas', campaignId: 'cmp_3', name: 'Iron Body Academia', username: '@ironbody.bh', bio: 'Musculação, funcional e spinning em BH', phone: '(31) 9999-3001', whatsappUrl: 'https://wa.me/5531999993001', instagramUrl: 'https://instagram.com/ironbody.bh', website: 'https://ironbody.com.br', city: 'Belo Horizonte', state: 'MG', source: 'instagram', score: 88, status: 'novo', segment: 'Academia', notes: '', lastInteractionAt: null, createdAt: '2025-06-06T09:00:00Z' },
  { id: 'lead_22', userId: 'usr_lucas', campaignId: 'cmp_3', name: 'PowerFit Studio', username: '@powerfit.bh', bio: 'Treino personalizado, avaliação física e acompanhamento nutricional', phone: '(31) 9999-3002', whatsappUrl: 'https://wa.me/5531999993002', instagramUrl: 'https://instagram.com/powerfit.bh', website: '', city: 'Belo Horizonte', state: 'MG', source: 'instagram', score: 75, status: 'contactado', segment: 'Academia', notes: '', lastInteractionAt: '2025-06-07T14:00:00Z', createdAt: '2025-06-06T09:30:00Z' },
  { id: 'lead_23', userId: 'usr_lucas', campaignId: 'cmp_3', name: 'Gym Plus BH', username: '@gymplus.bh', bio: 'A maior academia do bairro Savassi | 2000m²', phone: '(31) 9999-3003', whatsappUrl: 'https://wa.me/5531999993003', instagramUrl: 'https://instagram.com/gymplus.bh', website: 'https://gymplus.com.br', city: 'Belo Horizonte', state: 'MG', source: 'google_maps', score: 82, status: 'respondeu', segment: 'Academia', notes: 'Quer agendar call para semana que vem.', lastInteractionAt: '2025-06-09T11:00:00Z', createdAt: '2025-06-06T10:00:00Z' },
  { id: 'lead_24', userId: 'usr_lucas', campaignId: 'cmp_3', name: 'Corpo & Mente Fitness', username: '@corpoemente.fit', bio: 'Pilates, yoga e funcional para todas as idades', phone: '(31) 9999-3004', whatsappUrl: 'https://wa.me/5531999993004', instagramUrl: 'https://instagram.com/corpoemente.fit', website: '', city: 'Belo Horizonte', state: 'MG', source: 'instagram', score: 69, status: 'novo', segment: 'Academia', notes: '', lastInteractionAt: null, createdAt: '2025-06-07T09:00:00Z' },
  { id: 'lead_25', userId: 'usr_lucas', campaignId: 'cmp_3', name: 'Xtreme Training', username: '@xtremetraining.bh', bio: 'CrossFit, HIIT e treinamento de alta performance', phone: '(31) 9999-3005', whatsappUrl: 'https://wa.me/5531999993005', instagramUrl: 'https://instagram.com/xtremetraining.bh', website: 'https://xtremetraining.com.br', city: 'Belo Horizonte', state: 'MG', source: 'instagram', score: 93, status: 'follow_up', segment: 'Academia', notes: 'Muito engajado, marcar follow-up.', lastInteractionAt: '2025-06-09T16:00:00Z', createdAt: '2025-06-07T10:00:00Z' },
  { id: 'lead_26', userId: 'usr_lucas', campaignId: 'cmp_3', name: 'Smart Fit Savassi', username: '@smartfit.savassi', bio: 'Academia 24h | Planos a partir de R$ 99', phone: '(31) 9999-3006', whatsappUrl: '', instagramUrl: 'https://instagram.com/smartfit.savassi', website: 'https://smartfit.com.br', city: 'Belo Horizonte', state: 'MG', source: 'google_maps', score: 45, status: 'descartado', segment: 'Academia', notes: 'Rede grande, não é o perfil ideal.', lastInteractionAt: '2025-06-06T16:00:00Z', createdAt: '2025-06-07T11:00:00Z' },
];

// Generate personalized messages for each lead
function enrichLeadWithMessages(lead) {
  const campaign = MOCK_CAMPAIGNS.find(c => c.id === lead.campaignId);
  const msgs = generatePersonalizedLeadMessage({
    lead,
    campaign,
    userOffer: campaign?.offer || '',
    tone: campaign?.tone || 'consultivo',
    channel: campaign?.channel || 'whatsapp',
    personalizationLevel: campaign?.personalizationLevel || 'normal',
  });

  return {
    ...lead,
    personalizedMessage: msgs.recommendedMessage,
    messageDirect: msgs.directVersion,
    messageConsultative: msgs.consultativeVersion,
    messageLight: msgs.lightVersion,
    personalizationReason: msgs.personalizationReason,
    icebreaker: msgs.icebreaker,
    customCta: msgs.customCTA,
    detectedPainPoints: msgs.detectedPainPoints,
    detectedOpportunities: msgs.detectedOpportunities,
    firstMessage: msgs.recommendedMessage,
    lastMessage: '',
  };
}

export const MOCK_LEADS = RAW_LEADS.map(enrichLeadWithMessages);

// CREDIT TRANSACTIONS
export const MOCK_CREDIT_TRANSACTIONS = [
  { id: 'txn_1', userId: 'usr_lucas', type: 'plan_renewal', amount: 50, balanceBefore: 0, balanceAfter: 50, reason: 'Renovação do plano Starter', campaignId: null, paymentId: 'pay_1', createdByAdminId: null, createdAt: '2025-06-01T00:00:00Z' },
  { id: 'txn_2', userId: 'usr_lucas', type: 'lead_generation', amount: -8, balanceBefore: 50, balanceAfter: 42, reason: 'Geração de 8 leads — Clínicas odontológicas Goiânia', campaignId: 'cmp_1', paymentId: null, createdByAdminId: null, createdAt: '2025-06-02T10:00:00Z' },
  { id: 'txn_3', userId: 'usr_lucas', type: 'lead_generation', amount: -12, balanceBefore: 42, balanceAfter: 30, reason: 'Geração de 12 leads — Barbearias premium São Paulo', campaignId: 'cmp_2', paymentId: null, createdByAdminId: null, createdAt: '2025-06-04T09:00:00Z' },
  { id: 'txn_4', userId: 'usr_lucas', type: 'extra_purchase', amount: 35, balanceBefore: 30, balanceAfter: 65, reason: 'Compra de 35 créditos — Pacote Booster', campaignId: null, paymentId: 'pay_2', createdByAdminId: null, createdAt: '2025-06-04T15:00:00Z' },
  { id: 'txn_5', userId: 'usr_lucas', type: 'lead_generation', amount: -6, balanceBefore: 65, balanceAfter: 59, reason: 'Geração de 6 leads — Academias em Belo Horizonte', campaignId: 'cmp_3', paymentId: null, createdByAdminId: null, createdAt: '2025-06-06T09:00:00Z' },
  { id: 'txn_6', userId: 'usr_lucas', type: 'manual_admin_add', amount: -9, balanceBefore: 59, balanceAfter: 50, reason: 'Ajuste manual pelo admin', campaignId: null, paymentId: null, createdByAdminId: 'usr_admin', createdAt: '2025-06-08T10:00:00Z' },
];

// SEARCHES
export const MOCK_SEARCHES = [
  { id: 'src_1', userId: 'usr_lucas', campaignId: 'cmp_1', query: 'clínica odontológica', location: 'Goiânia, GO', filtersJson: { hasWhatsapp: true, hasInstagram: true, minScore: 50 }, resultsCount: 8, creditsUsed: 8, createdAt: '2025-06-02T10:00:00Z' },
  { id: 'src_2', userId: 'usr_lucas', campaignId: 'cmp_2', query: 'barbearia premium', location: 'São Paulo, SP', filtersJson: { hasWhatsapp: true, hasInstagram: true, hasBio: true, minScore: 60 }, resultsCount: 12, creditsUsed: 12, createdAt: '2025-06-04T09:00:00Z' },
  { id: 'src_3', userId: 'usr_lucas', campaignId: 'cmp_3', query: 'academia musculação', location: 'Belo Horizonte, MG', filtersJson: { hasWhatsapp: true, minScore: 40 }, resultsCount: 6, creditsUsed: 6, createdAt: '2025-06-06T09:00:00Z' },
];

// FEEDBACKS
export const MOCK_FEEDBACKS = [
  { id: 'fb_1', userId: 'usr_lucas', type: 'sugestão', message: 'Seria legal poder filtrar leads por número de seguidores no Instagram.', status: 'novo', createdAt: '2025-06-08T10:00:00Z' },
  { id: 'fb_2', userId: 'usr_lucas', type: 'elogio', message: 'O Sócio é incrível! As mensagens personalizadas são muito boas.', status: 'lido', createdAt: '2025-06-05T15:00:00Z' },
];

// PAYMENTS
export const MOCK_PAYMENTS = [
  { id: 'pay_1', userId: 'usr_lucas', planId: 'starter', amount: 67, status: 'aprovado', provider: 'stripe', providerPaymentId: 'pi_mock_001', productType: 'subscription', creditsPurchased: 0, createdAt: '2025-06-01T00:00:00Z' },
  { id: 'pay_2', userId: 'usr_lucas', planId: null, amount: 37, status: 'aprovado', provider: 'stripe', providerPaymentId: 'pi_mock_002', productType: 'extra_credits', creditsPurchased: 35, createdAt: '2025-06-04T15:00:00Z' },
];

// LEAD INTERACTIONS
export const MOCK_INTERACTIONS = [
  { id: 'int_1', userId: 'usr_lucas', leadId: 'lead_2', type: 'message_sent', message: 'Oi, pessoal da Bella Face! Vi que vocês trabalham com harmonização facial...', direction: 'out', createdAt: '2025-06-06T10:00:00Z' },
  { id: 'int_2', userId: 'usr_lucas', leadId: 'lead_2', type: 'message_received', message: 'Oi! Tudo bem? Quanto custa mais ou menos?', direction: 'in', createdAt: '2025-06-08T15:30:00Z' },
  { id: 'int_3', userId: 'usr_lucas', leadId: 'lead_9', type: 'message_sent', message: 'Fala, pessoal da Dom Corte! Vi que vocês têm uma pegada mais premium...', direction: 'out', createdAt: '2025-06-05T14:00:00Z' },
  { id: 'int_4', userId: 'usr_lucas', leadId: 'lead_9', type: 'message_received', message: 'Fala! Interessante, manda mais info.', direction: 'in', createdAt: '2025-06-09T11:00:00Z' },
  { id: 'int_5', userId: 'usr_lucas', leadId: 'lead_5', type: 'message_sent', message: 'Oi, Dr. Marcos! Vi que o senhor é especialista em implantodontia...', direction: 'out', createdAt: '2025-06-03T10:00:00Z' },
  { id: 'int_6', userId: 'usr_lucas', leadId: 'lead_5', type: 'deal_closed', message: 'Fechou pacote de 3 meses de gestão de tráfego.', direction: 'system', createdAt: '2025-06-10T09:00:00Z' },
];

// ADMIN LOGS
export const MOCK_ADMIN_LOGS = [
  { id: 'log_1', adminUserId: 'usr_admin', action: 'credit_adjustment', targetType: 'user', targetId: 'usr_lucas', metadataJson: { amount: -9, reason: 'Ajuste manual' }, createdAt: '2025-06-08T10:00:00Z' },
];

// ALL LEAD STATUSES
export const LEAD_STATUSES = [
  { value: 'novo', label: 'Novo', color: 'blue' },
  { value: 'contactado', label: 'Contactado', color: 'yellow' },
  { value: 'follow_up', label: 'Follow-up', color: 'yellow' },
  { value: 'respondeu', label: 'Respondeu', color: 'green' },
  { value: 'fechado', label: 'Fechado', color: 'green' },
  { value: 'perdido', label: 'Perdido', color: 'red' },
  { value: 'descartado', label: 'Descartado', color: 'gray' },
];

export const CAMPAIGN_STATUSES = [
  { value: 'ativa', label: 'Ativa' },
  { value: 'pausada', label: 'Pausada' },
  { value: 'finalizada', label: 'Finalizada' },
  { value: 'rascunho', label: 'Rascunho' },
];

export const TONES = [
  { value: 'direto', label: 'Direto' },
  { value: 'leve', label: 'Leve' },
  { value: 'consultivo', label: 'Consultivo' },
  { value: 'firme', label: 'Firme' },
  { value: 'premium', label: 'Premium' },
];

export const CHANNELS = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram Direct' },
  { value: 'email', label: 'Email' },
];

export const PERSONALIZATION_LEVELS = [
  { value: 'leve', label: 'Leve' },
  { value: 'normal', label: 'Normal' },
  { value: 'alta', label: 'Alta' },
];

export const MESSAGE_SIZES = [
  { value: 'curta', label: 'Curta' },
  { value: 'média', label: 'Média' },
  { value: 'completa', label: 'Completa' },
];
