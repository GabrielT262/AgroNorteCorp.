'use server';

import * as React from 'react';
import { getCommunications, getCurrentUser } from '@/lib/db';
import { CommunicationsClient } from './communications-client';
import DashboardProvider from '../dashboard-provider';

export default async function CommunicationsPage({ searchParams }: { searchParams: { userId?: string } }) {
    const currentUser = await getCurrentUser(searchParams.userId);
    const communications = await getCommunications();
    
    return (
        <DashboardProvider searchParams={searchParams}>
            <CommunicationsClient
                initialCommunications={communications}
                currentUser={currentUser}
            />
        </DashboardProvider>
    );
}
