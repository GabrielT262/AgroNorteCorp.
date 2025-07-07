
'use server';

import * as React from 'react';
import { getGalleryPosts, getCurrentUser } from '@/lib/db';
import { GalleryClient } from './gallery-client';
import DashboardProvider from '../dashboard-provider';

export default async function GalleryPage({ searchParams }: { searchParams: { userId?: string } }) {
    const [posts, currentUser] = await Promise.all([
        getGalleryPosts(),
        getCurrentUser(searchParams.userId),
    ]);
    
    return (
        <DashboardProvider searchParams={searchParams}>
            <GalleryClient initialPosts={posts} currentUser={currentUser} />
        </DashboardProvider>
    );
}
