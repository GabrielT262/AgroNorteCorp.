
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import type { GalleryPost } from '@/lib/types';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function createGalleryPostAction(data: Omit<GalleryPost, 'id' | 'date' | 'authorName' | 'authorArea' | 'status' | 'images'>, images: string[]) {
    const newPostId = `POST-${uuidv4().slice(0, 8).toUpperCase()}`;
    try {
        await db.insert(schema.galleryPosts).values({
            ...data,
            id: newPostId,
            date: new Date(),
            authorName: 'Current User', // Placeholder
            authorArea: 'Producción', // Placeholder
            status: 'Pendiente',
            images,
        });
        revalidatePath('/dashboard/gallery');
        return { success: true, postId: newPostId };
    } catch (error) {
        console.error('Error creating gallery post:', error);
        return { success: false, message: 'Error al crear la publicación.' };
    }
}

export async function approvePostAction(postId: string) {
    try {
        await db.update(schema.galleryPosts)
            .set({ status: 'Aprobado' })
            .where(eq(schema.galleryPosts.id, postId));
        revalidatePath('/dashboard/gallery');
        return { success: true };
    } catch (error) {
        console.error('Error approving post:', error);
        return { success: false, message: 'Error al aprobar la publicación.' };
    }
}

export async function rejectPostAction(postId: string) {
    try {
        // Instead of deleting, we set the status to 'Rechazado'
        await db.update(schema.galleryPosts)
            .set({ status: 'Rechazado' })
            .where(eq(schema.galleryPosts.id, postId));
        revalidatePath('/dashboard/gallery');
        return { success: true };
    } catch (error) {
        console.error('Error rejecting post:', error);
        return { success: false, message: 'Error al rechazar la publicación.' };
    }
}
