-- ==================================================
-- LODZ - Migration 002: Melhorias na tabela interactions
-- Adiciona event_type padronizado e metadata JSONB
-- Execute este arquivo no SQL Editor do Supabase
-- ==================================================

-- 1. Adicionar coluna event_type à tabela interactions (para eventos automáticos do sistema)
ALTER TABLE public.interactions
  ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'manual';

COMMENT ON COLUMN public.interactions.event_type IS
  'Tipo de evento: lead_created, message_copied, whatsapp_opened, status_changed, note_added, return_scheduled, manual';

-- 2. Adicionar coluna metadata JSONB para dados extras do evento
ALTER TABLE public.interactions
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

COMMENT ON COLUMN public.interactions.metadata IS
  'Dados adicionais do evento em JSON (ex: status anterior, motivo da perda, etc.)';

-- 3. Adicionar coluna loss_reason à tabela leads (motivo da perda)
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS loss_reason TEXT DEFAULT '';

COMMENT ON COLUMN public.leads.loss_reason IS
  'Motivo pelo qual o lead foi marcado como perdido';

-- 4. Atualizar a constraint de status para suportar novos valores do funil
-- (não há enum no banco, apenas TEXT — apenas adicionamos documentação)
COMMENT ON COLUMN public.leads.status IS
  'Status do funil: novo, contactado, follow_up, respondeu, qualificado, negociacao, fechado, perdido, descartado';

-- 5. Índice para busca de eventos por lead (performance)
CREATE INDEX IF NOT EXISTS idx_interactions_lead_event
  ON public.interactions(lead_id, event_type, created_at DESC);

-- 6. Índice para busca de leads por status e user (performance)
CREATE INDEX IF NOT EXISTS idx_leads_user_status
  ON public.leads(user_id, status);

-- 7. RLS: Garantir que interactions sempre filtra por user_id (segurança extra)
-- A política já existe da migration 001, mas vamos garantir que event_type não burle isso
-- As políticas RLS existentes já cobrem isso via user_id FK

-- Verificação: listar policies existentes para interactions (apenas para referência)
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'interactions';
