// ==================================================
// LODZ Credit Engine
// ==================================================

export function canConsumeCredits(user, amount = 1) {
  if (user.role === 'admin') return { allowed: true, reason: 'admin' };

  const available = (user.creditWallet?.baseCredits || 0) + (user.creditWallet?.purchasedCredits || 0);
  if (available < amount) {
    return {
      allowed: false,
      reason: 'insufficient',
      available,
      required: amount,
    };
  }

  return { allowed: true, available };
}

export function consumeCredits(user, amount = 1) {
  if (user.role === 'admin') {
    return {
      success: true,
      consumed: 0,
      message: 'Acesso administrador: sem consumo de créditos.',
      wallet: user.creditWallet,
      transaction: null,
    };
  }

  const wallet = { ...user.creditWallet };
  let remaining = amount;

  // Consume base credits first
  const fromBase = Math.min(remaining, wallet.baseCredits);
  wallet.baseCredits -= fromBase;
  remaining -= fromBase;

  // Then consume purchased credits
  if (remaining > 0) {
    const fromPurchased = Math.min(remaining, wallet.purchasedCredits);
    wallet.purchasedCredits -= fromPurchased;
    remaining -= fromPurchased;
  }

  if (remaining > 0) {
    return {
      success: false,
      consumed: 0,
      message: 'Créditos insuficientes.',
      wallet: user.creditWallet,
    };
  }

  const balanceBefore = (user.creditWallet.baseCredits + user.creditWallet.purchasedCredits);
  const balanceAfter = wallet.baseCredits + wallet.purchasedCredits;

  const transaction = {
    id: 'txn_' + Date.now(),
    userId: user.id,
    type: 'lead_generation',
    amount: -amount,
    balanceBefore,
    balanceAfter,
    reason: `Geração de ${amount} lead(s)`,
    createdAt: new Date().toISOString(),
  };

  return {
    success: true,
    consumed: amount,
    message: `${amount} crédito(s) consumido(s).`,
    wallet,
    transaction,
  };
}

export function addCredits(wallet, amount, type = 'extra_purchase') {
  const newWallet = { ...wallet };
  const balanceBefore = newWallet.baseCredits + newWallet.purchasedCredits;

  if (type === 'plan_renewal') {
    newWallet.baseCredits += amount;
  } else {
    newWallet.purchasedCredits += amount;
  }

  const balanceAfter = newWallet.baseCredits + newWallet.purchasedCredits;

  const transaction = {
    id: 'txn_' + Date.now(),
    type,
    amount: amount,
    balanceBefore,
    balanceAfter,
    reason: type === 'plan_renewal' ? 'Renovação do plano' : `Compra de ${amount} créditos`,
    createdAt: new Date().toISOString(),
  };

  return { wallet: newWallet, transaction };
}

export function getTotalCredits(wallet) {
  if (!wallet) return 0;
  return (wallet.baseCredits || 0) + (wallet.purchasedCredits || 0);
}
