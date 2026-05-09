/**
 * SafeHtml — XSS sanitization tests (TDD RED → GREEN).
 * Verifies DOMPurify strips dangerous content before rendering.
 */
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SafeHtml } from './SafeHtml';

describe('SafeHtml', () => {
  it('strips <script> tags', () => {
    const { container } = render(
      <SafeHtml html={"<p>hello</p><script>alert('xss')</script>"} />,
    );
    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toContain('hello');
  });

  it('removes onerror attribute from <img>', () => {
    const { container } = render(
      <SafeHtml html={'<img src="x" onerror="alert(1)">'} />,
    );
    const img = container.querySelector('img');
    // DOMPurify removes onerror; img itself may be kept or removed depending on config
    expect(img?.getAttribute('onerror')).toBeNull();
  });

  it('strips javascript: hrefs from <a>', () => {
    const { container } = render(
      <SafeHtml html={'<a href="javascript:alert(1)">click</a>'} />,
    );
    const anchor = container.querySelector('a');
    const href = anchor?.getAttribute('href') ?? '';
    expect(href).not.toMatch(/^javascript:/i);
  });

  it('passes through safe https hrefs', () => {
    const { container } = render(
      <SafeHtml html={'<a href="https://example.com">link</a>'} />,
    );
    const anchor = container.querySelector('a');
    expect(anchor?.getAttribute('href')).toBe('https://example.com');
  });

  it('passes through safe markup like <b>', () => {
    const { container } = render(<SafeHtml html={'<b>safe</b>'} />);
    expect(container.querySelector('b')).not.toBeNull();
    expect(container.textContent).toBe('safe');
  });

  it('strips SVG and MathML namespaces from rich text', () => {
    const { container } = render(
      <SafeHtml
        html={
          '<svg><a href="https://example.com"><text>svg</text></a></svg><math><mi>math</mi></math><p>safe</p>'
        }
      />,
    );

    expect(container.querySelector('svg')).toBeNull();
    expect(container.querySelector('math')).toBeNull();
    expect(container.textContent).toContain('safe');
  });

  it('forces noopener noreferrer on target blank anchors', () => {
    const { container } = render(
      <SafeHtml html={'<a href="https://example.com" target="_blank">link</a>'} />,
    );

    const anchor = container.querySelector('a');
    expect(anchor?.getAttribute('target')).toBe('_blank');
    expect(anchor?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('applies className to wrapper element', () => {
    const { container } = render(
      <SafeHtml html={'<p>text</p>'} className="my-class" />,
    );
    expect(container.firstElementChild?.classList.contains('my-class')).toBe(true);
  });
});
