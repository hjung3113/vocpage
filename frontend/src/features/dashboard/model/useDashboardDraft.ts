/**
 * useDashboardDraft.ts — Wave 2 Phase D
 * State machine: loading | clean | dirty | saving | error
 *
 * Public API:
 *   { layouts, isEditing, isDirty, setIsEditing, onLayoutChange, save, discard }
 */
import { useState, useEffect, useCallback } from 'react';
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
      setLayouts(allLayouts);
      setState('dirty');
    },
    [isEditing],
  );

  const save = useCallback(() => {
    setState('saving');
    mutate(
      { widget_sizes: layouts },
      {
        onSuccess: () => {
          setLastSaved(layouts);
          setState('clean');
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

  return {
    layouts,
    isEditing,
    isDirty: state === 'dirty',
    isSaving: state === 'saving',
    isLoading: state === 'loading',
    setIsEditing,
    onLayoutChange,
    save,
    discard,
  };
}
