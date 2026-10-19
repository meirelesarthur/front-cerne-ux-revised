import { describe, expect, it } from 'vitest';

import { shouldActivateCreatedFarm } from '@/utils/shouldActivateCreatedFarm';

describe('TASK-072-FE-09 — shouldActivateCreatedFarm (matriz)', () => {
  it.each([
    [false, null, true],
    [false, undefined, true],
    [false, '', true],
    [false, '0b7f8a5e-0000-4000-8000-000000000001', false],
    [true, null, false],
    [true, '0b7f8a5e-0000-4000-8000-000000000001', false],
  ])('isEditing=%s, activeFarmUuid=%s → %s', (isEditing, activeFarmUuid, expected) => {
    expect(shouldActivateCreatedFarm({ isEditing, activeFarmUuid })).toBe(expected);
  });
});
