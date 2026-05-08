import { TextMark } from '@shared/ui/badge';
import { getVocTypeIconConfig } from '../model/vocType';

export interface VocTypeBadgeProps {
  slug: string;
  name: string;
  color?: string;
  iconOnly?: boolean;
}

export function VocTypeBadge({ slug, name, iconOnly = false }: VocTypeBadgeProps) {
  const { Icon, color, weight, isUnknown } = getVocTypeIconConfig(slug);
  const variant = isUnknown ? 'unknown' : slug;

  return (
    <TextMark
      variant={variant}
      iconMode={iconOnly ? 'icon-only' : 'icon+text'}
      icon={Icon}
      label={name}
      color={color}
      weight={weight}
      extraTestId={isUnknown ? 'text-mark-unknown' : `voc-type-badge-${slug}`}
      ariaLabelOverride={`유형 ${name}`}
    />
  );
}
