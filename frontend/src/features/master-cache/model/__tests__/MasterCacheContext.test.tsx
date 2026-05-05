import { render, screen, act } from '@testing-library/react';
import { useContext } from 'react';
import { MasterCacheContext, MasterCacheProvider } from '../MasterCacheContext';

function TestConsumer() {
  const ctx = useContext(MasterCacheContext)!;
  return (
    <div>
      <div data-testid="isSnapshotMode">{String(ctx.isSnapshotMode)}</div>
      <button onClick={() => ctx.setSnapshotMode(true)} data-testid="enableSnapshot">
        enable
      </button>
      <button onClick={() => ctx.setSnapshotMode(false)} data-testid="disableSnapshot">
        disable
      </button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <MasterCacheProvider>
      <TestConsumer />
    </MasterCacheProvider>,
  );
}

test('초기값 isSnapshotMode=false', () => {
  renderWithProvider();
  expect(screen.getByTestId('isSnapshotMode').textContent).toBe('false');
});

test('setSnapshotMode(true) 후 isSnapshotMode=true', () => {
  renderWithProvider();

  act(() => {
    screen.getByTestId('enableSnapshot').click();
  });

  expect(screen.getByTestId('isSnapshotMode').textContent).toBe('true');
});

test('setSnapshotMode(false) 후 isSnapshotMode=false로 복귀', () => {
  renderWithProvider();

  act(() => {
    screen.getByTestId('enableSnapshot').click();
  });
  act(() => {
    screen.getByTestId('disableSnapshot').click();
  });

  expect(screen.getByTestId('isSnapshotMode').textContent).toBe('false');
});
