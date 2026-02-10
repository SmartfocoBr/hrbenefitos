
-- =============================================
-- Task 10: Connector Health Triggers
-- =============================================

-- 1. Function: update health from execution results
CREATE OR REPLACE FUNCTION public.trg_update_connector_health_on_execution()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_latency_ms INTEGER;
  v_entry JSONB;
  v_history JSONB;
BEGIN
  -- Only fire when status changes to a terminal state
  IF NEW.status NOT IN ('success', 'failed') THEN
    RETURN NEW;
  END IF;
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Calculate latency
  v_latency_ms := EXTRACT(EPOCH FROM (COALESCE(NEW.finished_at, now()) - COALESCE(NEW.started_at, now()))) * 1000;

  -- Build history entry
  v_entry := jsonb_build_object(
    'ts', now(),
    'status', NEW.status,
    'latency_ms', v_latency_ms,
    'error', NEW.last_error
  );

  -- Upsert connector_health
  INSERT INTO public.connector_health (connector_id, status, last_check, latency_ms, last_error, history)
  VALUES (
    NEW.connector_id,
    NEW.status,
    now(),
    v_latency_ms,
    NEW.last_error,
    jsonb_build_array(v_entry)
  )
  ON CONFLICT (connector_id) DO UPDATE SET
    status = EXCLUDED.status,
    last_check = now(),
    latency_ms = EXCLUDED.latency_ms,
    last_error = EXCLUDED.last_error,
    updated_at = now(),
    history = (
      SELECT jsonb_agg(val)
      FROM (
        SELECT val FROM jsonb_array_elements(
          v_entry || COALESCE(connector_health.history, '[]'::jsonb)
        ) AS val
        LIMIT 50
      ) sub
    );

  RETURN NEW;
END;
$$;

-- Add unique constraint on connector_health.connector_id for ON CONFLICT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'connector_health_connector_id_key'
  ) THEN
    ALTER TABLE public.connector_health ADD CONSTRAINT connector_health_connector_id_key UNIQUE (connector_id);
  END IF;
END;
$$;

-- 2. Trigger on connector_executions
CREATE TRIGGER trg_connector_execution_health
  AFTER UPDATE ON public.connector_executions
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_update_connector_health_on_execution();

-- 3. Function: insert initial health record when connector is enabled/config changes
CREATE OR REPLACE FUNCTION public.trg_connector_config_health()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only on relevant changes
  IF OLD.is_enabled IS DISTINCT FROM NEW.is_enabled
     OR OLD.config::text IS DISTINCT FROM NEW.config::text THEN

    INSERT INTO public.connector_health (connector_id, status, last_check, history)
    VALUES (NEW.id, 'unknown', now(), '[]'::jsonb)
    ON CONFLICT (connector_id) DO UPDATE SET
      status = 'unknown',
      last_check = now(),
      updated_at = now();
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Trigger on connectors
CREATE TRIGGER trg_connector_config_health
  AFTER UPDATE ON public.connectors
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_connector_config_health();
