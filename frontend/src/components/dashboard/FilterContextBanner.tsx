import { DashboardFilterState } from '../../hooks/useDashboardFilter';
import './FilterContextBanner.css';

interface FilterContextBannerProps {
  filter: DashboardFilterState;
  systemName?: string;
  menuName?: string;
  assigneeName?: string;
}

export function FilterContextBanner({
  filter,
  systemName,
  menuName,
  assigneeName,
}: FilterContextBannerProps) {
  const isVisible = filter.globalTab !== 'all' || filter.activeAssignee !== null;

  const segments: string[] = [];
  if (systemName) segments.push(systemName);
  if (menuName) segments.push(menuName);
  if (assigneeName) segments.push(`담당자: ${assigneeName}`);
  const label = segments.length > 0 ? segments.join(' › ') : '전체';

  return <div className={`filter-context-banner${isVisible ? ' visible' : ''}`}>{label}</div>;
}
