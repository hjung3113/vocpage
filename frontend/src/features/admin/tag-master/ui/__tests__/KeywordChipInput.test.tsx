/**
 * KeywordChipInput — chip-array input component (Phase 01 Plan 06 Task 1).
 *
 * Behaviour contract per 01-UI-SPEC.md §Add form keyword input + threat T-01-14:
 *  - Enter or `,` commits trimmed input as a chip; case-insensitive dedupe; capacity-bounded.
 *  - Backspace on empty input removes last chip.
 *  - Inline errors: dup → `이미 추가된 키워드입니다`; over max → `최대 N개까지 추가할 수 있습니다`.
 *  - Empty whitespace commit is a no-op (doesn't fire onChange).
 *  - Click X on chip removes that chip (a11y label `${kw} 제거`).
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KeywordChipInput } from '../KeywordChipInput';

function setup(initial: string[] = [], extra: Partial<React.ComponentProps<typeof KeywordChipInput>> = {}) {
  const onChange = vi.fn();
  const utils = render(
    <KeywordChipInput
      value={initial}
      onChange={onChange}
      aria-label="키워드 입력"
      {...extra}
    />,
  );
  return { onChange, ...utils };
}

describe('KeywordChipInput', () => {
  it('renders provided chips with remove buttons', () => {
    setup(['버그', '문의']);
    expect(screen.getByText('버그')).toBeInTheDocument();
    expect(screen.getByText('문의')).toBeInTheDocument();
    expect(screen.getByLabelText('버그 제거')).toBeInTheDocument();
    expect(screen.getByLabelText('문의 제거')).toBeInTheDocument();
  });

  it('Enter commits trimmed input and calls onChange with appended chip', async () => {
    const user = userEvent.setup();
    const { onChange } = setup(['버그']);
    const input = screen.getByLabelText('키워드 입력') as HTMLInputElement;
    await user.type(input, '  문의  {Enter}');
    expect(onChange).toHaveBeenCalledWith(['버그', '문의']);
  });

  it('"," commits like Enter', async () => {
    const user = userEvent.setup();
    const { onChange } = setup([]);
    const input = screen.getByLabelText('키워드 입력') as HTMLInputElement;
    await user.type(input, '문의,');
    expect(onChange).toHaveBeenCalledWith(['문의']);
  });

  it('Backspace on empty input removes last chip', async () => {
    const user = userEvent.setup();
    const { onChange } = setup(['버그', '문의']);
    const input = screen.getByLabelText('키워드 입력') as HTMLInputElement;
    input.focus();
    await user.keyboard('{Backspace}');
    expect(onChange).toHaveBeenCalledWith(['버그']);
  });

  it('Backspace on empty input is no-op when no chips', async () => {
    const user = userEvent.setup();
    const { onChange } = setup([]);
    const input = screen.getByLabelText('키워드 입력') as HTMLInputElement;
    input.focus();
    await user.keyboard('{Backspace}');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('clicking X on chip removes that chip', async () => {
    const user = userEvent.setup();
    const { onChange } = setup(['버그', '문의']);
    await user.click(screen.getByLabelText('버그 제거'));
    expect(onChange).toHaveBeenCalledWith(['문의']);
  });

  it('case-insensitive duplicate shows inline error and does not call onChange', async () => {
    const user = userEvent.setup();
    const { onChange } = setup(['bug']);
    const input = screen.getByLabelText('키워드 입력') as HTMLInputElement;
    await user.type(input, 'Bug{Enter}');
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('이미 추가된 키워드입니다');
  });

  it('exceeding max shows max error and does not call onChange', async () => {
    const user = userEvent.setup();
    const { onChange } = setup(['a', 'b'], { max: 2 });
    const input = screen.getByLabelText('키워드 입력') as HTMLInputElement;
    await user.type(input, 'c{Enter}');
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('최대 2개까지 추가할 수 있습니다');
  });

  it('whitespace-only commit is a no-op', async () => {
    const user = userEvent.setup();
    const { onChange } = setup([]);
    const input = screen.getByLabelText('키워드 입력') as HTMLInputElement;
    await user.type(input, '   {Enter}');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders Korean default placeholder', () => {
    setup([]);
    const input = screen.getByLabelText('키워드 입력') as HTMLInputElement;
    expect(input.placeholder).toBe('키워드 입력 후 Enter (쉼표로도 추가 가능)');
  });
});
