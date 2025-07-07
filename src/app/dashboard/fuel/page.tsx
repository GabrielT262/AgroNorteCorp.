'use server';

import * as React from 'react';
import { getFuelHistory, getFuelLevels, getCurrentUser } from '@/lib/db';
import { FuelClient } from './fuel-client';
import DashboardProvider from '../dashboard-provider';

export default async function FuelPage({ searchParams }: { searchParams: { userId?: string } }) {
    const currentUser = await getCurrentUser(searchParams.userId);
    const [history, levels] = await Promise.all([
        getFuelHistory(),
        getFuelLevels(),
    ]);

    return (
        <DashboardProvider searchParams={searchParams}>
            <FuelClient 
                initialHistory={history}
                initialLevels={levels}
                currentUser={currentUser}
            />
        </DashboardProvider>
    );
}
