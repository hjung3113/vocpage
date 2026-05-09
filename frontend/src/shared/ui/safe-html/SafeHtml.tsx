import DOMPurify from 'dompurify';

interface SafeHtmlProps {
  html: string;
  className?: string;
  as?: 'div' | 'section';
  'data-testid'?: string;
}

/**
 * SafeHtml — renders sanitized HTML via DOMPurify.
 * Drop-in replacement for raw dangerouslySetInnerHTML usage.
 * Strips scripts, event handlers, and javascript: URIs.
 * Preserves target=_blank and forces rel="noopener noreferrer" on anchors.
 */
export function SafeHtml({ html, className, as: Tag = 'div', 'data-testid': testId }: SafeHtmlProps) {
  if (DOMPurify.isSupported) {
    DOMPurify.addHook('afterSanitizeAttributes', (node) => {
      if (node.tagName === 'A') {
        node.setAttribute('rel', 'noopener noreferrer');
      }
    });
  }

  const sanitized = DOMPurify.sanitize(html, {
    ADD_ATTR: ['target'],
  });

  return (
    <Tag
      className={className}
      data-testid={testId}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
