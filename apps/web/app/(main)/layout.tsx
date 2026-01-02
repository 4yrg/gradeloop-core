import React from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return <DashboardLayout>{children}</DashboardLayout>;
};

export default MainLayout;
