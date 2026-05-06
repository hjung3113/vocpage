import '@testing-library/jest-dom';
import React from 'react';
import { vi } from 'vitest';

// Radix UI uses Pointer Events API and scrollIntoView which jsdom doesn't implement.
// Polyfill the minimum surface so Radix Select/Dialog/etc. work in tests.
window.PointerEvent = class PointerEvent extends MouseEvent {} as typeof PointerEvent;
window.HTMLElement.prototype.hasPointerCapture = vi.fn();
window.HTMLElement.prototype.setPointerCapture = vi.fn();
window.HTMLElement.prototype.releasePointerCapture = vi.fn();
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Toast UI editor — jsdom incompatible. Mock as a textarea.
interface MockEditorProps {
  initialValue?: string;
  onChange?: (md: string) => void;
  [key: string]: unknown;
}
vi.mock('@toast-ui/react-editor', () => ({
  Editor: ({ initialValue, onChange, ...rest }: MockEditorProps) =>
    React.createElement('textarea', {
      'data-testid': 'voc-body-editor',
      defaultValue: initialValue,
      onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => onChange?.(e.target.value),
      ...rest,
    }),
}));

// CSS import side-effect — strip in unit env.
vi.mock('@toast-ui/editor/dist/toastui-editor.css', () => ({}));
