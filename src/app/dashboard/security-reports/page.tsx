
'use server';

import * as React from 'react';
import { getSecurityReports, getRegisteredVehicles, getCurrentUser } from '@/lib/db';
import { SecurityReportsClient } from './security-reports-client';
import DashboardProvider from '../dashboard-provider';

export default async function SecurityReportsPage({ searchParams }: { searchParams: { userId?: string } }) {
  const [reports, registeredVehicles, currentUser] = await Promise.all([
    getSecurityReports(),
    getRegisteredVehicles(),
    getCurrentUser(searchParams.userId),
  ]);

  return (
    <DashboardProvider searchParams={searchParams}>
        <SecurityReportsClient
            initialReports={reports} 
            initialRegisteredVehicles={registeredVehicles}
            currentUser={currentUser} 
        />
    </DashboardProvider>
  );
}
