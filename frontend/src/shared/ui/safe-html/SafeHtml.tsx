import DOMPurify from 'dompurify';
import type { Config } from 'dompurify';

const SAFE_HTML_CONFIG: Config = {
  ADD_ATTR: ['target'],
  USE_PROFILES: { html: true },
};

if (DOMPurify.isSupported) {
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });
}

interface SafeHtmlProps {
  html: string;
  className?: string;
  as?: 'div' | 'section';
  'data-testid'?: string;
}

/**
 * SafeHtml — renders sanitized HTML via DOMPurify.
 * Strips scripts, event handlers, and javascript: URIs.
 * Preserves target=_blank and forces rel="noopener noreferrer" on anchors.
 */
export function SafeHtml({ html, className, as: Tag = 'div', 'data-testid': testId }: SafeHtmlProps) {
  const sanitized = DOMPurify.sanitize(html, SAFE_HTML_CONFIG) as string;

  return (
    <Tag
      className={className}
      data-testid={testId}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
