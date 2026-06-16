export const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 67,
    includedCredits: 50,
    extraLeadPrice: 1.05,
    features: [
      '50 créditos / mês',
      '1 Campanha Ativa',
      'IA Especialista em Vendas: Básico',
      'Relatórios: Bloqueado',
      'Exportação CSV: Bloqueado',
    ],
    isActive: true,
  },
  {
    id: 'growth',
    name: 'Growth',
    monthlyPrice: 147,
    includedCredits: 120,
    extraLeadPrice: 0.83,
    discount: '21% off',
    features: [
      '120 créditos / mês',
      '3 Campanhas Ativas',
      'IA Especialista em Vendas: Tons de Voz',
      'Relatórios: Parcial',
      'Exportação CSV: Bloqueado',
    ],
    isActive: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 297,
    includedCredits: 300,
    extraLeadPrice: 0.64,
    discount: '39% off',
    popular: true,
    features: [
      '300 créditos / mês',
      '10 Campanhas Ativas',
      'IA Especialista em Vendas: Customizável',
      'Relatórios: Completos',
      'Exportação CSV: Liberado',
    ],
    isActive: true,
  },
  {
    id: 'agency',
    name: 'Agency',
    monthlyPrice: 597,
    includedCredits: 750,
    extraLeadPrice: 0.49,
    discount: '60% off',
    features: [
      '750 créditos / mês',
      'Campanhas Ilimitadas',
      'IA Especialista em Vendas: VIP',
      'Tudo Liberado',
      'Gerente de Contas',
    ],
    isActive: true,
  }
];

export const EXTRA_PACKS = [
  {
    id: 'booster',
    name: 'Booster',
    price: 37,
    leads: 35,
    pricePerLead: 1.06,
    requiredPlan: 'starter',
    description: 'Ideal para testar campanhas',
  },
  {
    id: 'sdr-junior',
    name: 'SDR Júnior',
    price: 67,
    leads: 80,
    pricePerLead: 0.84,
    requiredPlan: 'growth',
    description: 'Para quem quer escalar',
  },
  {
    id: 'maquina-vendas',
    name: 'Máquina de Vendas',
    price: 97,
    leads: 150,
    pricePerLead: 0.65,
    requiredPlan: 'pro',
    popular: true,
    description: 'Mais popular entre os SDRs',
  },
  {
    id: 'escala-total',
    name: 'Escala Total',
    price: 197,
    leads: 400,
    pricePerLead: 0.49,
    requiredPlan: 'agency',
    description: 'Para agências e times',
  }
];

export const PLAN_HIERARCHY = ['starter', 'growth', 'pro', 'agency'];

export function canAccessPack(userPlanId, requiredPlanId) {
  const userIndex = PLAN_HIERARCHY.indexOf(userPlanId);
  const requiredIndex = PLAN_HIERARCHY.indexOf(requiredPlanId);
  return userIndex >= requiredIndex;
}

export function getPlanById(planId) {
  return PLANS.find(p => p.id === planId);
}
