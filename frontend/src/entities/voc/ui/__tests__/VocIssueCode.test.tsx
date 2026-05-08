import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { VocIssueCode } from '../VocIssueCode';

describe('VocIssueCode — prototype `.iid` mono badge', () => {
  it('renders code text', () => {
    render(<VocIssueCode code="ANALYSIS-2026-0001" />);
    expect(screen.getByTestId('issue-code-ANALYSIS-2026-0001')).toHaveTextContent(
      'ANALYSIS-2026-0001',
    );
  });

  it('uses mono font + tertiary color + elevated bg + subtle border (prototype)', () => {
    render(<VocIssueCode code="SVC-150" />);
    const el = screen.getByTestId('issue-code-SVC-150');
    expect(el.style.fontFamily).toBe('var(--font-mono)');
    expect(el.style.fontSize).toBe('11.5px');
    expect(el.style.color).toBe('var(--text-tertiary)');
    expect(el.style.background).toBe('var(--bg-elevated)');
    expect(el.style.borderRadius).toBe('4px');
    expect(el.style.padding).toBe('1px 6px');
    expect(el.style.border).toContain('1px');
    expect(el.style.border).toContain('var(--border-subtle)');
  });
});
