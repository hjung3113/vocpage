import { render, screen, fireEvent } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { VocListHeader } from '../VocListHeader';

const CELL_KEYS = ['issue_code', 'title', 'status', 'assignee', 'priority', 'created_at'] as const;

describe('VocListHeader', () => {
  it('renders 6 columnheaders in correct order (expand is presentation)', () => {
    render(<VocListHeader sortBy="created_at" sortDir="desc" onSort={() => {}} />);
    const cells = screen.getAllByRole('columnheader');
    expect(cells).toHaveLength(6);
    cells.forEach((cell, i) => {
      expect(cell.getAttribute('data-testid')).toBe(`voc-list-header-cell-${CELL_KEYS[i]}`);
    });
  });

  it('expand cell has role="presentation" (no semantic column)', () => {
    render(<VocListHeader sortBy="created_at" sortDir="desc" onSort={() => {}} />);
    const expand = screen.getByTestId('voc-list-header-cell-expand');
    expect(expand).toHaveAttribute('role', 'presentation');
  });

  it('sortable cells render as buttons; non-sortable as divs', () => {
    render(<VocListHeader sortBy="created_at" sortDir="desc" onSort={() => {}} />);
    expect(screen.getByTestId('voc-list-header-cell-issue_code').tagName).toBe('BUTTON');
    expect(screen.getByTestId('voc-list-header-cell-status').tagName).toBe('BUTTON');
    expect(screen.getByTestId('voc-list-header-cell-priority').tagName).toBe('BUTTON');
    expect(screen.getByTestId('voc-list-header-cell-created_at').tagName).toBe('BUTTON');
    expect(screen.getByTestId('voc-list-header-cell-expand').tagName).toBe('DIV');
    expect(screen.getByTestId('voc-list-header-cell-title').tagName).toBe('DIV');
    expect(screen.getByTestId('voc-list-header-cell-assignee').tagName).toBe('DIV');
  });

  it('clicking sortable cell calls onSort with the correct key', () => {
    const onSort = vi.fn();
    render(<VocListHeader sortBy="created_at" sortDir="desc" onSort={onSort} />);
    fireEvent.click(screen.getByTestId('voc-list-header-cell-issue_code'));
    expect(onSort).toHaveBeenCalledWith('issue_code');
    fireEvent.click(screen.getByTestId('voc-list-header-cell-status'));
    expect(onSort).toHaveBeenCalledWith('status');
    fireEvent.click(screen.getByTestId('voc-list-header-cell-priority'));
    expect(onSort).toHaveBeenCalledWith('priority');
    fireEvent.click(screen.getByTestId('voc-list-header-cell-created_at'));
    expect(onSort).toHaveBeenCalledWith('created_at');
    expect(onSort).toHaveBeenCalledTimes(4);
  });

  it('active cell has sort-active class and aria-sort=ascending when sortDir=asc', () => {
    render(<VocListHeader sortBy="priority" sortDir="asc" onSort={() => {}} />);
    const active = screen.getByTestId('voc-list-header-cell-priority');
    expect(active.className).toContain('sort-active');
    expect(active).toHaveAttribute('aria-sort', 'ascending');
  });

  it('active cell has aria-sort=descending when sortDir=desc', () => {
    render(<VocListHeader sortBy="status" sortDir="desc" onSort={() => {}} />);
    const desc = screen.getByTestId('voc-list-header-cell-status');
    expect(desc).toHaveAttribute('aria-sort', 'descending');
  });

  it('inactive sortable cells have aria-sort="none" and no sort-active class', () => {
    render(<VocListHeader sortBy="created_at" sortDir="desc" onSort={() => {}} />);
    const inactive = screen.getByTestId('voc-list-header-cell-issue_code');
    expect(inactive).toHaveAttribute('aria-sort', 'none');
    expect(inactive.className).not.toContain('sort-active');
  });

  it('component source contains no hex or raw OKLCH literals', () => {
    const src = readFileSync(resolve(__dirname, '..', 'VocListHeader.tsx'), 'utf-8');
    expect(src).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(src).not.toMatch(/oklch\s*\(/i);
  });

  // Token-purity scan for the C-6 CSS block.
  // Contract: rules between `=== C-6 VocListHeader styles START ===` and
  // `=== C-6 VocListHeader styles END ===` MUST be token-only (no hex, no raw oklch).
  // The container shadow lives outside the marker block (Phase B precedent allows
  // light-dark wrapped color-space literals in CSS for prototype-fidelity shadows).
  it('C-6 CSS block (between START/END markers) contains no hex or raw OKLCH', () => {
    const css = readFileSync(resolve(__dirname, '..', '..', '..', 'styles', 'index.css'), 'utf-8');
    const start = css.indexOf('=== C-6 VocListHeader styles START ===');
    const end = css.indexOf('=== C-6 VocListHeader styles END ===');
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const block = css.slice(start, end);
    expect(block).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(block).not.toMatch(/oklch\s*\(/i);
  });

  it('Korean header text renders correctly', () => {
    render(<VocListHeader sortBy="created_at" sortDir="desc" onSort={() => {}} />);
    expect(screen.getByTestId('voc-list-header-cell-issue_code')).toHaveTextContent('이슈 ID');
    expect(screen.getByTestId('voc-list-header-cell-title')).toHaveTextContent('제목');
    expect(screen.getByTestId('voc-list-header-cell-status')).toHaveTextContent('상태');
    expect(screen.getByTestId('voc-list-header-cell-assignee')).toHaveTextContent('담당자');
    expect(screen.getByTestId('voc-list-header-cell-priority')).toHaveTextContent('우선순위');
    expect(screen.getByTestId('voc-list-header-cell-created_at')).toHaveTextContent('등록일');
  });

  it('container has correct data-pcomp marker and role row', () => {
    render(<VocListHeader sortBy="created_at" sortDir="desc" onSort={() => {}} />);
    const container = screen.getByTestId('voc-list-header');
    expect(container).toHaveAttribute('data-pcomp', 'voc-list-header');
    expect(container).toHaveAttribute('role', 'row');
    expect(container.className).toContain('voc-list-header-container');
  });

  it('sortable cell aria-label is label-only (direction conveyed by aria-sort)', () => {
    render(<VocListHeader sortBy="issue_code" sortDir="asc" onSort={() => {}} />);
    const cell = screen.getByTestId('voc-list-header-cell-issue_code');
    expect(cell.getAttribute('aria-label')).toBe('정렬: 이슈 ID');
    expect(cell.getAttribute('aria-label')).not.toMatch(/오름차순|내림차순/);
  });
});
