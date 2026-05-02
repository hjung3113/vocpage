import { render, screen, fireEvent } from '@testing-library/react';
import { VocSubRow } from '../VocSubRow';

describe('VocSubRow', () => {
  it('renders with status and title', () => {
    render(<VocSubRow status="접수" title="테스트 항목" />);
    expect(screen.getByTestId('voc-sub-row')).toBeInTheDocument();
  });

  it('renders VocStatusBadge for given status', () => {
    render(<VocSubRow status="검토중" title="테스트 항목" />);
    expect(screen.getByTestId('status-badge-검토중')).toBeInTheDocument();
  });

  it('renders title in voc-sub-row-title testid element', () => {
    render(<VocSubRow status="접수" title="이슈 제목" />);
    expect(screen.getByTestId('voc-sub-row-title')).toHaveTextContent('이슈 제목');
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<VocSubRow status="완료" title="클릭 테스트" onClick={onClick} />);
    fireEvent.click(screen.getByTestId('voc-sub-row'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders trailing prop content when provided', () => {
    render(
      <VocSubRow
        status="접수"
        title="트레일링"
        trailing={<span data-testid="trailing-slot">AV</span>}
      />,
    );
    expect(screen.getByTestId('trailing-slot')).toBeInTheDocument();
  });

  it('has aria-label="서브태스크 {title} 열기"', () => {
    render(<VocSubRow status="처리중" title="제목A" />);
    expect(screen.getByTestId('voc-sub-row')).toHaveAttribute(
      'aria-label',
      '서브태스크 제목A 열기',
    );
  });
});
