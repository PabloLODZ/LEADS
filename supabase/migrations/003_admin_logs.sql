-- ============================================================================
-- LODZ - Migration 003: Admin Logs, Bloqueio de Usuário, Campos extras
-- Execute no Supabase SQL Editor
-- ============================================================================

-- 1. Tabela de logs administrativos
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  previous_value JSONB DEFAULT '{}',
  new_value JSONB DEFAULT '{}',
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.admin_logs IS 'Auditoria de ações administrativas: ajuste de créditos, alteração de plano, bloqueio, etc.';
COMMENT ON COLUMN public.admin_logs.action IS 'Tipo da ação: add_credits, remove_credits, change_plan, block_user, unblock_user, change_role.';
COMMENT ON COLUMN public.admin_logs.previous_value IS 'Valor anterior antes da alteração (JSON).';
COMMENT ON COLUMN public.admin_logs.new_value IS 'Novo valor após a alteração (JSON).';

-- 2. Adicionar campo is_blocked em profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.profiles.is_blocked IS 'Indica se o usuário está bloqueado de usar o sistema.';

-- 3. Adicionar campo blocked_reason em profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS blocked_reason TEXT DEFAULT '';

COMMENT ON COLUMN public.profiles.blocked_reason IS 'Motivo pelo qual o usuário foi bloqueado.';

-- 4. Adicionar campo last_seen_at em profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.last_seen_at IS 'Data/hora do último acesso do usuário.';

-- 5. Adicionar description na credit_transactions (mais amigável que reason)
ALTER TABLE public.credit_transactions
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- 6. RLS para admin_logs: apenas admins via service_role podem inserir/ver
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on admin_logs" ON public.admin_logs;
CREATE POLICY "Service role full access on admin_logs"
  ON public.admin_logs FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Admins podem ler (para auditoria no painel admin)
DROP POLICY IF EXISTS "Admins podem ver logs" ON public.admin_logs;
CREATE POLICY "Admins podem ver logs"
  ON public.admin_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Admins podem inserir logs
DROP POLICY IF EXISTS "Admins podem criar logs" ON public.admin_logs;
CREATE POLICY "Admins podem criar logs"
  ON public.admin_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- 7. Índices de performance
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON public.admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target_user_id ON public.admin_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_is_blocked ON public.profiles(is_blocked);

-- ============================================================================
-- FIM DA MIGRATION 003
-- ============================================================================
