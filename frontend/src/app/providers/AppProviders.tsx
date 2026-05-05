import React from 'react';
import { AuthProvider } from '@features/auth/model/AuthContext';
import { NotificationProvider } from '@features/voc/notification/model/NotificationContext';
import { MasterCacheProvider } from '@features/master-cache/model/MasterCacheContext';
import { VocFilterProvider } from '@features/voc/list/model/VocFilterContext';

const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MasterCacheProvider>
          <VocFilterProvider>{children}</VocFilterProvider>
        </MasterCacheProvider>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default AppProviders;
