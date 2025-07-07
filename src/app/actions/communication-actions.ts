'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import type { Communication } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export async function createCommunicationAction(data: Omit<Communication, 'id' | 'date' | 'author_id'>) {
    const newCommunicationId = `COM-${uuidv4().slice(0, 8).toUpperCase()}`;
    
    // In a real app, you would get the user from the session.
    const hardcodedUserId = 'usr_gabriel';

    try {
        const newCommunication: Pick<Communication, 'title' | 'description' | 'ai_hint' | 'date' | 'author_id'> = {
            ...data,
            date: new Date().toISOString(),
            author_id: hardcodedUserId,
        };

        const { error } = await supabase
          .from('communications')
          .insert({ id: newCommunicationId, ...newCommunication });

        if (error) throw error;

        revalidatePath('/dashboard/communications');
        return { success: true, communicationId: newCommunicationId };
    } catch (error) {
        console.error('Error creating communication:', error);
        return { success: false, message: 'Error al crear el comunicado.' };
    }
}
