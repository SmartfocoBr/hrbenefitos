import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useReprocessJobs(dlqId?: string) {
  return useQuery({
    queryKey: ["reprocess-jobs", dlqId],
    queryFn: async () => {
      let query = supabase
        .from("reprocess_jobs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (dlqId) query = query.eq("dlq_id", dlqId);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    refetchInterval: 15_000,
  });
}
