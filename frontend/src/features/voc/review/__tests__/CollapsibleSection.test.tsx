import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CollapsibleSection } from '../ui/CollapsibleSection';

describe('CollapsibleSection', () => {
  it('제목과 children을 렌더링한다', () => {
    render(
      <CollapsibleSection title="Details">
        <p>content</p>
      </CollapsibleSection>,
    );
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('defaultOpen=true면 children이 보인다', () => {
    render(
      <CollapsibleSection title="Details" defaultOpen>
        <p>visible content</p>
      </CollapsibleSection>,
    );
    expect(screen.getByText('visible content')).toBeInTheDocument();
  });

  it('defaultOpen=false면 children이 숨겨진다', () => {
    render(
      <CollapsibleSection title="Details" defaultOpen={false}>
        <p>hidden content</p>
      </CollapsibleSection>,
    );
    expect(screen.queryByText('hidden content')).not.toBeInTheDocument();
  });

  it('헤더 버튼 클릭 시 접힌다', async () => {
    const user = userEvent.setup();
    render(
      <CollapsibleSection title="Details">
        <p>content</p>
      </CollapsibleSection>,
    );
    await user.click(screen.getByRole('button', { name: /details/i }));
    expect(screen.queryByText('content')).not.toBeInTheDocument();
  });

  it('접힌 상태에서 클릭 시 펼쳐진다', async () => {
    const user = userEvent.setup();
    render(
      <CollapsibleSection title="Details" defaultOpen={false}>
        <p>content</p>
      </CollapsibleSection>,
    );
    await user.click(screen.getByRole('button', { name: /details/i }));
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('열린 상태: aria-expanded=true', () => {
    render(
      <CollapsibleSection title="Details">
        <p>c</p>
      </CollapsibleSection>,
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  });

  it('접힌 상태: aria-expanded=false', () => {
    render(
      <CollapsibleSection title="Details" defaultOpen={false}>
        <p>c</p>
      </CollapsibleSection>,
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
  });

  it('제목 텍스트가 bold(font-semibold)다', () => {
    render(
      <CollapsibleSection title="Details">
        <p>c</p>
      </CollapsibleSection>,
    );
    const title = screen.getByText('Details');
    expect(title).toHaveClass('font-semibold');
  });

  it('chevron이 열린 상태에서 아래를 향한다(rotate-0)', () => {
    render(
      <CollapsibleSection title="Details">
        <p>c</p>
      </CollapsibleSection>,
    );
    const chevron = document.querySelector('svg');
    expect(chevron).not.toHaveClass('-rotate-90');
  });

  it('chevron이 접힌 상태에서 오른쪽을 향한다(-rotate-90)', () => {
    render(
      <CollapsibleSection title="Details" defaultOpen={false}>
        <p>c</p>
      </CollapsibleSection>,
    );
    const chevron = document.querySelector('svg');
    expect(chevron).toHaveClass('-rotate-90');
  });
});
