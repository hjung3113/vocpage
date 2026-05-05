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

export function formatActivityTime(iso: string) {
  return iso.slice(0, 16).replace('T', ' ');
}
