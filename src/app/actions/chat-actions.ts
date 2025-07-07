'use server';

import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function sendMessageAction(channel: string, content: string, senderId: string): Promise<{ success: boolean; message?: string }> {
    if (!content.trim()) {
        return { success: false, message: 'El mensaje no puede estar vacío.' };
    }

    try {
        const newMessage = {
            id: `MSG-${uuidv4().slice(0, 12)}`,
            sender_id: senderId,
            channel: channel,
            content: content.trim(),
        };

        const { error } = await supabase.from('messages').insert(newMessage);

        if (error) {
            console.error('Error sending message:', error);
            throw error;
        }

        return { success: true };
    } catch (error) {
        return { success: false, message: 'No se pudo enviar el mensaje.' };
    }
}
