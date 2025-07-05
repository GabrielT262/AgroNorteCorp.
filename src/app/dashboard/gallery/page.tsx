
'use server';

import * as React from 'react';
import type { User } from '@/lib/types';
import { getGalleryPosts } from '@/lib/db';
import { GalleryClient } from './gallery-client';

// Hardcoded current user for demonstration
const currentUser: User = { name: 'Gabriel T', role: 'Administrador', area: 'Administrador' };
// const currentUser: User = { name: 'Juan V', role: 'Usuario', area: 'Producción' };


export default async function GalleryPage() {
    const posts = await getGalleryPosts();
    
    return <GalleryClient initialPosts={posts} currentUser={currentUser} />;
}
