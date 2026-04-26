import './GlobalTabs.css';

interface GlobalTabsProps {
  systems: { id: string; name: string }[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function GlobalTabs({ systems, activeTab, onTabChange }: GlobalTabsProps) {
  return (
    <div className="global-tabs-container">
      <button
        className={`global-tab${activeTab === 'all' ? ' active' : ''}`}
        onClick={() => onTabChange('all')}
      >
        전체
      </button>
      {systems.map((s) => (
        <button
          key={s.id}
          className={`global-tab${activeTab === s.id ? ' active' : ''}`}
          onClick={() => onTabChange(s.id)}
        >
          {s.name}
        </button>
      ))}
    </div>
  );
}
