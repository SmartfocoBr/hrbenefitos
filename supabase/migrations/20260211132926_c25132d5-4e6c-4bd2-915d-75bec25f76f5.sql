
-- Task 27: Wallet DB Functions (simulate, apply, finalize)

-------------------------------------------------------
-- 1. simulate_allocation
-------------------------------------------------------
CREATE OR REPLACE FUNCTION public.simulate_allocation(
  p_wallet_id UUID,
  p_allocation_json JSONB,
  p_context JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_wallet RECORD;
  v_balance RECORD;
  v_alloc JSONB;
  v_item JSONB;
  v_category TEXT;
  v_amount NUMERIC(14,2);
  v_total_requested NUMERIC(14,2) := 0;
  v_total_tax NUMERIC(14,2) := 0;
  v_breakdown JSONB := '[]'::jsonb;
  v_limit_rec RECORD;
  v_max_amount NUMERIC(14,2);
  v_violations JSONB := '[]'::jsonb;
  v_tax_pct NUMERIC;
  v_tax_amount NUMERIC(14,2);
  v_net_amount NUMERIC(14,2);
  v_policy_id UUID;
BEGIN
  -- Load wallet
  SELECT w.*, wb.available_amount, wb.reserved_amount, wb.amount, wb.currency, wb.id AS balance_id
  INTO v_wallet
  FROM wallets w
  JOIN wallet_balances wb ON wb.wallet_id = w.id
  WHERE w.id = p_wallet_id
    AND (wb.valid_to IS NULL OR wb.valid_to >= CURRENT_DATE)
    AND wb.valid_from <= CURRENT_DATE
  ORDER BY wb.created_at DESC
  LIMIT 1;

  IF v_wallet IS NULL THEN
    RETURN jsonb_build_object('error', 'Wallet or active balance not found', 'valid', false);
  END IF;

  v_policy_id := (p_context ->> 'policy_id')::uuid;

  -- Iterate allocation items
  IF jsonb_typeof(p_allocation_json) = 'array' THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_allocation_json)
    LOOP
      v_category := v_item ->> 'category';
      v_amount := (v_item ->> 'amount')::numeric(14,2);
      v_tax_pct := COALESCE((v_item ->> 'tax_percentage')::numeric, 0);

      v_total_requested := v_total_requested + v_amount;
      v_tax_amount := ROUND(v_amount * v_tax_pct / 100, 2);
      v_net_amount := v_amount - v_tax_amount;
      v_total_tax := v_total_tax + v_tax_amount;

      -- Check allocation_limits if policy provided
      IF v_policy_id IS NOT NULL THEN
        SELECT al.max_amount INTO v_max_amount
        FROM allocation_limits al
        WHERE al.policy_id = v_policy_id
          AND (al.role IS NULL OR al.role = COALESCE(p_context ->> 'role', ''))
          AND (al.cost_center IS NULL OR al.cost_center = COALESCE(p_context ->> 'cost_center', ''))
        ORDER BY al.max_amount ASC
        LIMIT 1;

        IF v_max_amount IS NOT NULL AND v_amount > v_max_amount THEN
          v_violations := v_violations || jsonb_build_array(
            jsonb_build_object(
              'category', v_category,
              'requested', v_amount,
              'max_allowed', v_max_amount,
              'message', format('Amount %s exceeds limit %s for category %s', v_amount, v_max_amount, v_category)
            )
          );
        END IF;
      END IF;

      v_breakdown := v_breakdown || jsonb_build_array(
        jsonb_build_object(
          'category', v_category,
          'amount', v_amount,
          'tax_percentage', v_tax_pct,
          'tax_amount', v_tax_amount,
          'net_amount', v_net_amount
        )
      );
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'valid', jsonb_array_length(v_violations) = 0 AND v_total_requested <= v_wallet.available_amount,
    'wallet_id', p_wallet_id,
    'currency', v_wallet.currency,
    'available_before', v_wallet.available_amount,
    'total_requested', v_total_requested,
    'total_tax', v_total_tax,
    'total_net', v_total_requested - v_total_tax,
    'remaining_after', v_wallet.available_amount - v_total_requested,
    'breakdown', v_breakdown,
    'violations', v_violations,
    'insufficient_funds', v_total_requested > v_wallet.available_amount,
    'simulated_at', now()
  );
END;
$$;

