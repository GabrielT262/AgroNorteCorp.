
import * as React from 'react';
import DashboardProvider from '../dashboard-provider';
import SettingsClient from './settings-client';
import { getCurrentUser } from '@/lib/db';

export default async function SettingsPage({ searchParams }: { searchParams: { userId?: string } }) {
    const currentUser = await getCurrentUser(searchParams.userId);
    
    if (!currentUser) {
        return <div>Usuario no encontrado o error de base de datos. Por favor, inicia sesión.</div>;
    }
    
    return (
        <DashboardProvider searchParams={searchParams}>
            <SettingsClient currentUser={currentUser} />
        </DashboardProvider>
    );
}
