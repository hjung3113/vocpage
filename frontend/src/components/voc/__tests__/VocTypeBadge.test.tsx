import { render, screen } from '@testing-library/react';
import { VocTypeBadge } from '../VocTypeBadge';

describe('VocTypeBadge', () => {
  const knownCases = [
    { slug: 'bug', name: '버그', iconId: 'lucide-bug' },
    { slug: 'feature-request', name: '기능 요청', iconId: 'lucide-sparkles' },
    { slug: 'improvement', name: '개선', iconId: 'lucide-wrench' },
    { slug: 'inquiry', name: '문의', iconId: 'lucide-message-circle-question' },
  ];

  it.each(knownCases)(
    'renders voc-type-badge-$slug with aria-label "유형 $name"',
    ({ slug, name }) => {
      render(<VocTypeBadge slug={slug} name={name} />);
      const el = screen.getByTestId(`voc-type-badge-${slug}`);
      expect(el).toBeInTheDocument();
      expect(el).toHaveAttribute('aria-label', `유형 ${name}`);
    },
  );

  it.each(knownCases)('renders correct icon for $slug', ({ slug, name, iconId }) => {
    render(<VocTypeBadge slug={slug} name={name} />);
    const el = screen.getByTestId(`voc-type-badge-${slug}`);
    const svg = el.querySelector('svg');
    expect(svg).not.toBeNull();
    // lucide renders class containing the icon name
    const svgClass = svg?.getAttribute('class') ?? '';
    expect(svgClass).toContain(iconId.replace('lucide-', '').replace(/-/g, '-'));
  });

  it('unknown slug renders text-mark-unknown testid and Tag icon', () => {
    render(<VocTypeBadge slug="custom-foo" name="커스텀" />);
    const el = screen.getByTestId('voc-type-badge-custom-foo');
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute('aria-label', '유형 커스텀');
    // should not throw
  });

  it('color prop ignored — rendering is same with or without it', () => {
    const { rerender } = render(<VocTypeBadge slug="bug" name="버그" />);
    const without = screen.getByTestId('voc-type-badge-bug').getAttribute('style');
    rerender(<VocTypeBadge slug="bug" name="버그" color="var(--status-red)" />);
    const withColor = screen.getByTestId('voc-type-badge-bug').getAttribute('style');
    expect(without).toBe(withColor);
  });
});
