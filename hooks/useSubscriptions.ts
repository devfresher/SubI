"use client";

import { useSubscriptionQuery } from "@/hooks/useSubscriptionQuery";
import type { SubscriptionRow } from "@/types";

/** Active subscriptions only (dashboard, default list). */
export function useSubscriptions(initialData?: SubscriptionRow[]) {
  return useSubscriptionQuery("active", initialData);
}

