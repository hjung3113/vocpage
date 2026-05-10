import { render, screen } from '@testing-library/react';
import { IssueId } from '../IssueId';

describe('IssueId — uidesign.md §16.2', () => {
  it('renders id text in mono pill', () => {
    render(<IssueId id="VOC-318" />);
    const el = screen.getByTestId('issue-id');
    expect(el).toHaveTextContent('VOC-318');
    expect(el).toHaveAttribute('data-tone', 'default');
    expect(el.style.fontFamily).toBe('var(--font-mono)');
  });

  it('subdued tone applies opacity', () => {
    render(<IssueId id="VOC-319" tone="subdued" />);
    const el = screen.getByTestId('issue-id');
    expect(el).toHaveAttribute('data-tone', 'subdued');
    expect(el.style.opacity).toBe('0.7');
  });

  it('no hex color literal (lint hard rule)', () => {
    render(<IssueId id="VOC-320" />);
    const el = screen.getByTestId('issue-id');
    expect(el.outerHTML).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });
});
