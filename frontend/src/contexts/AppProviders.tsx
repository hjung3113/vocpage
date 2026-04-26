import React from 'react';
import { ThemeProvider } from './ThemeContext';
import { AuthProvider } from './AuthContext';
import { NotificationProvider } from './NotificationContext';
import { MasterCacheProvider } from './MasterCacheContext';
import { VOCFilterProvider } from './VOCFilterContext';
import { VOCDrawerProvider } from './VOCDrawerContext';

const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <MasterCacheProvider>
            <VOCFilterProvider>
              <VOCDrawerProvider>{children}</VOCDrawerProvider>
            </VOCFilterProvider>
          </MasterCacheProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default AppProviders;
