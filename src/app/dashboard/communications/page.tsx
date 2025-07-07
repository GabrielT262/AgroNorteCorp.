'use server';

import * as React from 'react';
import { getCommunications } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { CommunicationsClient } from './communications-client';
import type { User } from '@/lib/types';

export default async function CommunicationsPage() {
    const { data: currentUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', 'usr_gabriel') // Hardcoded admin user ID
        .single();

    if (error || !currentUser) {
        return <div>Usuario no encontrado o error de base de datos.</div>;
    }
    
    const communications = await getCommunications();
    
    return (
        <CommunicationsClient
            initialCommunications={communications}
            currentUser={currentUser}
        />
    );
}
