
-- 1. upsert_employee_from_import: Upsert employee by external_id or email, tenant-scoped
CREATE OR REPLACE FUNCTION public.upsert_employee_from_import(
  p_payload JSONB,
  p_tenant_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_employee_id UUID;
  v_external_id TEXT;
  v_email TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
BEGIN
  v_external_id := p_payload ->> 'external_id';
  v_email := p_payload ->> 'email';
  v_first_name := COALESCE(p_payload ->> 'first_name', '');
  v_last_name := COALESCE(p_payload ->> 'last_name', '');

  IF v_external_id IS NULL AND v_email IS NULL THEN
    RAISE EXCEPTION 'Either external_id or email is required for upsert';
  END IF;

  -- Try find by external_id first
  IF v_external_id IS NOT NULL THEN
    SELECT id INTO v_employee_id
    FROM public.employees
    WHERE company_id = p_tenant_id AND external_id = v_external_id
    FOR UPDATE;
  END IF;

  -- Fallback to email
  IF v_employee_id IS NULL AND v_email IS NOT NULL THEN
    SELECT id INTO v_employee_id
    FROM public.employees
    WHERE company_id = p_tenant_id AND email = v_email
    FOR UPDATE;
  END IF;

  IF v_employee_id IS NOT NULL THEN
    -- Update existing
    UPDATE public.employees SET
      first_name = COALESCE(NULLIF(v_first_name, ''), first_name),
      last_name = COALESCE(NULLIF(v_last_name, ''), last_name),
      email = COALESCE(v_email, email),
      external_id = COALESCE(v_external_id, external_id),
      cpf = COALESCE(p_payload ->> 'cpf', cpf),
      phone = COALESCE(p_payload ->> 'phone', phone),
      position = COALESCE(p_payload ->> 'position', position),
      department = COALESCE(p_payload ->> 'department', department),
      hire_date = COALESCE((p_payload ->> 'hire_date')::date, hire_date),
      salary = COALESCE((p_payload ->> 'salary')::numeric, salary),
      status = COALESCE((p_payload ->> 'status')::employee_status, status),
      contract_type = COALESCE((p_payload ->> 'contract_type')::contract_type, contract_type),
      work_hours = COALESCE((p_payload ->> 'work_hours')::integer, work_hours),
      updated_at = now()
    WHERE id = v_employee_id;
  ELSE
    -- Insert new
    INSERT INTO public.employees (
      company_id, external_id, first_name, last_name, email,
      cpf, phone, position, department, hire_date, salary,
      status, contract_type, work_hours
    ) VALUES (
      p_tenant_id,
      v_external_id,
      v_first_name,
      v_last_name,
      v_email,
      p_payload ->> 'cpf',
      p_payload ->> 'phone',
      p_payload ->> 'position',
      p_payload ->> 'department',
      (p_payload ->> 'hire_date')::date,
      (p_payload ->> 'salary')::numeric,
      COALESCE((p_payload ->> 'status')::employee_status, 'active'),
      COALESCE((p_payload ->> 'contract_type')::contract_type, 'clt'),
      COALESCE((p_payload ->> 'work_hours')::integer, 44)
    )
    RETURNING id INTO v_employee_id;
  END IF;

  RETURN v_employee_id;
END;
$$;

-- 2. insert_employee_event: Idempotent insert enforced by unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_employee_events_tenant_external
  ON public.employee_events (tenant_id, external_event_id);

CREATE OR REPLACE FUNCTION public.insert_employee_event(p_event JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.employee_events (
    tenant_id, external_event_id, event_type, employee_id, payload
  ) VALUES (
    (p_event ->> 'tenant_id')::uuid,
    p_event ->> 'external_event_id',
    p_event ->> 'event_type',
    (p_event ->> 'employee_id')::uuid,
    COALESCE(p_event -> 'payload', '{}'::jsonb)
  )
  ON CONFLICT (tenant_id, external_event_id) DO NOTHING
  RETURNING id INTO v_id;

  RETURN v_id; -- NULL means duplicate, already processed
END;
$$;

-- 3. process_employee_event: Lightweight trigger function
CREATE OR REPLACE FUNCTION public.process_employee_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_employee_id UUID;
  v_event_type TEXT;
  v_payload JSONB;
BEGIN
  v_event_type := NEW.event_type;
  v_payload := COALESCE(NEW.payload, '{}'::jsonb);
  v_employee_id := NEW.employee_id;

  -- Quick inline updates for common event types
  IF v_employee_id IS NOT NULL THEN
    CASE v_event_type
      WHEN 'hire' THEN
        UPDATE public.employees SET
          status = 'active',
          hire_date = COALESCE((v_payload ->> 'hire_date')::date, hire_date),
          updated_at = now()
        WHERE id = v_employee_id AND company_id = NEW.tenant_id;

      WHEN 'terminate', 'termination' THEN
        UPDATE public.employees SET
          status = 'terminated',
          updated_at = now()
        WHERE id = v_employee_id AND company_id = NEW.tenant_id;

      WHEN 'leave_start' THEN
        UPDATE public.employees SET
          status = 'on_leave',
          updated_at = now()
        WHERE id = v_employee_id AND company_id = NEW.tenant_id;

      WHEN 'leave_end' THEN
        UPDATE public.employees SET
          status = 'active',
          updated_at = now()
        WHERE id = v_employee_id AND company_id = NEW.tenant_id;

      WHEN 'promotion', 'transfer' THEN
        UPDATE public.employees SET
          position = COALESCE(v_payload ->> 'position', position),
          department = COALESCE(v_payload ->> 'department', department),
          salary = COALESCE((v_payload ->> 'salary')::numeric, salary),
          updated_at = now()
        WHERE id = v_employee_id AND company_id = NEW.tenant_id;

      ELSE
        NULL; -- Unknown event types are ignored inline
    END CASE;
  END IF;

  -- Mark as processed
  NEW.processed := true;
  NEW.processed_at := now();

  -- Offload policy evaluation via NOTIFY (lightweight, non-blocking)
  PERFORM pg_notify(
    'employee_event',
    jsonb_build_object(
      'event_id', NEW.id,
      'tenant_id', NEW.tenant_id,
      'employee_id', v_employee_id,
      'event_type', v_event_type
    )::text
  );

  RETURN NEW;
END;
$$;

-- 4. Attach trigger BEFORE INSERT (so we can modify NEW.processed)
CREATE TRIGGER trg_process_employee_event
  BEFORE INSERT ON public.employee_events
  FOR EACH ROW
  EXECUTE FUNCTION public.process_employee_event();
