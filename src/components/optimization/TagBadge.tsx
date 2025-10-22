/**
 * TagBadge - Reusable colored badge for RADAR tags
 *
 * Displays tag values with colors from tagsSchema
 * Used in: OptimizationCard, RadarDrawer
 */

import { Badge } from "@/components/ui/badge";
import { TAGS_SCHEMA } from "@/config/tagsSchema";

interface TagBadgeProps {
  sectionKey: string; // 'registro', 'anomalia', etc
  categoryKey: string; // 'panorama', 'acoes_executadas', etc
  value: string; // The tag value ('Bom', 'CPA alto', etc)
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'filled';
}

export function TagBadge({
  sectionKey,
  categoryKey,
  value,
  size = 'sm',
  variant = 'outline'
}: TagBadgeProps) {
  // Find color from schema
  const section = TAGS_SCHEMA[sectionKey];
  const category = section?.categories.find((cat) => cat.key === categoryKey);
  const option = category?.options.find((opt) => opt.value === value);

  const color = option?.color || '#808080'; // Default gray

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <Badge
      variant={variant}
      className={sizeClasses[size]}
      style={{
        borderColor: color,
        backgroundColor: variant === 'filled' ? color : `${color}15`, // 15 = 8% opacity
        color: variant === 'filled' ? '#fff' : color,
      }}
    >
      {value}
    </Badge>
  );
}

/**
 * TagBadgeList - Render multiple tags with proper spacing
 */
interface TagBadgeListProps {
  tags: { section: string; category: string; value: string }[];
  maxVisible?: number; // Show "+X more" if exceeds
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'filled';
}

export function TagBadgeList({ tags, maxVisible, size = 'sm', variant = 'outline' }: TagBadgeListProps) {
  const visible = maxVisible ? tags.slice(0, maxVisible) : tags;
  const remaining = maxVisible && tags.length > maxVisible ? tags.length - maxVisible : 0;

  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((tag, idx) => (
        <TagBadge
          key={`${tag.section}-${tag.category}-${tag.value}-${idx}`}
          sectionKey={tag.section}
          categoryKey={tag.category}
          value={tag.value}
          size={size}
          variant={variant}
        />
      ))}
      {remaining > 0 && (
        <Badge variant="secondary" className={sizeClasses[size]}>
          +{remaining} mais
        </Badge>
      )}
    </div>
  );
}

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};
