'use server';

import * as React from 'react';
import { getOrders, getCurrentUser } from '@/lib/db';
import { RequestsClient } from './requests-client';
import DashboardProvider from '../dashboard-provider';

export default async function RequestsPage({ searchParams }: { searchParams: { userId?: string } }) {
    const currentUser = await getCurrentUser(searchParams.userId);
    const orders = await getOrders();
    
    return (
        <DashboardProvider searchParams={searchParams}>
            <RequestsClient initialOrders={orders} currentUser={currentUser} />
        </DashboardProvider>
    );
}
