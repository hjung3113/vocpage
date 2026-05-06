import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { EditableField } from '../EditableField';

describe('EditableField', () => {
  it('기본적으로 span 형태(non-editing)로 렌더된다', () => {
    render(<EditableField value="hello" onChange={vi.fn()} />);
    expect(screen.getByText('hello')).toBeTruthy();
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('클릭하면 input이 나타난다', async () => {
    const user = userEvent.setup();
    render(<EditableField value="hello" onChange={vi.fn()} />);
    await user.click(screen.getByText('hello'));
    expect(screen.getByRole('textbox')).toBeTruthy();
  });

  it('Enter로 저장된다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<EditableField value="hello" onChange={onChange} />);
    await user.click(screen.getByText('hello'));
    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'world');
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith('world');
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('Esc로 취소하면 이전 값이 복구된다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<EditableField value="hello" onChange={onChange} />);
    await user.click(screen.getByText('hello'));
    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'world');
    await user.keyboard('{Escape}');
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('hello')).toBeTruthy();
  });

  it('disabled=true 이면 클릭해도 편집 모드 진입 안 됨', async () => {
    const user = userEvent.setup();
    render(<EditableField value="hello" onChange={vi.fn()} disabled />);
    await user.click(screen.getByText('hello'));
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('multiline=true 이면 textarea를 사용하고 Enter는 줄바꿈', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<EditableField value="hello" onChange={onChange} multiline />);
    await user.click(screen.getByText('hello'));
    // textarea는 role='textbox'로도 쿼리됨
    const textarea = screen.getByRole('textbox');
    expect(textarea.tagName).toBe('TEXTAREA');
    // Enter 입력은 onChange 호출하지 않고 줄바꿈
    await user.type(textarea, '{Enter}');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('값이 비어있을 때 placeholder가 보인다', () => {
    render(<EditableField value="" onChange={vi.fn()} placeholder="내용 입력" />);
    expect(screen.getByText('내용 입력')).toBeTruthy();
  });

  it('비편집 상태에서 hover 클래스(bg-hover)가 있어야 함 (어포던스)', () => {
    render(<EditableField value="hello" onChange={vi.fn()} />);
    const el = screen.getByRole('button');
    expect(el.className).toMatch(/bg-hover/);
  });

  it('disabled=true 이면 role=button이 아닌 span이고 hover 클래스 없음', () => {
    render(<EditableField value="hello" onChange={vi.fn()} disabled />);
    expect(screen.queryByRole('button')).toBeNull();
    // disabled span에는 bg-hover 클래스가 없어야 함
    const span = screen.getByText('hello');
    expect(span.className).not.toMatch(/bg-hover/);
  });
});
