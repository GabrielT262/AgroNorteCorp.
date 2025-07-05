'use server';

import * as React from 'react';
import { getFuelHistory, getFuelLevels } from '@/lib/db';
import type { User } from '@/lib/types';
import { FuelClient } from './fuel-client';

const currentUser: User = { name: 'Gabriel T', role: 'Administrador', area: 'Administrador' };

export default async function FuelPage() {
    const [history, levels] = await Promise.all([
        getFuelHistory(),
        getFuelLevels(),
    ]);

    return (
        <FuelClient 
            initialHistory={history}
            initialLevels={levels}
            currentUser={currentUser}
        />
    );
}
