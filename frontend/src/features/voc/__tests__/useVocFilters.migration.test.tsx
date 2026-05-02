import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useVocFilters } from '../useVocFilters';

function wrapper(initial: string) {
  return ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route path="/voc" element={children} />
      </Routes>
    </MemoryRouter>
  );
}

describe('useVocFilters — Issue 155 sort_by URL migration', () => {
  it.each(['updated_at', 'due_date', 'foo'])(
    'removed/unknown sort_by=%s falls back to created_at',
    (raw) => {
      const { result } = renderHook(() => useVocFilters(), {
        wrapper: wrapper(`/voc?sort_by=${raw}`),
      });
      expect(result.current.state.sortBy).toBe('created_at');
    },
  );

  it.each(['issue_code', 'title', 'status', 'assignee', 'priority', 'created_at'] as const)(
    'sort_by=%s is preserved',
    (col) => {
      const { result } = renderHook(() => useVocFilters(), {
        wrapper: wrapper(`/voc?sort_by=${col}`),
      });
      expect(result.current.state.sortBy).toBe(col);
    },
  );
});
