'use server';

import { supabase } from '@/lib/supabase';

interface LoginCredentials {
    credential: string;
    password: string;
}

export async function loginUserAction(data: LoginCredentials): Promise<{ success: boolean; message?: string; userId?: string }> {
    // Super admin fallback for initial setup or if the main admin account has issues.
    if (data.credential === 'GabrielT' && data.password === '003242373') {
      console.log('Admin fallback login successful.');
      return { success: true, userId: 'usr_gabriel' };
    }
    
    try {
        console.log(`[AUTH] Attempting to log in with credential: ${data.credential}`);
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .or(`email.eq.${data.credential},username.eq.${data.credential}`)
            .single();

        if (error) {
            console.error('[AUTH] Supabase login error:', JSON.stringify(error, null, 2));
            return { success: false, message: 'Credenciales incorrectas o error de conexión con la base de datos.' };
        }
        
        if (!user) {
            console.warn(`[AUTH] User not found for credential: ${data.credential}`);
            return { success: false, message: 'Credenciales incorrectas.' };
        }

        if (user.status !== 'active') {
            console.warn(`[AUTH] User ${user.username} is not active. Status: ${user.status}`);
            return { success: false, message: 'Tu cuenta está pendiente de aprobación por un administrador.' };
        }

        // In a real production app, passwords must be hashed and compared securely.
        // This prototype uses plaintext passwords for simplicity.
        if (user.password !== data.password) {
            console.warn(`[AUTH] Incorrect password for user ${user.username}`);
            return { success: false, message: 'Credenciales incorrectas.' };
        }
        
        console.log(`[AUTH] Login successful for user: ${user.username}`);
        return { success: true, userId: user.id };
    } catch (error: any) {
        console.error('[AUTH] Fatal login server error:', error.message, error.stack);
        return { success: false, message: 'Ha ocurrido un error inesperado en el servidor.' };
    }
}
