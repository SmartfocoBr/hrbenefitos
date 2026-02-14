
-- 1. chat_sessions
CREATE TABLE public.chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.companies(id),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'open',
  metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon access to chat_sessions" ON public.chat_sessions AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "Users can view own sessions" ON public.chat_sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own sessions" ON public.chat_sessions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own sessions" ON public.chat_sessions FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Company admins can view tenant sessions" ON public.chat_sessions FOR SELECT USING (is_company_admin(tenant_id));

-- 2. chat_messages
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL DEFAULT 'user',
  sender_id UUID,
  content TEXT NOT NULL,
  embeddings JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_messages_session_created ON public.chat_messages(session_id, created_at);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon access to chat_messages" ON public.chat_messages AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "Users can view own session messages" ON public.chat_messages FOR SELECT
  USING (session_id IN (SELECT id FROM public.chat_sessions WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert into own sessions" ON public.chat_messages FOR INSERT
  WITH CHECK (session_id IN (SELECT id FROM public.chat_sessions WHERE user_id = auth.uid()));
CREATE POLICY "Admins can view tenant messages" ON public.chat_messages FOR SELECT
  USING (session_id IN (SELECT cs.id FROM public.chat_sessions cs WHERE is_company_admin(cs.tenant_id)));
CREATE POLICY "Deny client updates to chat_messages" ON public.chat_messages AS RESTRICTIVE FOR UPDATE USING (false);
CREATE POLICY "Deny client deletes to chat_messages" ON public.chat_messages AS RESTRICTIVE FOR DELETE USING (false);

-- 3. kb_articles
CREATE TABLE public.kb_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.companies(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  related_policy_id UUID REFERENCES public.policies(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_kb_articles_content_fts ON public.kb_articles USING GIN (to_tsvector('portuguese', content));

ALTER TABLE public.kb_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon access to kb_articles" ON public.kb_articles AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "Tenant members can view kb_articles" ON public.kb_articles FOR SELECT
  USING (tenant_id IN (SELECT ur.company_id FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.company_id IS NOT NULL));
CREATE POLICY "Admins can manage kb_articles" ON public.kb_articles FOR ALL
  USING (is_company_admin(tenant_id)) WITH CHECK (is_company_admin(tenant_id));

CREATE TRIGGER update_kb_articles_updated_at BEFORE UPDATE ON public.kb_articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. chat_escalations
CREATE TABLE public.chat_escalations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  ticket_id TEXT,
  assigned_to UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_escalations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon access to chat_escalations" ON public.chat_escalations AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "Users can view own escalations" ON public.chat_escalations FOR SELECT
  USING (session_id IN (SELECT id FROM public.chat_sessions WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage escalations" ON public.chat_escalations FOR ALL
  USING (session_id IN (SELECT cs.id FROM public.chat_sessions cs WHERE is_company_admin(cs.tenant_id)))
  WITH CHECK (session_id IN (SELECT cs.id FROM public.chat_sessions cs WHERE is_company_admin(cs.tenant_id)));
