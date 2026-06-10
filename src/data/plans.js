export const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 67,
    includedCredits: 50,
    extraLeadPrice: 1.05,
    features: [
      '50 créditos inclusos',
      'Campanhas ilimitadas',
      'CRM completo',
      'Assistente Sócio',
      'Exportação CSV',
      'Suporte por email'
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
      '120 créditos inclusos',
      'Tudo do Starter',
      'Lead extra a R$ 0,83',
      'Pacotes SDR Júnior',
      'Suporte prioritário'
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
      '300 créditos inclusos',
      'Tudo do Growth',
      'Lead extra a R$ 0,64',
      'Pacotes Máquina de Vendas',
      'Suporte dedicado'
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
      '750 créditos inclusos',
      'Tudo do Pro',
      'Lead extra a R$ 0,49',
      'Pacotes Escala Total',
      'Gerente de contas dedicado'
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
