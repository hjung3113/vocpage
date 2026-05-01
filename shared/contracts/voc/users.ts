/**
 * Stable mock-user UUIDs shared between BE auth scaffolding (`mockUsers.ts`)
 * and test fixtures (`shared/fixtures/voc.fixtures.ts`). Lives in `contracts/`
 * (not `fixtures/`) so prod backend code can import without dragging the
 * 50-row fixture array into the production bundle.
 */
export const FIXTURE_USERS = {
  admin: '00000000-0000-4000-8000-0000000000a1',
  manager: '00000000-0000-4000-8000-0000000000b1',
  /** Dev assignee for §6-3 B-T5 */
  devSelf: '00000000-0000-4000-8000-0000000000c1',
  devOther: '00000000-0000-4000-8000-0000000000c2',
  user: '00000000-0000-4000-8000-0000000000d1',
} as const;

export type FixtureUserKey = keyof typeof FIXTURE_USERS;
