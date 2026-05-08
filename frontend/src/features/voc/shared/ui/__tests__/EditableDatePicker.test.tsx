import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { EditableDatePicker } from '../EditableDatePicker';

describe('EditableDatePicker', () => {
  it('value가 있을 때 날짜를 표시한다', () => {
    render(<EditableDatePicker value="2025-05-07" onChange={vi.fn()} />);
    expect(screen.getByText('2025-05-07')).toBeTruthy();
  });

  it('value가 없을 때 placeholder를 표시한다', () => {
    render(<EditableDatePicker value={null} onChange={vi.fn()} placeholder="날짜 선택" />);
    expect(screen.getByText('날짜 선택')).toBeTruthy();
  });

  it('트리거 클릭 시 캘린더가 열린다', async () => {
    const user = userEvent.setup();
    render(<EditableDatePicker value={null} onChange={vi.fn()} />);
    await user.click(screen.getByRole('button'));
    // DayPicker 렌더 시 table role 또는 grid가 나타남
    expect(screen.getByRole('grid')).toBeTruthy();
  });

  it('disabled 이면 캘린더 안 열림', async () => {
    const user = userEvent.setup();
    render(<EditableDatePicker value={null} onChange={vi.fn()} disabled />);
    const btn = screen.getByRole('button');
    await user.click(btn);
    expect(screen.queryByRole('grid')).toBeNull();
  });

  it('clear 버튼 클릭 시 onChange(null) 호출', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<EditableDatePicker value="2025-05-07" onChange={onChange} />);
    const clearBtn = screen.getByLabelText('날짜 지우기');
    await user.click(clearBtn);
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('chip-style: 트리거 버튼에 border 클래스가 있어야 함 (어포던스)', () => {
    render(<EditableDatePicker value={null} onChange={vi.fn()} />);
    // getByRole('button') 중 첫 번째가 트리거 (clear btn은 value 없으면 미렌더)
    const btn = screen.getByRole('button');
    expect(btn.className).toMatch(/border/);
  });

  it('disabled 시 트리거 버튼이 disabled 상태', () => {
    render(<EditableDatePicker value={null} onChange={vi.fn()} disabled />);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
  });
});
