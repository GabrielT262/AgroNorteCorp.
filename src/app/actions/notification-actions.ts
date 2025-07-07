'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import type { Notification } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { getNotifications } from '@/lib/db';

export async function createNotificationAction(data: Omit<Notification, 'id' | 'created_at' | 'is_read'>) {
    try {
        const newNotificationId = `NOTIF-${uuidv4().slice(0, 8).toUpperCase()}`;
        const newNotification: Omit<Notification, 'id'> = {
            ...data,
            is_read: false,
            created_at: new Date().toISOString(),
        };
        const { error } = await supabase
            .from('notifications')
            .insert({ id: newNotificationId, ...newNotification });

        if (error) throw error;
        
        // No revalidation needed, as the client will get the update in real-time.
        return { success: true };
    } catch (error) {
        console.error('Error creating notification:', error);
        return { success: false };
    }
}

export async function markNotificationAsReadAction(notificationId: string) {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);

        if (error) throw error;

        // No revalidation needed, client-side state is updated optimistically.
        return { success: true };
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return { success: false };
    }
}

// New server action to safely fetch notifications from a client component
export async function getNotificationsForUserAction(recipientId: string): Promise<Notification[]> {
    return getNotifications(recipientId);
}
