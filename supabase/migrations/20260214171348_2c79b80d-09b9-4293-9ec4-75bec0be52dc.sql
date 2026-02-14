
-- 1. Append-only trigger for system_logs: block UPDATE/DELETE even from service_role
CREATE OR REPLACE FUNCTION public.trg_system_logs_append_only()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  RAISE EXCEPTION 'system_logs is append-only: % not allowed', TG_OP;
END;
$$;

CREATE TRIGGER enforce_system_logs_no_update
BEFORE UPDATE ON public.system_logs
FOR EACH ROW EXECUTE FUNCTION public.trg_system_logs_append_only();

CREATE TRIGGER enforce_system_logs_no_delete
BEFORE DELETE ON public.system_logs
FOR EACH ROW EXECUTE FUNCTION public.trg_system_logs_append_only();

-- 2. Auto-calculate next_retry on dlq insert based on failure_count
CREATE OR REPLACE FUNCTION public.trg_dlq_set_next_retry()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  -- Ensure defaults
  NEW.failure_count := COALESCE(NEW.failure_count, 0);
  NEW.created_at := COALESCE(NEW.created_at, now());
  
  -- Set next_retry with exponential backoff: 5min * failure_count (min 5min)
  IF NEW.next_retry IS NULL THEN
    NEW.next_retry := now() + (interval '5 minutes' * GREATEST(NEW.failure_count, 1));
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_dlq_next_retry
BEFORE INSERT ON public.dlq
FOR EACH ROW EXECUTE FUNCTION public.trg_dlq_set_next_retry();

-- 3. Recalculate next_retry on dlq update (when failure_count changes)
CREATE OR REPLACE FUNCTION public.trg_dlq_update_retry()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  NEW.updated_at := now();
  IF NEW.failure_count IS DISTINCT FROM OLD.failure_count THEN
    NEW.next_retry := now() + (interval '5 minutes' * GREATEST(NEW.failure_count, 1));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_dlq_retry
BEFORE UPDATE ON public.dlq
FOR EACH ROW EXECUTE FUNCTION public.trg_dlq_update_retry();
