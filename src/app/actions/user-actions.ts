'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import type { ManagedUser } from '@/lib/types';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// For public registration form
export async function registerUserAction(data: Omit<ManagedUser, 'id' | 'role' | 'area'>) {
    const newUserId = `usr_${uuidv4().slice(0, 12)}`;
    try {
        await db.insert(schema.users).values({
            ...data,
            id: newUserId,
            // New users are standard 'Usuario' in 'Producción' by default, admin can change later.
            role: 'Usuario',
            area: 'Producción', 
        });
        revalidatePath('/dashboard/manage-users');
        return { success: true, userId: newUserId };
    } catch (error: any) {
        console.error('Error registering user:', error);
        if (error?.code === '23505') { // Postgres unique_violation code
             return { success: false, message: 'El nombre de usuario o el correo ya están en uso.' };
        }
        return { success: false, message: 'Ocurrió un error desconocido durante el registro.' };
    }
}

// For admin creating a user
export async function createUserAction(data: Omit<ManagedUser, 'id'>) {
    const newUserId = `usr_${uuidv4().slice(0, 12)}`;
    try {
        await db.insert(schema.users).values({
            ...data,
            id: newUserId,
        });
        revalidatePath('/dashboard/manage-users');
        return { success: true, userId: newUserId };
    } catch (error: any) {
        console.error('Error creating user:', error);
        if (error?.code === '23505') { // Postgres unique_violation code
             return { success: false, message: 'El nombre de usuario o el correo ya están en uso.' };
        }
        return { success: false, message: 'Error al crear el usuario.' };
    }
}

export async function updateUserAction(userId: string, data: Partial<Omit<ManagedUser, 'id'>>) {
    try {
        await db.update(schema.users)
            .set(data)
            .where(eq(schema.users.id, userId));
        revalidatePath('/dashboard/manage-users');
        return { success: true };
    } catch (error: any) {
        console.error('Error updating user:', error);
        if (error?.code === '23505') { // Postgres unique_violation code
             return { success: false, message: 'El nombre de usuario o el correo ya están en uso.' };
        }
        return { success: false, message: 'Error al actualizar el usuario.' };
    }
}

export async function deleteUserAction(userId: string) {
    try {
        await db.delete(schema.users).where(eq(schema.users.id, userId));
        revalidatePath('/dashboard/manage-users');
        return { success: true };
    } catch (error) {
        console.error('Error deleting user:', error);
        return { success: false, message: 'Error al eliminar el usuario.' };
    }
}
