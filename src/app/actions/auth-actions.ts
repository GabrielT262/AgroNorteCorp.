'use server';

import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { or, eq } from 'drizzle-orm';

interface LoginCredentials {
    credential: string;
    password: string;
}

export async function loginUserAction(data: LoginCredentials): Promise<{ success: boolean; message?: string }> {
  try {
    const user = await db.query.users.findFirst({
      where: or(
        eq(schema.users.email, data.credential),
        eq(schema.users.username, data.credential)
      ),
    });

    if (!user) {
      return { success: false, message: 'Credenciales incorrectas.' };
    }

    // In a real app, passwords must be hashed and compared securely.
    // This prototype uses plaintext passwords for simplicity.
    if (user.password !== data.password) {
      return { success: false, message: 'Credenciales incorrectas.' };
    }
    
    // Here you would typically create a session, set a cookie, etc.
    // For this prototype, just returning success is enough.

    return { success: true };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Ha ocurrido un error en el servidor.' };
  }
}
