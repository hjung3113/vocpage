import { TextMark } from '@shared/ui/badge';
import { getVocTypeIconConfig } from '../model/vocType';

export interface VocTypeBadgeProps {
  slug: string;
  name: string;
  color?: string;
}

export function VocTypeBadge({ slug, name }: VocTypeBadgeProps) {
  const { Icon, color, weight, isUnknown } = getVocTypeIconConfig(slug);
  const variant = isUnknown ? 'unknown' : slug;

  return (
    <TextMark
      variant={variant}
      iconMode="icon-only"
      icon={Icon}
      label={name}
      color={color}
      weight={weight}
      extraTestId={isUnknown ? 'text-mark-unknown' : `voc-type-badge-${slug}`}
      ariaLabelOverride={`유형 ${name}`}
    />
  );
}
