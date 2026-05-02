import { UserX } from 'lucide-react';

const COLOR_CLASSES = ['steel', 'teal', 'violet'] as const;
type AvatarColorClass = (typeof COLOR_CLASSES)[number];

const COLOR_VAR: Record<AvatarColorClass, string> = {
  steel: 'var(--avatar-steel)',
  teal: 'var(--avatar-teal)',
  violet: 'var(--avatar-violet)',
};

function hashToBucket(name: string): AvatarColorClass {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) {
    h = (h * 31 + name.charCodeAt(i)) | 0;
  }
  return COLOR_CLASSES[Math.abs(h) % COLOR_CLASSES.length] as AvatarColorClass;
}

const ROW_STYLE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '11.5px',
  color: 'var(--text-tertiary)',
};

const CIRCLE_BASE: React.CSSProperties = {
  width: '22px',
  height: '22px',
  borderRadius: '50%',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '9.5px',
  fontWeight: 700,
  color: 'var(--text-on-brand)',
  flexShrink: 0,
};

export function VocAssignee({ name }: { name: string | null }) {
  if (!name) {
    return (
      <span
        data-pcomp="VocAssignee"
        data-testid="assignee-unassigned"
        aria-label="미배정"
        style={{ ...ROW_STYLE, color: 'var(--text-quaternary)' }}
      >
        <UserX aria-hidden="true" className="lucide lucide-user-x" width={15} height={15} />
        미배정
      </span>
    );
  }

  const colorClass = hashToBucket(name);
  const initial = Array.from(name)[0] ?? '';

  return (
    <span
      data-pcomp="VocAssignee"
      data-testid={`assignee-${colorClass}`}
      aria-label={`담당자 ${name}`}
      style={ROW_STYLE}
    >
      <span aria-hidden="true" style={{ ...CIRCLE_BASE, background: COLOR_VAR[colorClass] }}>
        {initial}
      </span>
      {name}
    </span>
  );
}
