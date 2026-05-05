export { formatActivityTime } from '../lib/formatActivityTime';

interface Props {
  userId: string;
}

export function ActivityAvatar({ userId }: Props) {
  const initial = userId[0]?.toUpperCase() ?? '?';
  return (
    <span
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
      style={{ background: 'var(--brand-bg)', color: 'var(--brand)' }}
      aria-hidden
    >
      {initial}
    </span>
  );
}
