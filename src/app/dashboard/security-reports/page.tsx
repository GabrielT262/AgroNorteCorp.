
'use server';

import * as React from 'react';
import type { User } from '@/lib/types';
import { getSecurityReports, getRegisteredVehicles } from '@/lib/db';
import { SecurityReportsClient } from './security-reports-client';


// Hardcoded current user for demonstration
const currentUser: User = { name: 'Carlos P', role: 'Usuario', area: 'Seguridad Patrimonial' };
// To test other roles, change the currentUser object above to:
// const currentUser: User = { name: 'Gabriel T', role: 'Administrador', area: 'Administrador' };
// const currentUser: User = { name: 'Ana G', role: 'Usuario', area: 'Gerencia' };


export default async function SecurityReportsPage() {
  const reports = await getSecurityReports();
  const registeredVehicles = await getRegisteredVehicles();

  return (
    <SecurityReportsClient
      initialReports={reports} 
      initialRegisteredVehicles={registeredVehicles}
      currentUser={currentUser} 
    />
  );
}
