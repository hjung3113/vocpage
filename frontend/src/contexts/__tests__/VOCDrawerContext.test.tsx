import { render, screen, act } from '@testing-library/react';
import { useContext } from 'react';
import { vi } from 'vitest';
import { VOCDrawerContext, VOCDrawerProvider } from '../VOCDrawerContext';

function TestConsumer() {
  const ctx = useContext(VOCDrawerContext)!;
  return (
    <div>
      <div data-testid="isOpen">{String(ctx.isOpen)}</div>
      <div data-testid="vocId">{String(ctx.selectedVocId)}</div>
      <button onClick={() => ctx.openDrawer('voc-123')} data-testid="open">
        open
      </button>
      <button onClick={() => ctx.closeDrawer()} data-testid="close">
        close
      </button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <VOCDrawerProvider>
      <TestConsumer />
    </VOCDrawerProvider>,
  );
}

test('openDrawer: isOpen=true, selectedVocId 설정', () => {
  renderWithProvider();

  act(() => {
    screen.getByTestId('open').click();
  });

  expect(screen.getByTestId('isOpen').textContent).toBe('true');
  expect(screen.getByTestId('vocId').textContent).toBe('voc-123');
});

test('closeDrawer: isOpen=false 즉시, selectedVocId는 300ms 후 null', () => {
  vi.useFakeTimers();
  renderWithProvider();

  // Open first
  act(() => {
    screen.getByTestId('open').click();
  });
  expect(screen.getByTestId('isOpen').textContent).toBe('true');
  expect(screen.getByTestId('vocId').textContent).toBe('voc-123');

  // Close: isOpen becomes false immediately
  act(() => {
    screen.getByTestId('close').click();
  });
  expect(screen.getByTestId('isOpen').textContent).toBe('false');
  // selectedVocId still set (animation running)
  expect(screen.getByTestId('vocId').textContent).toBe('voc-123');

  // After 300ms, selectedVocId cleared
  act(() => {
    vi.advanceTimersByTime(300);
  });
  expect(screen.getByTestId('vocId').textContent).toBe('null');

  vi.useRealTimers();
});

test('unmount 시 timer cleanup — pending setTimeout 취소', () => {
  vi.useFakeTimers();
  const { unmount } = renderWithProvider();

  act(() => {
    screen.getByTestId('open').click();
  });
  act(() => {
    screen.getByTestId('close').click();
  });
  // timer is pending; unmount before it fires
  unmount();
  // advancing timer after unmount should not throw
  expect(() => act(() => vi.advanceTimersByTime(300))).not.toThrow();

  vi.useRealTimers();
});

test('closeDrawer 중 openDrawer 호출 시 selectedVocId가 null로 덮어쓰이지 않음', () => {
  vi.useFakeTimers();
  renderWithProvider();

  act(() => {
    screen.getByTestId('open').click();
  });
  act(() => {
    screen.getByTestId('close').click();
  });
  // re-open before the 300ms timer fires
  act(() => {
    screen.getByTestId('open').click();
  });
  expect(screen.getByTestId('isOpen').textContent).toBe('true');
  expect(screen.getByTestId('vocId').textContent).toBe('voc-123');

  // advance past original timer — selectedVocId must still be voc-123
  act(() => {
    vi.advanceTimersByTime(300);
  });
  expect(screen.getByTestId('vocId').textContent).toBe('voc-123');

  vi.useRealTimers();
});
