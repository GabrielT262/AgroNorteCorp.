
import * as React from 'react';
import DashboardProvider from '../dashboard-provider';
import CompanySettingsClient from './company-settings-client';

export default async function CompanySettingsPage({ searchParams }: { searchParams: { userId?: string } }) {
  return (
    <DashboardProvider searchParams={searchParams}>
      <CompanySettingsClient />
    </DashboardProvider>
  );
}
