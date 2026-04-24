import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface VOCDrawerContextValue {
  selectedVocId: string | null;
  isOpen: boolean;
  openDrawer: (vocId: string) => void;
  closeDrawer: () => void;
}

export const VOCDrawerContext = createContext<VOCDrawerContextValue | null>(null);

export function VOCDrawerProvider({ children }: { children: React.ReactNode }) {
  const [selectedVocId, setSelectedVocId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const openDrawer = useCallback((vocId: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setSelectedVocId(vocId);
    setIsOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(false);
    timerRef.current = setTimeout(() => {
      setSelectedVocId(null);
      timerRef.current = null;
    }, 300);
  }, []);

  const value = useMemo(
    () => ({ selectedVocId, isOpen, openDrawer, closeDrawer }),
    [selectedVocId, isOpen, openDrawer, closeDrawer],
  );

  return <VOCDrawerContext.Provider value={value}>{children}</VOCDrawerContext.Provider>;
}
