import { TextMark } from '@shared/ui/badge';

export interface VocTagPillProps {
  name: string;
}

export function VocTagPill({ name }: VocTagPillProps) {
  return (
    <span data-testid="voc-tag-pill" data-tag-name={name}>
      <TextMark
        variant="tag"
        iconMode="icon+text"
        icon="#"
        label={name}
        size="xs"
        weight={500}
        color="var(--text-quaternary)"
        extraTestId="text-mark-tag"
        ariaLabelOverride={`태그 ${name}`}
      />
    </span>
  );
}
