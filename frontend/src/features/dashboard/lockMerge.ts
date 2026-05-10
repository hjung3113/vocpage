/**
 * lockMerge.ts — Wave 2 Phase D
 * Pure function: merge admin-default and user-draft layouts respecting locked fields.
 */
import type { RglLayouts, RglLayoutItem } from '@contracts/dashboard';

/**
 * Merges admin-default and user-draft RGL layouts.
 * - For each breakpoint: take admin items whose `i` ∈ lockedFields,
 *   plus user-draft items whose `i` ∉ lockedFields.
 * - If a breakpoint is missing in userDraft, fall back fully to admin.
 * - Result always contains all widget IDs present in adminDefault.
 */
export function mergeLockedLayout(
  adminDefault: RglLayouts,
  userDraft: Partial<RglLayouts>,
  lockedFields: string[],
): RglLayouts {
  const result: Partial<RglLayouts> = {};
  const lockedSet = new Set(lockedFields);

  for (const bp of Object.keys(adminDefault) as Array<keyof RglLayouts>) {
    const adminItems = adminDefault[bp];
    if (!adminItems) continue;

    const userItems = userDraft[bp];
    if (!userItems) {
      // Missing breakpoint in userDraft → fall back to admin
      result[bp] = adminItems;
      continue;
    }

    const userMap = new Map<string, RglLayoutItem>(userItems.map((item) => [item.i, item]));
    const merged: RglLayoutItem[] = adminItems.map((adminItem) => {
      if (lockedSet.has(adminItem.i)) {
        // Locked → use admin
        return adminItem;
      }
      // Not locked → use user draft if available, else admin
      return userMap.get(adminItem.i) ?? adminItem;
    });

    result[bp] = merged;
  }

  return result as RglLayouts;
}