-------------------------------------------------------
-- 2. apply_allocation
-------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_allocation(
  p_wallet_id UUID,
  p_employee_id UUID,
  p_allocation_json JSONB,
  p_policy_id UUID DEFAULT NULL,
  p_actor UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_balance RECORD;
  v_total NUMERIC(14,2) := 0;
  v_item JSONB;
  v_tx_id UUID;
BEGIN
  -- Lock the active balance row for concurrency safety
  SELECT wb.*
  INTO v_balance
  FROM wallet_balances wb
  WHERE wb.wallet_id = p_wallet_id
    AND wb.valid_from <= CURRENT_DATE
    AND (wb.valid_to IS NULL OR wb.valid_to >= CURRENT_DATE)
  ORDER BY wb.created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'No active balance found for wallet %', p_wallet_id;
  END IF;

  -- Calculate total
  IF jsonb_typeof(p_allocation_json) = 'array' THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_allocation_json)
    LOOP
      v_total := v_total + (v_item ->> 'amount')::numeric(14,2);
    END LOOP;
  ELSE
    v_total := (p_allocation_json ->> 'amount')::numeric(14,2);
  END IF;

  -- Validate sufficient funds
  IF v_total > v_balance.available_amount THEN
    RAISE EXCEPTION 'Insufficient available balance: requested %, available %', v_total, v_balance.available_amount;
  END IF;

  -- Deduct available, increase reserved
  UPDATE wallet_balances
  SET available_amount = available_amount - v_total,
      reserved_amount = reserved_amount + v_total,
      updated_at = now()
  WHERE id = v_balance.id;

  -- Create ledger transaction
  INSERT INTO wallet_ledger (wallet_id, employee_id, amount, type, status, metadata)
  VALUES (
    p_wallet_id,
    p_employee_id,
    v_total,
    'allocation',
    'pending',
    jsonb_build_object('actor', p_actor, 'policy_id', p_policy_id)
  )
  RETURNING id INTO v_tx_id;

  -- Create allocation record
  INSERT INTO ledger_allocations (transaction_id, policy_id, allocation_json)
  VALUES (v_tx_id, p_policy_id, p_allocation_json);

  RETURN v_tx_id;
END;
$$;

-------------------------------------------------------
-- 3. finalize_transaction
-------------------------------------------------------
CREATE OR REPLACE FUNCTION public.finalize_transaction(
  p_transaction_id UUID,
  p_provider_tx_id TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'completed'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tx RECORD;
  v_balance RECORD;
BEGIN
  -- Lock the transaction row
  SELECT * INTO v_tx
  FROM wallet_ledger
  WHERE id = p_transaction_id
  FOR UPDATE;

  IF v_tx IS NULL THEN
    RAISE EXCEPTION 'Transaction % not found', p_transaction_id;
  END IF;

  IF v_tx.status != 'pending' THEN
    RAISE EXCEPTION 'Transaction % is not pending (current: %)', p_transaction_id, v_tx.status;
  END IF;

  -- Lock the balance row
  SELECT wb.* INTO v_balance
  FROM wallet_balances wb
  WHERE wb.wallet_id = v_tx.wallet_id
    AND wb.valid_from <= CURRENT_DATE
    AND (wb.valid_to IS NULL OR wb.valid_to >= CURRENT_DATE)
  ORDER BY wb.created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'No active balance for wallet %', v_tx.wallet_id;
  END IF;

  IF p_status = 'completed' THEN
    -- Success: release reserved, deduct from total amount
    UPDATE wallet_balances
    SET reserved_amount = reserved_amount - v_tx.amount,
        amount = amount - v_tx.amount,
        updated_at = now()
    WHERE id = v_balance.id;

    UPDATE wallet_ledger
    SET status = 'completed',
        provider_tx_id = p_provider_tx_id,
        processed_at = now()
    WHERE id = p_transaction_id;

  ELSIF p_status = 'failed' THEN
    -- Failure: return reserved back to available
    UPDATE wallet_balances
    SET reserved_amount = reserved_amount - v_tx.amount,
        available_amount = available_amount + v_tx.amount,
        updated_at = now()
    WHERE id = v_balance.id;

    UPDATE wallet_ledger
    SET status = 'failed',
        provider_tx_id = p_provider_tx_id,
        processed_at = now()
    WHERE id = p_transaction_id;

  ELSE
    RAISE EXCEPTION 'Invalid status: %. Must be completed or failed.', p_status;
  END IF;
END;
$$;
