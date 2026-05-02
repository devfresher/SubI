"use client";

import { createClient } from "@/lib/supabase/client";
import * as subscriptionRepo from "@/repositories/subscription.repository";
import type { SubscriptionListScope } from "@/repositories/subscription.repository";
import type { SubscriptionRow } from "@/types";
import { useQuery } from "@tanstack/react-query";

export function useSubscriptionQuery(scope: SubscriptionListScope, initialData?: SubscriptionRow[]) {
  return useQuery({
    queryKey: ["subscriptions", scope],
    queryFn: async (): Promise<SubscriptionRow[]> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];
      return subscriptionRepo.listSubscriptionsForUser(supabase, user.id, scope);
    },
    initialData,
    /** Fresh data when returning from Subscriptions after edits; avoids stale RSC `initialData` dominating. */
    refetchOnMount: "always",
  });
}
