import { Eye, EyeOff, Lock } from 'lucide-react';

interface WidgetEditBarProps {
  name: string;
  visible: boolean;
  onToggleVisibility: () => void;
}

export function WidgetEditBar({ name, visible, onToggleVisibility }: WidgetEditBarProps) {
  return (
    <div className="widget-edit-bar">
      <span className="widget-edit-grip">≡</span>
      <span className="widget-edit-name">{name}</span>
      <button className="widget-vis-btn" onClick={onToggleVisibility} type="button">
        {visible ? <Eye size={12} /> : <EyeOff size={12} />}
      </button>
      <button className="widget-lock-btn" type="button">
        <Lock size={12} />
      </button>
    </div>
  );
}
