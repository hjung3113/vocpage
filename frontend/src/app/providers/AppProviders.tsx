import React from 'react';
import { AuthProvider } from '@features/auth/model/AuthContext';
import { NotificationProvider } from '@features/notification/model/NotificationContext';
import { MasterCacheProvider } from '@features/master-cache/model/MasterCacheContext';
import { VOCFilterProvider } from '@features/voc-list-filter/model/VocFilterContext';

const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MasterCacheProvider>
          <VOCFilterProvider>{children}</VOCFilterProvider>
        </MasterCacheProvider>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default AppProviders;
