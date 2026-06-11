-- ============================================================================
-- LEADS Platform - Migration Inicial do Banco de Dados
-- Arquivo: 001_initial_schema.sql
-- Descrição: Criação completa do schema inicial com tabelas, RLS, triggers e índices.
-- Executar no Supabase SQL Editor.
-- ============================================================================

-- ============================================================================
-- EXTENSÕES
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- FUNÇÃO AUXILIAR: Atualização automática do campo updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TABELA: profiles
-- Perfil do usuário, criado automaticamente ao registrar via auth.users.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'trial')),
  plan_id TEXT DEFAULT 'starter',
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'past_due')),
  stripe_customer_id TEXT UNIQUE,
  whatsapp_phone TEXT DEFAULT '',
  whatsapp_reminders_enabled BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  base_credits INTEGER DEFAULT 50,
  purchased_credits INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'Perfis dos usuários da plataforma LEADS.';
COMMENT ON COLUMN public.profiles.role IS 'Papel do usuário: user, admin ou trial.';
COMMENT ON COLUMN public.profiles.plan_id IS 'Identificador do plano contratado (ex: starter, pro, business).';
COMMENT ON COLUMN public.profiles.subscription_status IS 'Status da assinatura: trial, active, cancelled ou past_due.';
COMMENT ON COLUMN public.profiles.base_credits IS 'Créditos base inclusos no plano do usuário.';
COMMENT ON COLUMN public.profiles.purchased_credits IS 'Créditos comprados avulsos pelo usuário.';

-- ============================================================================
-- TABELA: campaigns
-- Campanhas de prospecção criadas pelo usuário.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  offer TEXT DEFAULT '',
  segment TEXT DEFAULT '',
  location TEXT DEFAULT '',
  keywords TEXT[] DEFAULT '{}',
  tone TEXT DEFAULT 'consultivo',
  channel TEXT DEFAULT 'whatsapp',
  personalization_level TEXT DEFAULT 'normal',
  generated_leads INTEGER DEFAULT 0,
  contacted_leads INTEGER DEFAULT 0,
  responded_leads INTEGER DEFAULT 0,
  closed_leads INTEGER DEFAULT 0,
  status TEXT DEFAULT 'ativa',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.campaigns IS 'Campanhas de prospecção de leads.';
COMMENT ON COLUMN public.campaigns.tone IS 'Tom das mensagens: consultivo, direto, leve, etc.';
COMMENT ON COLUMN public.campaigns.channel IS 'Canal principal da campanha: whatsapp, instagram, email.';
COMMENT ON COLUMN public.campaigns.personalization_level IS 'Nível de personalização das mensagens geradas.';

-- ============================================================================
-- TABELA: leads
-- Leads prospectados e suas informações de contato e personalização.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  username TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  whatsapp_url TEXT DEFAULT '',
  instagram_url TEXT DEFAULT '',
  website TEXT DEFAULT '',
  city TEXT DEFAULT '',
  state TEXT DEFAULT '',
  source TEXT DEFAULT 'google_maps',
  score INTEGER DEFAULT 50,
  status TEXT DEFAULT 'novo',
  segment TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  google_place_id TEXT,
  google_rating NUMERIC,
  google_reviews_count INTEGER,
  personalized_message TEXT DEFAULT '',
  message_direct TEXT DEFAULT '',
  message_consultative TEXT DEFAULT '',
  message_light TEXT DEFAULT '',
  personalization_reason TEXT DEFAULT '',
  icebreaker TEXT DEFAULT '',
  custom_cta TEXT DEFAULT '',
  detected_pain_points TEXT[] DEFAULT '{}',
  detected_opportunities TEXT[] DEFAULT '{}',
  first_message TEXT DEFAULT '',
  last_message TEXT DEFAULT '',
  last_interaction_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.leads IS 'Leads prospectados com dados de contato e mensagens personalizadas.';
