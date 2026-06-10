export function validateEmail(email) {
  if (!email) return 'Email é obrigatório';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) return 'Email inválido';
  return null;
}

export function validatePassword(password) {
  if (!password) return 'Senha é obrigatória';
  if (password.length < 6) return 'Senha deve ter no mínimo 6 caracteres';
  return null;
}

export function validateName(name) {
  if (!name) return 'Nome é obrigatório';
  if (name.trim().length < 2) return 'Nome deve ter no mínimo 2 caracteres';
  return null;
}

export function validateRequired(value, label = 'Campo') {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${label} é obrigatório`;
  }
  return null;
}

export function validatePhone(phone) {
  if (!phone) return null; // Optional
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 10 || cleaned.length > 11) return 'Telefone inválido';
  return null;
}
