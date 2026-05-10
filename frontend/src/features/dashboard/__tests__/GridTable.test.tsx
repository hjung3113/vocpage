/**
 * GridTable unit tests — Wave 2 Phase C.
 * Tests intensity interpolation correctness and click behavior.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GridTable, cellOpacity } from '../widgets/GridTable';

describe('cellOpacity', () => {
  it('returns 0 when value is 0', () => {
    expect(cellOpacity(0, 10)).toBe(0);
  });
  it('returns 0 when maxValue is 0', () => {
    expect(cellOpacity(5, 0)).toBe(0);
  });
  it('returns > 0.06 for small non-zero ratio', () => {
    const v = cellOpacity(1, 100);
    expect(v).toBeGreaterThan(0.06);
    expect(v).toBeLessThan(0.07);
  });
  it('returns 0.62 for max value', () => {
    expect(cellOpacity(10, 10)).toBeCloseTo(0.62);
  });
  it('interpolates correctly at midpoint', () => {
    expect(cellOpacity(5, 10)).toBeCloseTo(0.06 + 0.5 * (0.62 - 0.06));
  });
});

describe('GridTable', () => {
  const headers = ['A', 'B'];
  const rows = [
    { id: 'r1', name: 'Row 1', values: [3, 5], total: 8, isClickable: true },
    { id: 'r2', name: 'Row 2', values: [0, 2], total: 2, isClickable: true },
  ];

  it('renders headers', () => {
    render(<GridTable headers={headers} rows={rows} maxValue={5} />);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('renders row names and values', () => {
    render(<GridTable headers={headers} rows={rows} maxValue={5} />);
    expect(screen.getByText('Row 1')).toBeInTheDocument();
    expect(screen.getByText('Row 2')).toBeInTheDocument();
  });

  it('calls onCellClick with correct args for non-zero cells', () => {
    const onCellClick = vi.fn();
    render(<GridTable headers={headers} rows={rows} maxValue={5} onCellClick={onCellClick} />);
    const cells = screen.getAllByRole('cell');
    const cell3 = cells.find((c) => c.textContent === '3');
    expect(cell3).toBeTruthy();
    fireEvent.click(cell3!);
    expect(onCellClick).toHaveBeenCalledWith('r1', 0);
  });

  it('does not call onCellClick for 0-value cells', () => {
    const onCellClick = vi.fn();
    render(<GridTable headers={headers} rows={rows} maxValue={5} onCellClick={onCellClick} />);
    const cells = screen.getAllByRole('cell');
    const cell0 = cells.find((c) => c.textContent === '0');
    if (cell0) fireEvent.click(cell0);
    expect(onCellClick).not.toHaveBeenCalled();
  });

  it('renders totalRow when provided', () => {
    render(<GridTable headers={headers} rows={rows} maxValue={5} totalRow={[3, 7, 10]} />);
    expect(screen.getByText('전체')).toBeInTheDocument();
  });
});
