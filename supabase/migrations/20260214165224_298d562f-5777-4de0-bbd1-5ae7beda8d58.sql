
-- 1. create_supplier_instruction: insert a new instruction row
CREATE OR REPLACE FUNCTION public.create_supplier_instruction(
  p_supplier_id uuid,
  p_tenant_id uuid,
  p_transaction_id uuid DEFAULT NULL,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.supplier_instructions (supplier_id, tenant_id, transaction_id, payload, status)
  VALUES (p_supplier_id, p_tenant_id, p_transaction_id, p_payload, 'pending')
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- 2. mark_instruction_result: update status and response, optionally audit
CREATE OR REPLACE FUNCTION public.mark_instruction_result(
  p_instruction_id uuid,
  p_status text,
  p_response jsonb DEFAULT NULL,
  p_provider_tx_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_instr RECORD;
BEGIN
  SELECT * INTO v_instr
  FROM public.supplier_instructions
  WHERE id = p_instruction_id
  FOR UPDATE;

  IF v_instr IS NULL THEN
    RAISE EXCEPTION 'Instruction % not found', p_instruction_id;
  END IF;

  UPDATE public.supplier_instructions
  SET status = p_status,
      provider_response = COALESCE(p_response, provider_response),
      provider_tx_id = COALESCE(p_provider_tx_id, provider_tx_id),
      processed_at = now()
  WHERE id = p_instruction_id;
END;
$$;

-- 3. generate_reconciliation: aggregate and insert reconciliation record
CREATE OR REPLACE FUNCTION public.generate_reconciliation(
  p_tenant_id uuid,
  p_supplier_id uuid,
  p_period_start date,
  p_period_end date,
  p_generated_by uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total INT;
  v_completed INT;
  v_failed INT;
  v_pending INT;
  v_errors INT;
  v_total_amount NUMERIC(14,2) := 0;
  v_supplier_balance NUMERIC;
  v_balance_at TIMESTAMPTZ;
  v_report JSONB;
  v_recon_id UUID;
BEGIN
  -- Count instructions by status within period (using timezone-aware boundaries)
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'failed'),
    COUNT(*) FILTER (WHERE status IN ('pending', 'processing')),
    COUNT(*) FILTER (WHERE status = 'error')
  INTO v_total, v_completed, v_failed, v_pending, v_errors
  FROM public.supplier_instructions
  WHERE supplier_id = p_supplier_id
    AND tenant_id = p_tenant_id
    AND created_at >= p_period_start::timestamptz
    AND created_at < (p_period_end + 1)::timestamptz;

  -- Sum linked ledger amounts
  SELECT COALESCE(SUM(wl.amount), 0) INTO v_total_amount
  FROM public.supplier_instructions si
  JOIN public.wallet_ledger wl ON wl.id = si.transaction_id
  WHERE si.supplier_id = p_supplier_id
    AND si.tenant_id = p_tenant_id
    AND si.created_at >= p_period_start::timestamptz
    AND si.created_at < (p_period_end + 1)::timestamptz
    AND si.transaction_id IS NOT NULL;

  -- Get latest supplier balance
  SELECT reported_balance, last_reported_at
  INTO v_supplier_balance, v_balance_at
  FROM public.supplier_balances
  WHERE supplier_id = p_supplier_id
  ORDER BY last_reported_at DESC NULLS LAST
  LIMIT 1;

  v_report := jsonb_build_object(
    'period', jsonb_build_object('start', p_period_start, 'end', p_period_end),
    'summary', jsonb_build_object(
      'total_instructions', v_total,
      'completed', v_completed,
      'failed', v_failed,
      'pending', v_pending,
      'errors', v_errors,
      'total_transaction_amount', v_total_amount,
      'supplier_reported_balance', v_supplier_balance,
      'balance_last_reported', v_balance_at,
      'discrepancy', CASE WHEN v_supplier_balance IS NOT NULL THEN v_total_amount - v_supplier_balance ELSE NULL END
    ),
    'generated_at', now()
  );

  INSERT INTO public.reconciliations (tenant_id, supplier_id, period_start, period_end, generated_by, report)
  VALUES (p_tenant_id, p_supplier_id, p_period_start, p_period_end, p_generated_by, v_report)
  RETURNING id INTO v_recon_id;

  RETURN v_recon_id;
END;
$$;

-- 4. categorize_supplier_error: lookup error map
CREATE OR REPLACE FUNCTION public.categorize_supplier_error(
  p_supplier_id uuid,
  p_external_code text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result RECORD;
BEGIN
  SELECT category, recommended_action
  INTO v_result
  FROM public.supplier_error_map
  WHERE supplier_id = p_supplier_id
    AND external_code = p_external_code;

  IF v_result IS NULL THEN
    RETURN jsonb_build_object(
      'category', 'unknown',
      'recommended_action', jsonb_build_object('action', 'manual_review', 'description', 'Unmapped error code'),
      'is_transient', false,
      'should_retry', false
    );
  END IF;

  RETURN jsonb_build_object(
    'category', v_result.category,
    'recommended_action', v_result.recommended_action,
    'is_transient', v_result.category = 'transient',
    'should_retry', v_result.category = 'transient'
  );
END;
$$;
