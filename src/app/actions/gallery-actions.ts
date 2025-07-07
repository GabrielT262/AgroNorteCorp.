
'use server';

import { revalidatePath } from 'next/cache';
import type { GalleryPost } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';

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

export async function createGalleryPostAction(formData: FormData) {
    const newPostId = `POST-${uuidv4().slice(0, 8).toUpperCase()}`;
    const hardcodedUserId = 'usr_gabriel'; // Placeholder for actual user from session
    try {
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const ai_hint = formData.get('ai_hint') as string;
        const images = formData.getAll('images') as File[];
        
        const imageUrls: string[] = [];
        for (const image of images) {
            if (image.size > 0) {
                const imagePath = `public/${newPostId}-${image.name}-${Date.now()}`;
                const url = await uploadFileAndGetUrl(image, 'gallery', imagePath);
                if (url) imageUrls.push(url);
            }
        }

        const {data: currentUser} = await supabase.from('users').select('area').eq('id', hardcodedUserId).single();

        const newPost: Omit<GalleryPost, 'id' | 'users'> = {
            title,
            description,
            ai_hint,
            images: imageUrls,
            date: new Date().toISOString(),
            author_id: hardcodedUserId,
            author_area: currentUser?.area || 'Producción', // Placeholder
            status: 'Pendiente',
        };
        
        const { error } = await supabase
            .from('gallery_posts')
            .insert({ id: newPostId, ...newPost });
            
        if (error) throw error;
        
        revalidatePath('/dashboard/gallery');
        return { success: true, postId: newPostId };
    } catch (error) {
        console.error('Error creating gallery post:', error);
        return { success: false, message: 'Error al crear la publicación.' };
    }
}

export async function approvePostAction(postId: string) {
    try {
        const { error } = await supabase
            .from('gallery_posts')
            .update({ status: 'Aprobado' })
            .eq('id', postId);
            
        if (error) throw error;

        revalidatePath('/dashboard/gallery');
        return { success: true };
    } catch (error) {
        console.error('Error approving post:', error);
        return { success: false, message: 'Error al aprobar la publicación.' };
    }
}

export async function rejectPostAction(postId: string) {
    try {
        const { error } = await supabase
            .from('gallery_posts')
            .update({ status: 'Rechazado' })
            .eq('id', postId);

        if (error) throw error;

        revalidatePath('/dashboard/gallery');
        return { success: true };
    } catch (error) {
        console.error('Error rejecting post:', error);
        return { success: false, message: 'Error al rechazar la publicación.' };
    }
}
