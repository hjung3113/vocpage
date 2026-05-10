/**
 * useDashboardDraft.ts — Wave 2 Phase D
 * State machine: loading | clean | dirty | saving | error
 *
 * Public API:
 *   { layouts, isEditing, isDirty, setIsEditing, onLayoutChange, save, discard }
 */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Layout, LayoutItem } from 'react-grid-layout/legacy';
import type { RglLayouts } from '@contracts/dashboard';
import { defaultLayouts } from '../defaultLayouts';
import { mergeLockedLayout } from '../lockMerge';
import { useDashboardSettings } from './useDashboardSettings';
import { useUpdateDashboardSettings } from './useUpdateDashboardSettings';

type DraftState = 'loading' | 'clean' | 'dirty' | 'saving' | 'error';

export function useDashboardDraft() {
  const { data: settings, isLoading, isError } = useDashboardSettings();
  const { mutate } = useUpdateDashboardSettings();

  const [state, setState] = useState<DraftState>('loading');
  const [isEditing, setIsEditingState] = useState(false);
  const [layouts, setLayouts] = useState<RglLayouts>(defaultLayouts);
  const [lastSaved, setLastSaved] = useState<RglLayouts>(defaultLayouts);
  // P1-4 race guard: counter incremented on every layout change; checked on success
  const saveCounterRef = useRef(0);
  // Tracks the layouts value captured at mutation-start
  const layoutsAtSaveRef = useRef<RglLayouts>(defaultLayouts);

  // Load settings and apply lock merge
  useEffect(() => {
    if (isLoading) {
      setState('loading');
      return;
    }
    if (isError) {
      setState('error');
      return;
    }
    if (settings) {
      const merged = mergeLockedLayout(
        defaultLayouts,
        settings.widget_sizes,
        settings.locked_fields,
      );
      setLayouts(merged);
      setLastSaved(merged);
      setState('clean');
    }
  }, [settings, isLoading, isError]);

  const setIsEditing = useCallback((value: boolean) => {
    setIsEditingState(value);
  }, []);

  const onLayoutChange = useCallback(
    (_currentLayout: Layout | readonly LayoutItem[], allLayouts: RglLayouts) => {
      if (!isEditing) return;
      saveCounterRef.current += 1;
      setLayouts(allLayouts);
      setState('dirty');
    },
    [isEditing],
  );

  const save = useCallback(() => {
    setState('saving');
    // Capture the layouts and counter at mutation-start for race detection
    layoutsAtSaveRef.current = layouts;
    const counterAtSave = saveCounterRef.current;
    mutate(
      { widget_sizes: layouts },
      {
        onSuccess: () => {
          // P1-4: if the counter advanced since save started, newer edits exist —
          // keep dirty=true so user must save again; do not stomp with stale snapshot.
          if (saveCounterRef.current === counterAtSave) {
            setLastSaved(layoutsAtSaveRef.current);
            setState('clean');
          } else {
            setState('dirty');
          }
        },
        onError: () => {
          setState('error');
        },
      },
    );
  }, [layouts, mutate]);

  const discard = useCallback(() => {
    setLayouts(lastSaved);
    setState('clean');
  }, [lastSaved]);

  // Phase E: stable Set of widget IDs explicitly hidden via widget_visibility.
  // Missing entries default to visible. Memoized so DashboardShell doesn't
  // re-render on unrelated state changes.
  const hiddenWidgetIds = useMemo<ReadonlySet<string>>(
    () =>
      new Set(
        settings
          ? Object.entries(settings.widget_visibility)
              .filter(([, v]) => v === false)
              .map(([k]) => k)
          : [],
      ),
    [settings],
  );

  return {
    layouts,
    isEditing,
    isDirty: state === 'dirty',
    isSaving: state === 'saving',
    isLoading: state === 'loading',
    hiddenWidgetIds,
    setIsEditing,
    onLayoutChange,
    save,
    discard,
  };
}
