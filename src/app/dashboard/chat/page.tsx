'use server';

import * as React from 'react';
import { getCurrentUser, getChatMessages, getUsers } from '@/lib/db';
import DashboardProvider from '../dashboard-provider';
import { ChatClient } from './chat-client';

export default async function ChatPage({ searchParams }: { searchParams: { userId?: string } }) {
    const currentUser = await getCurrentUser(searchParams.userId);
    const [initialMessages, allUsers] = await Promise.all([
        getChatMessages('general'),
        getUsers()
    ]);
    
    return (
        <DashboardProvider searchParams={searchParams}>
            <ChatClient
                currentUser={currentUser}
                initialMessages={initialMessages}
                allUsers={allUsers}
            />
        </DashboardProvider>
    );
}
