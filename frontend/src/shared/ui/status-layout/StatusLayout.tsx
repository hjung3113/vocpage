import type React from 'react';
import { cn } from '@shared/lib/cn';

export interface StatusLayoutProps {
  role?: React.AriaRole;
  className?: string;
  children: React.ReactNode;
}

export function StatusLayout({ role, className, children }: StatusLayoutProps) {
  return (
    <div
      role={role}
      className={cn('flex flex-col items-center justify-center gap-3 py-16 text-center', className)}
    >
      {children}
    </div>
  );
}
