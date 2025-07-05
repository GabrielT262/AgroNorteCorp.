'use server';

import * as React from 'react';
import type { User } from '@/lib/types';
import { getOrders } from '@/lib/db';
import { RequestsClient } from './requests-client';

// Hardcoded current user for demonstration
const currentUser: User = { name: 'Gabriel T', role: 'Administrador', area: 'Administrador' };
// To test other roles, change the currentUser object above to:
// const currentUser: User = { name: 'Ana G', role: 'Usuario', area: 'Gerencia' };
// const currentUser: User = { name: 'Carlos P', role: 'Usuario', area: 'Almacén' };
// const currentUser: User = { name: 'Maria L', role: 'Usuario', area: 'Logística' };
// const currentUser: User = { name: 'Juan V', role: 'Usuario', area: 'Producción' };

export default async function RequestsPage() {
    const orders = await getOrders();
    
    return <RequestsClient initialOrders={orders} currentUser={currentUser} />;
}
