import type { UserPlan } from '@/types';

export const MAX_MAILBOXES_BY_PLAN: Record<UserPlan, number> = {
	free: 1,
	pro: 10,
};

/** Offsets (days before renewal) eligible for email reminders, by plan. */
export const REMINDER_OFFSETS_BY_PLAN: Record<UserPlan, readonly number[]> = {
	free: [1, 3],
	pro: [1, 3, 7, 14],
};

export function maxMailboxesForPlan(plan: UserPlan): number {
	return MAX_MAILBOXES_BY_PLAN[plan];
}

export function allowedReminderOffsetsForPlan(plan: UserPlan): Set<number> {
	return new Set(REMINDER_OFFSETS_BY_PLAN[plan]);
}
