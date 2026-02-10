
-- =============================================
-- Task 9: Connector Exec DB Functions
-- =============================================

-- 1. create_connector_execution
CREATE OR REPLACE FUNCTION public.create_connector_execution(
  p_connector_id UUID,
  p_tenant_id UUID,
  p_job_type TEXT,
  p_payload JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.connector_executions (connector_id, tenant_id, job_type, status, request_payload, attempts)
  VALUES (p_connector_id, p_tenant_id, p_job_type, 'queued', p_payload, 0)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- 2. mark_execution_started
CREATE OR REPLACE FUNCTION public.mark_execution_started(p_execution_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.connector_executions
  SET status = 'running',
      started_at = now(),
      attempts = COALESCE(attempts, 0) + 1
  WHERE id = p_execution_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Execution % not found', p_execution_id;
  END IF;
END;
$$;

-- 3. mark_execution_result
CREATE OR REPLACE FUNCTION public.mark_execution_result(
  p_execution_id UUID,
  p_status TEXT,
  p_response JSONB DEFAULT NULL,
  p_last_error TEXT DEFAULT NULL,
  p_finished_at TIMESTAMPTZ DEFAULT now()
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.connector_executions
  SET status = p_status,
      response_payload = p_response,
      last_error = p_last_error,
      finished_at = p_finished_at
  WHERE id = p_execution_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Execution % not found', p_execution_id;
  END IF;
END;
$$;

-- 4. move_execution_to_dlq
CREATE OR REPLACE FUNCTION public.move_execution_to_dlq(
  p_execution_id UUID,
  p_error TEXT,
  p_payload JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_connector_id UUID;
  v_dlq_id UUID;
BEGIN
  SELECT connector_id INTO v_connector_id
  FROM public.connector_executions
  WHERE id = p_execution_id;

  IF v_connector_id IS NULL THEN
    RAISE EXCEPTION 'Execution % not found', p_execution_id;
  END IF;

  INSERT INTO public.connector_dlq (connector_id, execution_id, payload, error, failure_count, next_retry)
  VALUES (v_connector_id, p_execution_id, p_payload, p_error, 1, now() + interval '5 minutes')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_dlq_id;

  -- If already exists, increment failure_count
  IF v_dlq_id IS NULL THEN
    UPDATE public.connector_dlq
    SET failure_count = failure_count + 1,
        error = p_error,
        next_retry = now() + (interval '5 minutes' * (failure_count + 1)),
        updated_at = now()
    WHERE execution_id = p_execution_id
    RETURNING id INTO v_dlq_id;
  END IF;

  RETURN v_dlq_id;
END;
$$;

-- 5. get_next_dlq_item
CREATE OR REPLACE FUNCTION public.get_next_dlq_item(p_connector_id UUID)
RETURNS SETOF public.connector_dlq
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.connector_dlq
  WHERE connector_id = p_connector_id
    AND (next_retry IS NULL OR next_retry <= now())
  ORDER BY next_retry ASC NULLS FIRST, created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
END;
$$;
