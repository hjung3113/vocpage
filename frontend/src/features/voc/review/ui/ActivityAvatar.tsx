import { Avatar, AvatarFallback } from '@shared/ui/avatar';

interface Props {
  userId: string;
}

export function ActivityAvatar({ userId }: Props) {
  const initial = userId[0]?.toUpperCase() ?? '?';
  return (
    <Avatar className="h-7 w-7 shrink-0 text-xs font-semibold">
      <AvatarFallback style={{ background: 'var(--brand-bg)', color: 'var(--brand)' }}>
        {initial}
      </AvatarFallback>
    </Avatar>
  );
}
