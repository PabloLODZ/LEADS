export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatRelativeDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Agora';
  if (minutes < 60) return `${minutes}min atrás`;
  if (hours < 24) return `${hours}h atrás`;
  if (days < 7) return `${days}d atrás`;
  return formatDate(dateStr);
}

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'BOM DIA';
  if (hour < 18) return 'BOA TARDE';
  return 'BOA NOITE';
}

export function getDayOfWeekFull() {
  const days = ['DOMINGO', 'SEGUNDA-FEIRA', 'TERÇA-FEIRA', 'QUARTA-FEIRA', 'QUINTA-FEIRA', 'SEXTA-FEIRA', 'SÁBADO'];
  return days[new Date().getDay()];
}

export function getFormattedToday() {
  const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  const now = new Date();
  return `${now.getDate()} DE ${months[now.getMonth()]}.`;
}

export function truncate(str, maxLength = 50) {
  if (!str) return '';
  return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
}

export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export function getScoreClass(score) {
  if (score >= 80) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

export function getStatusColor(status) {
  const map = {
    'novo': 'blue',
    'contactado': 'yellow',
    'respondeu': 'green',
    'negociacao': 'purple',
    'fechado': 'green',
    'perdido': 'red',
    'descartado': 'gray',
    'ativa': 'green',
    'pausada': 'yellow',
    'finalizada': 'gray',
    'rascunho': 'gray',
    'ativo': 'green',
    'trial': 'blue',
    'inativo': 'red',
    'cancelado': 'red',
    'pendente': 'yellow',
    'aprovado': 'green',
    'recusado': 'red',
    'lido': 'blue',
    'resolvido': 'green',
  };
  return map[status] || 'gray';
}

export function getStatusLabel(status) {
  const map = {
    'novo': 'Novo',
    'contactado': 'Contactado',
    'respondeu': 'Respondeu',
    'negociacao': 'Em Negociação',
    'fechado': 'Fechado',
    'perdido': 'Perdido',
    'descartado': 'Descartado',
    'ativa': 'Ativa',
    'pausada': 'Pausada',
    'finalizada': 'Finalizada',
    'rascunho': 'Rascunho',
  };
  return map[status] || status;
}

// All lead statuses in funnel order
export const LEAD_STATUSES = [
  { value: 'novo', label: 'Novo', color: 'blue' },
  { value: 'contactado', label: 'Contactado', color: 'yellow' },
  { value: 'respondeu', label: 'Respondeu', color: 'green' },
  { value: 'negociacao', label: 'Em Negociação', color: 'purple' },
  { value: 'fechado', label: 'Fechado', color: 'green' },
  { value: 'perdido', label: 'Perdido', color: 'red' },
];

// Loss reason options
export const LOSS_REASONS = [
  'Preço alto',
  'Sem interesse no momento',
  'Não respondeu mais',
  'Escolheu concorrente',
  'Sem budget',
  'Negócio encerrado',
  'Outro',
];
