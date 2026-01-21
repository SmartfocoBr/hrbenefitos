-- Create rate_limits table for edge function rate limiting
CREATE TABLE public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Rate limits are managed by service role via edge functions
-- No direct user access needed

-- Add explicit DENY policies for wallet_transactions immutability
CREATE POLICY "No one can update transactions"
  ON public.wallet_transactions FOR UPDATE
  USING (false);

CREATE POLICY "No one can delete transactions"
  ON public.wallet_transactions FOR DELETE
  USING (false);

-- Change trigger function to SECURITY INVOKER (best practice)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;