COMMENT ON COLUMN public.leads.source IS 'Origem do lead: google_maps, instagram, manual, etc.';
COMMENT ON COLUMN public.leads.score IS 'Pontuação de qualificação do lead (0-100).';
COMMENT ON COLUMN public.leads.status IS 'Status do lead no funil: novo, contatado, respondido, fechado, etc.';
COMMENT ON COLUMN public.leads.detected_pain_points IS 'Pontos de dor identificados pela IA.';
COMMENT ON COLUMN public.leads.detected_opportunities IS 'Oportunidades identificadas pela IA.';

-- ============================================================================
-- TABELA: interactions
-- Histórico de interações entre o usuário e seus leads.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT DEFAULT '',
  direction TEXT DEFAULT 'out',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.interactions IS 'Registro de interações (mensagens, ligações, etc.) com leads.';
COMMENT ON COLUMN public.interactions.type IS 'Tipo da interação: whatsapp, instagram, email, ligação, nota.';
COMMENT ON COLUMN public.interactions.direction IS 'Direção da interação: out (enviada) ou in (recebida).';

-- ============================================================================
-- TABELA: credit_transactions
-- Histórico de movimentações de créditos do usuário.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  balance_before INTEGER DEFAULT 0,
  balance_after INTEGER DEFAULT 0,
  reason TEXT DEFAULT '',
  payment_id UUID,
  created_by_admin_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.credit_transactions IS 'Histórico de transações de créditos (consumo, compra, bônus, etc.).';
COMMENT ON COLUMN public.credit_transactions.type IS 'Tipo da transação: consumo, compra, bonus, ajuste_admin.';
COMMENT ON COLUMN public.credit_transactions.amount IS 'Quantidade de créditos (positivo = entrada, negativo = saída).';

-- ============================================================================
-- TABELA: payments
-- Registro de pagamentos realizados pelo usuário.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pendente',
  provider TEXT DEFAULT 'stripe',
  stripe_payment_id TEXT,
  stripe_session_id TEXT,
  product_type TEXT,
  credits_purchased INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.payments IS 'Pagamentos processados via Stripe ou outros provedores.';
COMMENT ON COLUMN public.payments.status IS 'Status do pagamento: pendente, aprovado, recusado, reembolsado.';
COMMENT ON COLUMN public.payments.product_type IS 'Tipo do produto: plano, creditos_avulsos, etc.';

-- ============================================================================
-- TABELA: feedbacks
-- Feedbacks e sugestões enviados pelos usuários.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'novo',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.feedbacks IS 'Feedbacks, sugestões e reportes de bugs dos usuários.';
COMMENT ON COLUMN public.feedbacks.type IS 'Tipo do feedback: sugestao, bug, elogio, reclamacao.';
COMMENT ON COLUMN public.feedbacks.status IS 'Status do feedback: novo, em_analise, resolvido.';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Habilita RLS em todas as tabelas e cria políticas de acesso.
-- ============================================================================

-- ---------- profiles ----------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários podem criar seu próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem criar seu próprio perfil"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Service role full access on profiles" ON public.profiles;
CREATE POLICY "Service role full access on profiles"
  ON public.profiles FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ---------- campaigns ----------
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver suas campanhas" ON public.campaigns;
CREATE POLICY "Usuários podem ver suas campanhas"
  ON public.campaigns FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem criar campanhas" ON public.campaigns;
CREATE POLICY "Usuários podem criar campanhas"
  ON public.campaigns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar suas campanhas" ON public.campaigns;
CREATE POLICY "Usuários podem atualizar suas campanhas"
  ON public.campaigns FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar suas campanhas" ON public.campaigns;
CREATE POLICY "Usuários podem deletar suas campanhas"
  ON public.campaigns FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access on campaigns" ON public.campaigns;
CREATE POLICY "Service role full access on campaigns"
  ON public.campaigns FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ---------- leads ----------
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver seus leads" ON public.leads;
CREATE POLICY "Usuários podem ver seus leads"
  ON public.leads FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem criar leads" ON public.leads;
CREATE POLICY "Usuários podem criar leads"
  ON public.leads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar seus leads" ON public.leads;
