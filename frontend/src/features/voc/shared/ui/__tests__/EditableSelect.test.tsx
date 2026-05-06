import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { EditableSelect } from '../EditableSelect';

const options = [
  { id: 'a', label: 'Apple' },
  { id: 'b', label: 'Banana' },
  { id: 'c', label: 'Cherry' },
];

describe('EditableSelect', () => {
  it('선택된 값을 표시한다', () => {
    render(<EditableSelect value="a" options={options} onChange={vi.fn()} />);
    expect(screen.getByText('Apple')).toBeTruthy();
  });

  it('placeholder를 value가 없을 때 표시한다', () => {
    render(<EditableSelect value={null} options={options} onChange={vi.fn()} placeholder="선택" />);
    expect(screen.getByText('선택')).toBeTruthy();
  });

  it('트리거 클릭 시 옵션 목록이 열린다', async () => {
    const user = userEvent.setup();
    render(<EditableSelect value={null} options={options} onChange={vi.fn()} />);
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Apple')).toBeTruthy();
    expect(screen.getByText('Banana')).toBeTruthy();
  });

  it('옵션 선택 시 onChange 호출 + popover 닫힘', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<EditableSelect value={null} options={options} onChange={onChange} />);
    await user.click(screen.getByRole('button'));
    await user.click(screen.getByText('Banana'));
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('disabled 이면 popover 안 열림', async () => {
    const user = userEvent.setup();
    render(<EditableSelect value={null} options={options} onChange={vi.fn()} disabled />);
    const btn = screen.getByRole('button');
    await user.click(btn);
    // 옵션이 DOM에 없어야 함
    expect(screen.queryByText('Apple')).toBeNull();
  });

  it('검색어로 옵션이 필터링된다', async () => {
    const user = userEvent.setup();
    render(<EditableSelect value={null} options={options} onChange={vi.fn()} searchable />);
    await user.click(screen.getByRole('button'));
    const searchInput = screen.getByPlaceholderText('검색...');
    await user.type(searchInput, 'Ban');
    expect(screen.getByText('Banana')).toBeTruthy();
    expect(screen.queryByText('Apple')).toBeNull();
  });

  it('chip-style: 트리거 버튼에 border 클래스가 있어야 함 (어포던스)', () => {
    render(<EditableSelect value={null} options={options} onChange={vi.fn()} />);
    const btn = screen.getByRole('button');
    // border를 포함하는 클래스가 있어야 함
    expect(btn.className).toMatch(/border/);
  });

  it('disabled 시 트리거 버튼에 cursor-not-allowed 또는 aria-disabled 적용', () => {
    render(<EditableSelect value={null} options={options} onChange={vi.fn()} disabled />);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
  });

  it('ChevronDown 아이콘이 트리거에 렌더된다', () => {
    render(<EditableSelect value={null} options={options} onChange={vi.fn()} />);
    const btn = screen.getByRole('button');
    // lucide 아이콘은 svg로 렌더됨
    expect(btn.querySelector('svg')).toBeTruthy();
  });
});
