/**
 * NavItemCountBadge — Sidebar nav-item right-slot for unread count + Urgent dot.
 *
 * Spec: uidesign.md §14.10 (count badge tokens) + feature-voc.md §8.6 (🔴! Urgent).
 * Used by Sidebar `/notifications` (count + Urgent), `/notice`, `/faq` (count only).
 * Wave 5 Phase B (W5-D8) — FU-008 absorbed.
 */
interface NavItemCountBadgeProps {
  count: number;
  /** Show 🔴! Urgent indicator next to the count. /notifications only. */
  urgent?: boolean;
  /** Optional aria-label override for the count badge (defaults to `${count} 미읽음`). */
  countAriaLabel?: string;
  /** Optional aria-label for the Urgent indicator. */
  urgentAriaLabel?: string;
  /** data-testid prefix; component appends `-count` / `-urgent`. */
  testId?: string;
}

function formatCount(count: number): string {
  return count > 99 ? '99+' : String(count);
}

export function NavItemCountBadge({
  count,
  urgent = false,
  countAriaLabel,
  urgentAriaLabel = '긴급',
  testId,
}: NavItemCountBadgeProps) {
  if (count <= 0 && !urgent) return null;

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      {urgent ? (
        <span
          data-testid={testId ? `${testId}-urgent` : undefined}
          aria-label={urgentAriaLabel}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '16px',
            height: '16px',
            padding: '0 4px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 600,
            lineHeight: 1,
            background: 'var(--status-red)',
            color: 'var(--bg-elevated)',
          }}
        >
          !
        </span>
      ) : null}
      {count > 0 ? (
        <span
          data-testid={testId ? `${testId}-count` : undefined}
          aria-label={countAriaLabel ?? `${count} 미읽음`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 700,
            lineHeight: 1,
            background: 'var(--brand)',
            color: 'var(--text-on-brand)',
            borderRadius: '9999px',
            padding: '1px 6px',
          }}
        >
          {formatCount(count)}
        </span>
      ) : null}
    </span>
  );
}
