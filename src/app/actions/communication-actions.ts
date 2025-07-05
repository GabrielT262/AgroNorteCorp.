'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import type { Communication } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export async function createCommunicationAction(data: Omit<Communication, 'id' | 'date' | 'authorName' | 'images'>, images: string[]) {
    const newCommunicationId = `COM-${uuidv4().slice(0, 8).toUpperCase()}`;
    try {
        await db.insert(schema.communications).values({
            ...data,
            id: newCommunicationId,
            date: new Date(),
            authorName: 'Current User', // Placeholder for actual user
            images,
        });
        revalidatePath('/dashboard/communications');
        return { success: true, communicationId: newCommunicationId };
    } catch (error) {
        console.error('Error creating communication:', error);
        return { success: false, message: 'Error al crear el comunicado.' };
    }
}
