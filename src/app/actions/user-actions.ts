

'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import type { ManagedUser, UserArea } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { createNotificationAction } from './notification-actions';

async function uploadFileAndGetUrl(file: File, bucket: string, path: string): Promise<string | null> {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: '3600',
        upsert: true,
    });
    if (error) {
        console.error(`Error uploading to ${bucket}:`, error);
        return null;
    }
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
    return publicUrl;
}

// For public registration form
export async function registerUserAction(data: Omit<ManagedUser, 'id' | 'role' | 'status'>) {
    const newUserId = `usr_${uuidv4().slice(0, 12)}`;
    try {
        if (!data.password) {
             return { success: false, message: 'La contraseña es requerida para el registro.' };
        }
        
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .or(`username.eq.${data.username},email.eq.${data.email}`)
            .single();

        if(existingUser) {
             return { success: false, message: 'El nombre de usuario o el correo ya están en uso.' };
        }
        
        const newUser: ManagedUser = {
            ...data,
            id: newUserId,
            role: 'Usuario',
            status: 'pending',
        };

        const { error } = await supabase.from('users').insert(newUser);
        if(error) throw error;
        
        revalidatePath('/dashboard/manage-users');
        await createNotificationAction({
            recipient_id: 'Administrador', // Notify all admins
            title: 'Nuevo Usuario Registrado',
            description: `El usuario ${data.name} ${data.last_name} ha solicitado una cuenta.`,
            path: '/dashboard/manage-users',
        });
        return { success: true, userId: newUserId };
    } catch (error: any) {
        console.error('Error registering user:', error);
        return { success: false, message: 'Ocurrió un error desconocido durante el registro.' };
    }
}

// For admin creating a user
export async function createUserAction(data: Omit<ManagedUser, 'id' | 'status'>) {
    const newUserId = `usr_${uuidv4().slice(0, 12)}`;
    try {
        if (!data.password) {
             return { success: false, message: 'Debe establecer una contraseña para el nuevo usuario.' };
        }
        
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .or(`username.eq.${data.username},email.eq.${data.email}`)
            .single();

        if(existingUser) {
             return { success: false, message: 'El nombre de usuario o el correo ya están en uso.' };
        }

        const newUser: ManagedUser = {
            ...data,
            id: newUserId,
            status: 'active',
        };

        const { error } = await supabase.from('users').insert(newUser);
        if(error) throw error;


        revalidatePath('/dashboard/manage-users');
        return { success: true, userId: newUserId };
    } catch (error: any) {
        console.error('Error creating user:', error);
        return { success: false, message: 'Error al crear el usuario.' };
    }
}

export async function updateUserAction(userId: string, data: Partial<Omit<ManagedUser, 'id'>>) {
    try {
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .or(`username.eq.${data.username},email.eq.${data.email}`)
            .not('id', 'eq', userId)
            .single();

        if(existingUser) {
            return { success: false, message: 'El nombre de usuario o el correo ya están en uso.' };
        }
        
        const { error } = await supabase.from('users').update(data).eq('id', userId);
        if (error) throw error;

        revalidatePath('/dashboard/manage-users');
        return { success: true };
    } catch (error: any) {
        console.error('Error updating user:', error);
        return { success: false, message: 'Error al actualizar el usuario.' };
    }
}

export async function updateUserProfileAction(userId: string, formData: FormData) {
    try {
        const { data: user, error: fetchError } = await supabase.from('users').select('avatar_url, signature_url').eq('id', userId).single();
        if (fetchError) throw fetchError;
        
        let avatar_url = user?.avatar_url;
        let signature_url = user?.signature_url;

        const avatarFile = formData.get('avatar') as File;
        const signatureFile = formData.get('signature') as File;

        if (avatarFile && avatarFile.size > 0) {
            const avatarPath = `public/${userId}-avatar-${Date.now()}`;
            const newAvatarUrl = await uploadFileAndGetUrl(avatarFile, 'avatars', avatarPath);
            if(newAvatarUrl) avatar_url = newAvatarUrl;
        }

        if (signatureFile && signatureFile.size > 0) {
            const signaturePath = `public/${userId}-signature-${Date.now()}`;
            const newSignatureUrl = await uploadFileAndGetUrl(signatureFile, 'signatures', signaturePath);
            if(newSignatureUrl) signature_url = newSignatureUrl;
        }

        const { error: updateError } = await supabase
            .from('users')
            .update({ avatar_url, signature_url })
            .eq('id', userId);
            
        if (updateError) throw updateError;


        revalidatePath('/dashboard/settings');
        revalidatePath('/dashboard'); // To refresh layout avatar
        return { success: true };

    } catch (error) {
        console.error('Error updating profile:', error);
        return { success: false, message: 'Error al actualizar el perfil.' };
    }
}


export async function deleteUserAction(userId: string) {
    try {
        const { error } = await supabase.from('users').delete().eq('id', userId);
        if (error) throw error;
        
        revalidatePath('/dashboard/manage-users');
        return { success: true };
    } catch (error) {
        console.error('Error deleting user:', error);
        return { success: false, message: 'Error al eliminar el usuario.' };
    }
}

export async function approveUserAction(userId: string) {
    try {
        const { error } = await supabase.from('users').update({ status: 'active' }).eq('id', userId);
        if(error) throw error;

        revalidatePath('/dashboard/manage-users');
        return { success: true };
    } catch (error) {
        console.error('Error approving user:', error);
        return { success: false, message: 'Error al aprobar el usuario.' };
    }
}

export async function requestPasswordResetAction(data: { credential: string; area: UserArea; details: string; }) {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('name, username')
            .or(`email.eq.${data.credential},username.eq.${data.credential}`)
            .single();

        if (error || !user) {
            // Don't reveal if user exists for security reasons.
            // Just say the request was sent, to prevent user enumeration attacks.
            console.warn(`Password reset requested for a non-existent or duplicate user: ${data.credential}`);
            return { success: true }; // Always return success to the client
        }

        await createNotificationAction({
            recipient_id: 'Administrador',
            title: 'Solicitud de Reseteo de Contraseña',
            description: `El usuario ${user.name} (${user.username}) del área ${data.area} solicita un reseteo. Motivo: "${data.details}"`,
            path: '/dashboard/manage-users'
        });

        return { success: true };
    } catch (error: any) {
        console.error('Error creating password reset request:', error);
        // Even in case of a server error, we might not want to inform the user.
        // For this internal tool, returning an error message is acceptable.
        return { success: false, message: 'Ocurrió un error al enviar la solicitud.' };
    }
}
