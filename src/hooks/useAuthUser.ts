import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface AuthUserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useAuthUser() {
  const { user } = useAuth();

  const { data: profile, isLoading, error, refetch } = useQuery({
    queryKey: ["auth-user-profile", user?.id],
    queryFn: async (): Promise<AuthUserProfile | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;

      // If no profile yet, create one via the onboarding edge function
      if (!data) {
        const { error: fnError } = await supabase.functions.invoke("onboard-user", {
          body: { user_id: user.id, email: user.email },
        });
        if (fnError) console.error("Onboarding error:", fnError);

        // Re-fetch after creation
        const { data: newData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        return newData;
      }

      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  return { profile, isLoading, error, refetch };
}
