import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './ThemeContext';
import { AuthProvider } from './AuthContext';
import { NotificationProvider } from './NotificationContext';
import { MasterCacheProvider } from './MasterCacheContext';
import { VOCFilterProvider } from './VOCFilterContext';
import { VOCDrawerProvider } from './VOCDrawerContext';

const queryClient = new QueryClient();

const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
};

export default AppProviders;
