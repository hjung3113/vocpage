import '@testing-library/jest-dom';
import React from 'react';
import { vi } from 'vitest';

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
