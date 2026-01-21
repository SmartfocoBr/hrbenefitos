-- Add explicit DENY policy to rate_limits table for defense-in-depth
-- This table is accessed only by service role from edge functions
CREATE POLICY "Deny all access - service role only"
  ON public.rate_limits
  FOR ALL
  USING (false)
  WITH CHECK (false);