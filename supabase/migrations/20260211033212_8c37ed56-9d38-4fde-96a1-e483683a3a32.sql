
-- 1. Helper: get employee attributes for policy evaluation
CREATE OR REPLACE FUNCTION public.get_employee_policy_context(p_employee_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'employee_id', e.id,
    'company_id', e.company_id,
    'status', e.status,
    'contract_type', e.contract_type,
    'department', e.department,
    'position', e.position,
    'salary', e.salary,
    'work_hours', e.work_hours,
    'hire_date', e.hire_date,
    'tenure_days', CASE WHEN e.hire_date IS NOT NULL THEN (CURRENT_DATE - e.hire_date) ELSE 0 END,
    'cost_center_id', e.cost_center_id,
    'external_id', e.external_id
  ) INTO v_result
  FROM public.employees e
  WHERE e.id = p_employee_id;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Employee % not found', p_employee_id;
  END IF;

  RETURN v_result;
END;
$$;

-- 2. Minimal safe expression evaluator for policy rules DSL
-- Supports: { "field": "tenure_days", "op": ">=", "value": 90 }
-- Boolean combinators: { "and": [...] }, { "or": [...] }, { "not": {...} }
CREATE OR REPLACE FUNCTION public.eval_policy_rule(
  p_rule JSONB,
  p_context JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_field TEXT;
  v_op TEXT;
  v_value JSONB;
  v_actual JSONB;
  v_actual_num NUMERIC;
  v_value_num NUMERIC;
  v_actual_text TEXT;
  v_value_text TEXT;
  v_items JSONB;
  v_item JSONB;
  v_result BOOLEAN;
BEGIN
  -- Boolean combinators
  IF p_rule ? 'and' THEN
    FOR v_item IN SELECT jsonb_array_elements(p_rule -> 'and')
    LOOP
      IF NOT public.eval_policy_rule(v_item, p_context) THEN
        RETURN FALSE;
      END IF;
    END LOOP;
    RETURN TRUE;
  END IF;

  IF p_rule ? 'or' THEN
    FOR v_item IN SELECT jsonb_array_elements(p_rule -> 'or')
    LOOP
      IF public.eval_policy_rule(v_item, p_context) THEN
        RETURN TRUE;
      END IF;
    END LOOP;
    RETURN FALSE;
  END IF;

  IF p_rule ? 'not' THEN
    RETURN NOT public.eval_policy_rule(p_rule -> 'not', p_context);
  END IF;

  -- Leaf comparison: { "field": "...", "op": "...", "value": ... }
  v_field := p_rule ->> 'field';
  v_op := p_rule ->> 'op';
  v_value := p_rule -> 'value';

  IF v_field IS NULL OR v_op IS NULL THEN
    RETURN TRUE; -- empty/invalid rule passes by default
  END IF;

  v_actual := p_context -> v_field;

  -- Handle null actual
  IF v_actual IS NULL OR v_actual = 'null'::jsonb THEN
    RETURN CASE WHEN v_op = 'is_null' THEN TRUE
                WHEN v_op = 'is_not_null' THEN FALSE
                ELSE FALSE END;
  END IF;

  -- Null checks
  IF v_op = 'is_null' THEN RETURN FALSE; END IF;
  IF v_op = 'is_not_null' THEN RETURN TRUE; END IF;

  -- Numeric comparisons
  IF jsonb_typeof(v_actual) = 'number' AND jsonb_typeof(v_value) = 'number' THEN
    v_actual_num := v_actual::text::numeric;
    v_value_num := v_value::text::numeric;
    RETURN CASE v_op
      WHEN '=' THEN v_actual_num = v_value_num
      WHEN '!=' THEN v_actual_num != v_value_num
      WHEN '>' THEN v_actual_num > v_value_num
      WHEN '>=' THEN v_actual_num >= v_value_num
      WHEN '<' THEN v_actual_num < v_value_num
      WHEN '<=' THEN v_actual_num <= v_value_num
      ELSE FALSE
    END;
  END IF;

  -- String/enum comparisons
  v_actual_text := v_actual #>> '{}';
  v_value_text := v_value #>> '{}';

  IF v_op = '=' THEN RETURN v_actual_text = v_value_text; END IF;
  IF v_op = '!=' THEN RETURN v_actual_text != v_value_text; END IF;

  -- "in" operator: value is an array
  IF v_op = 'in' AND jsonb_typeof(v_value) = 'array' THEN
    RETURN v_actual IN (SELECT jsonb_array_elements(v_value));
  END IF;

  IF v_op = 'not_in' AND jsonb_typeof(v_value) = 'array' THEN
    RETURN v_actual NOT IN (SELECT jsonb_array_elements(v_value));
  END IF;

  RETURN FALSE;
END;
$$;

-- 3. Main evaluate_policy function
CREATE OR REPLACE FUNCTION public.evaluate_policy(
  p_policy_id UUID,
  p_employee_id UUID,
  p_context JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_policy RECORD;
  v_emp_ctx JSONB;
  v_merged_ctx JSONB;
  v_rules JSONB;
  v_rule JSONB;
  v_rule_rec RECORD;
  v_eligible BOOLEAN := TRUE;
  v_reasons JSONB := '[]'::jsonb;
  v_computed_limits JSONB := '{}'::jsonb;
  v_rule_result BOOLEAN;
  v_limit_field TEXT;
  v_limit_value NUMERIC;
BEGIN
  -- Load policy
  SELECT * INTO v_policy
  FROM public.policies
  WHERE id = p_policy_id;

  IF v_policy IS NULL THEN
    RETURN jsonb_build_object('error', 'Policy not found', 'eligible', false);
  END IF;

  -- Get employee context
  v_emp_ctx := public.get_employee_policy_context(p_employee_id);
  v_merged_ctx := v_emp_ctx || p_context; -- caller context overrides

  -- Evaluate inline rules from policies.rules JSONB array
  IF jsonb_typeof(v_policy.rules) = 'array' AND jsonb_array_length(v_policy.rules) > 0 THEN
    FOR v_rule IN SELECT jsonb_array_elements(v_policy.rules)
    LOOP
      -- Each rule: { "condition": {...}, "description": "...", "limit_field": "...", "limit_value": ... }
      v_rule_result := public.eval_policy_rule(
        COALESCE(v_rule -> 'condition', v_rule),
        v_merged_ctx
      );

      IF NOT v_rule_result THEN
        v_eligible := FALSE;
        v_reasons := v_reasons || jsonb_build_array(
          COALESCE(v_rule ->> 'description', 'Rule failed')
        );
      END IF;

      -- Collect computed limits
      v_limit_field := v_rule ->> 'limit_field';
      IF v_limit_field IS NOT NULL AND v_rule_result THEN
        v_computed_limits := v_computed_limits || jsonb_build_object(
          v_limit_field, (v_rule ->> 'limit_value')::numeric
        );
      END IF;
    END LOOP;
  END IF;

  -- Also evaluate normalized policy_rules if any
  FOR v_rule_rec IN
    SELECT pr.rule_json, pr.description
    FROM public.policy_rules pr
    WHERE pr.policy_id = p_policy_id
    ORDER BY pr.rule_order
  LOOP
    v_rule_result := public.eval_policy_rule(
      COALESCE(v_rule_rec.rule_json -> 'condition', v_rule_rec.rule_json),
      v_merged_ctx
    );

    IF NOT v_rule_result THEN
      v_eligible := FALSE;
      v_reasons := v_reasons || jsonb_build_array(
        COALESCE(v_rule_rec.description, 'Normalized rule failed')
      );
    END IF;

    v_limit_field := v_rule_rec.rule_json ->> 'limit_field';
    IF v_limit_field IS NOT NULL AND v_rule_result THEN
      v_computed_limits := v_computed_limits || jsonb_build_object(
        v_limit_field, (v_rule_rec.rule_json ->> 'limit_value')::numeric
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'eligible', v_eligible,
    'reasons', v_reasons,
    'computed_limits', v_computed_limits,
    'metadata', jsonb_build_object(
      'policy_id', p_policy_id,
      'policy_name', v_policy.name,
      'policy_version', v_policy.version,
      'employee_id', p_employee_id,
      'evaluated_at', now()
    )
  );
END;
$$;

-- 4. simulate_policy: evaluate + persist to policy_simulations
CREATE OR REPLACE FUNCTION public.simulate_policy(
  p_policy_id UUID,
  p_employee_id UUID,
  p_context JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result JSONB;
  v_tenant_id UUID;
  v_emp_ctx JSONB;
BEGIN
  -- Get tenant from employee
  SELECT company_id INTO v_tenant_id
  FROM public.employees WHERE id = p_employee_id;

  IF v_tenant_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Employee not found');
  END IF;

  -- Get snapshot
  v_emp_ctx := public.get_employee_policy_context(p_employee_id);

  -- Evaluate
  v_result := public.evaluate_policy(p_policy_id, p_employee_id, p_context);

  -- Store simulation
  INSERT INTO public.policy_simulations (tenant_id, employee_id, policy_id, input_context, result)
  VALUES (v_tenant_id, p_employee_id, p_policy_id, v_emp_ctx || p_context, v_result);

  RETURN v_result;
END;
$$;
