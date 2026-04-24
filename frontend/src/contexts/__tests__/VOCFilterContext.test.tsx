import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useContext } from 'react';
import { VOCFilterContext, VOCFilterProvider } from '../VOCFilterContext';

function TestConsumer() {
  const ctx = useContext(VOCFilterContext)!;
  return (
    <div>
      <div data-testid="systemId">{String(ctx.filters.systemId)}</div>
      <div data-testid="keyword">{ctx.filters.keyword}</div>
      <div data-testid="tagIds">{ctx.filters.tagIds.join(',')}</div>
      <div data-testid="status">{String(ctx.filters.status)}</div>
      <div data-testid="activeCount">{ctx.activeFilterCount}</div>
      <button onClick={() => ctx.setFilter('keyword', 'hello')} data-testid="setKeyword">
        set keyword
      </button>
      <button onClick={() => ctx.setFilter('keyword', '   ')} data-testid="setKeywordWhitespace">
        set keyword whitespace
      </button>
      <button onClick={() => ctx.setFilter('source', 'manual')} data-testid="setSourceManual">
        set source manual
      </button>
      <button onClick={() => ctx.resetFilters()} data-testid="reset">
        reset
      </button>
      <button
        onClick={() => ctx.setFilters({ systemId: 'sys-1', status: '접수' })}
        data-testid="setMultiple"
      >
        set multiple
      </button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <VOCFilterProvider>
      <TestConsumer />
    </VOCFilterProvider>,
  );
}

test('초기값: 모든 필드 null/빈 배열/빈 문자열, activeFilterCount=0', () => {
  renderWithProvider();
  expect(screen.getByTestId('systemId').textContent).toBe('null');
  expect(screen.getByTestId('keyword').textContent).toBe('');
  expect(screen.getByTestId('tagIds').textContent).toBe('');
  expect(screen.getByTestId('status').textContent).toBe('null');
  expect(screen.getByTestId('activeCount').textContent).toBe('0');
});

test('setFilter: 단일 키 변경', async () => {
  const user = userEvent.setup();
  renderWithProvider();

  await user.click(screen.getByTestId('setKeyword'));

  expect(screen.getByTestId('keyword').textContent).toBe('hello');
  expect(screen.getByTestId('activeCount').textContent).toBe('1');
});

test('resetFilters 후 초기값 복귀', async () => {
  const user = userEvent.setup();
  renderWithProvider();

  await user.click(screen.getByTestId('setKeyword'));
  expect(screen.getByTestId('activeCount').textContent).toBe('1');

  await user.click(screen.getByTestId('reset'));

  expect(screen.getByTestId('keyword').textContent).toBe('');
  expect(screen.getByTestId('activeCount').textContent).toBe('0');
});

test('keyword가 공백만 있을 때 activeFilterCount 0', async () => {
  const user = userEvent.setup();
  renderWithProvider();

  await user.click(screen.getByTestId('setKeywordWhitespace'));

  expect(screen.getByTestId('activeCount').textContent).toBe('0');
});

test('source=manual 설정 시 activeFilterCount 증가', async () => {
  const user = userEvent.setup();
  renderWithProvider();

  await user.click(screen.getByTestId('setSourceManual'));

  expect(screen.getByTestId('activeCount').textContent).toBe('1');
});

test('activeFilterCount: 여러 필드 설정 시 정확한 카운트', async () => {
  const user = userEvent.setup();
  renderWithProvider();

  await user.click(screen.getByTestId('setMultiple'));

  // systemId='sys-1' and status='접수' → count=2
  expect(screen.getByTestId('activeCount').textContent).toBe('2');
});