CREATE POLICY "Usuários podem atualizar seus leads"
  ON public.leads FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar seus leads" ON public.leads;
CREATE POLICY "Usuários podem deletar seus leads"
  ON public.leads FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access on leads" ON public.leads;
CREATE POLICY "Service role full access on leads"
  ON public.leads FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ---------- interactions ----------
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver suas interações" ON public.interactions;
CREATE POLICY "Usuários podem ver suas interações"
  ON public.interactions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem criar interações" ON public.interactions;
CREATE POLICY "Usuários podem criar interações"
  ON public.interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar suas interações" ON public.interactions;
CREATE POLICY "Usuários podem atualizar suas interações"
  ON public.interactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar suas interações" ON public.interactions;
CREATE POLICY "Usuários podem deletar suas interações"
  ON public.interactions FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access on interactions" ON public.interactions;
CREATE POLICY "Service role full access on interactions"
  ON public.interactions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ---------- credit_transactions ----------
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver suas transações de crédito" ON public.credit_transactions;
CREATE POLICY "Usuários podem ver suas transações de crédito"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem criar transações de crédito" ON public.credit_transactions;
CREATE POLICY "Usuários podem criar transações de crédito"
  ON public.credit_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar suas transações de crédito" ON public.credit_transactions;
CREATE POLICY "Usuários podem atualizar suas transações de crédito"
  ON public.credit_transactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar suas transações de crédito" ON public.credit_transactions;
CREATE POLICY "Usuários podem deletar suas transações de crédito"
  ON public.credit_transactions FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access on credit_transactions" ON public.credit_transactions;
CREATE POLICY "Service role full access on credit_transactions"
  ON public.credit_transactions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ---------- payments ----------
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver seus pagamentos" ON public.payments;
CREATE POLICY "Usuários podem ver seus pagamentos"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem criar pagamentos" ON public.payments;
CREATE POLICY "Usuários podem criar pagamentos"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar seus pagamentos" ON public.payments;
CREATE POLICY "Usuários podem atualizar seus pagamentos"
  ON public.payments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar seus pagamentos" ON public.payments;
CREATE POLICY "Usuários podem deletar seus pagamentos"
  ON public.payments FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access on payments" ON public.payments;
CREATE POLICY "Service role full access on payments"
  ON public.payments FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ---------- feedbacks ----------
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver seus feedbacks" ON public.feedbacks;
CREATE POLICY "Usuários podem ver seus feedbacks"
  ON public.feedbacks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem criar feedbacks" ON public.feedbacks;
CREATE POLICY "Usuários podem criar feedbacks"
  ON public.feedbacks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar seus feedbacks" ON public.feedbacks;
CREATE POLICY "Usuários podem atualizar seus feedbacks"
  ON public.feedbacks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar seus feedbacks" ON public.feedbacks;
CREATE POLICY "Usuários podem deletar seus feedbacks"
  ON public.feedbacks FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access on feedbacks" ON public.feedbacks;
CREATE POLICY "Service role full access on feedbacks"
  ON public.feedbacks FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- ---------- 1. Criação automática de perfil ao registrar novo usuário ----------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, plan_id, subscription_status, base_credits)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    'trial',
    'starter',
    'trial',
    50
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove trigger anterior caso exista para garantir idempotência
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------- 2. Atualização automática do campo updated_at ----------

-- profiles
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- campaigns
DROP TRIGGER IF EXISTS trigger_campaigns_updated_at ON public.campaigns;
CREATE TRIGGER trigger_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- leads
DROP TRIGGER IF EXISTS trigger_leads_updated_at ON public.leads;
CREATE TRIGGER trigger_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- ÍNDICES
-- Melhoria de performance para consultas frequentes.
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON public.campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON public.leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_interactions_lead_id ON public.interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id ON public.feedbacks(user_id);

-- ============================================================================
-- FIM DA MIGRATION INICIAL
-- ============================================================================
