'use client';

import * as React from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import type { ChatMessage, ManagedUser, UserArea } from '@/lib/types';
import { getChatMessages } from '@/lib/db';
import { sendMessageAction } from '@/app/actions/chat-actions';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const chatChannels: { id: UserArea | 'general', name: string }[] = [
    { id: 'general', name: 'Canal General' },
    { id: 'Logística', name: 'Logística' },
    { id: 'Almacén', name: 'Almacén' },
    { id: 'Producción', name: 'Producción' },
    { id: 'Seguridad Patrimonial', name: 'Seguridad' },
    { id: 'Taller', name: 'Taller' },
];

interface ChatClientProps {
    currentUser: ManagedUser;
    initialMessages: ChatMessage[];
    allUsers: ManagedUser[];
}

export function ChatClient({ currentUser, initialMessages, allUsers }: ChatClientProps) {
    const [messages, setMessages] = React.useState<ChatMessage[]>(initialMessages);
    const [newMessage, setNewMessage] = React.useState('');
    const [activeChannel, setActiveChannel] = React.useState('general');
    const [isLoading, setIsLoading] = React.useState(false);
    const [isSending, setIsSending] = React.useState(false);
    const [onlineUsers, setOnlineUsers] = React.useState<Record<string, any>>({});
    const scrollAreaRef = React.useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
        setTimeout(() => {
            if (scrollAreaRef.current) {
                scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior });
            }
        }, 100);
    };
    
    React.useEffect(() => {
        scrollToBottom('auto');
    }, [messages, activeChannel]);

    React.useEffect(() => {
        const channel = supabase.channel(`realtime-chat-${activeChannel}`, {
            config: {
                presence: { key: currentUser.id }
            }
        });

        channel
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel=eq.${activeChannel}` }, async (payload) => {
                const { data: userData, error } = await supabase.from('users').select('name, last_name, avatar_url').eq('id', payload.new.sender_id).single();
                if (error) {
                    console.error('Error fetching user for new message', error);
                    return;
                }

                const newMessageData = {
                    ...payload.new,
                    users: userData
                } as ChatMessage;

                if (newMessageData) {
                    setMessages(prev => {
                        if (prev.some(m => m.id === newMessageData.id)) return prev;
                        return [...prev, newMessageData];
                    });
                }
            })
            .on('presence', { event: 'sync' }, () => {
                const presenceState = channel.presenceState();
                setOnlineUsers(presenceState);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({ online_at: new Date().toISOString() });
                }
            });

        return () => {
            channel.untrack();
            supabase.removeChannel(channel);
        };
    }, [activeChannel, currentUser.id]);

    const handleChannelChange = async (newChannel: string) => {
        setIsLoading(true);
        setActiveChannel(newChannel);
        const newMessages = await getChatMessages(newChannel);
        setMessages(newMessages);
        setIsLoading(false);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const content = newMessage.trim();
        if (!content || isSending) return;

        setIsSending(true);
        const tempId = `temp-${Date.now()}`;
        
        const optimisticMessage: ChatMessage = {
            id: tempId,
            content: content,
            created_at: new Date().toISOString(),
            sender_id: currentUser.id,
            channel: activeChannel,
            users: { name: currentUser.name, last_name: currentUser.last_name, avatar_url: currentUser.avatar_url || null }
        };
        setMessages(prev => [...prev, optimisticMessage]);
        setNewMessage('');
        
        const result = await sendMessageAction(activeChannel, content, currentUser.id);

        if (!result.success) {
            toast({ title: 'Error', description: result.message || 'No se pudo enviar el mensaje.', variant: 'destructive' });
            setMessages(prev => prev.filter(m => m.id !== tempId));
        }
        setIsSending(false);
    };

    const handleTagUser = (user: ManagedUser) => {
        setNewMessage(prev => `${prev}@${user.username} `.replace(/  +/g, ' '));
    };

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="p-3 border-b">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <MessageSquare className="h-6 w-6" />
                        <CardTitle>Chat: #{activeChannel}</CardTitle>
                    </div>
                    <div className="w-1/3 min-w-[180px]">
                        <Select value={activeChannel} onValueChange={handleChannelChange}>
                            <SelectTrigger><SelectValue placeholder="Canal..." /></SelectTrigger>
                            <SelectContent>
                                {chatChannels.map(ch => <SelectItem key={ch.id} value={ch.id}>{ch.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <Separator className="my-2"/>
                 <ScrollArea className="w-full">
                    <div className="flex gap-4 pb-2">
                        {allUsers.map(user => {
                            const isOnline = !!onlineUsers[user.id];
                            return (
                                <div key={user.id} className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => handleTagUser(user)}>
                                    <div className="relative">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={user.avatar_url || undefined} alt={user.username}/>
                                            <AvatarFallback>{user.name?.charAt(0)}{user.last_name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className={cn(
                                            "absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 border-background",
                                            isOnline ? 'bg-green-500' : 'bg-gray-400'
                                        )} />
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate max-w-[50px]">{user.name}</p>
                                </div>
                            );
                        })}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden p-0 bg-muted/30">
                <ScrollArea className="flex-1 p-4 md:p-6" ref={scrollAreaRef}>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : messages.length > 0 ? (
                        <div className="space-y-6">
                            {messages.map((msg) => {
                                const isSender = msg.sender_id === currentUser.id;
                                const authorName = msg.users ? `${msg.users.name} ${msg.users.last_name}` : 'Usuario';
                                return (
                                    <div key={msg.id} className={cn('flex items-end gap-2 max-w-lg', isSender ? 'flex-row-reverse ml-auto' : 'mr-auto')}>
                                        {!isSender && (
                                            <Avatar className="h-8 w-8 self-start">
                                                <AvatarImage src={msg.users?.avatar_url || undefined} alt={authorName}/>
                                                <AvatarFallback>{msg.users?.name?.charAt(0)}{msg.users?.last_name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                        )}
                                        <div className={cn(
                                            'p-3 rounded-lg flex flex-col',
                                            isSender 
                                                ? 'bg-primary text-primary-foreground rounded-br-none' 
                                                : 'bg-background text-foreground rounded-bl-none shadow-sm'
                                        )}>
                                            {!isSender && <p className="text-xs font-bold mb-1 text-primary">{authorName}</p>}
                                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                            <p className={cn(
                                                'text-xs mt-1 text-right',
                                                isSender ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                            )}>
                                                {format(parseISO(msg.created_at), 'HH:mm')}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex justify-center items-center h-full text-muted-foreground">
                            <p>No hay mensajes en este canal. ¡Sé el primero!</p>
                        </div>
                    )}
                </ScrollArea>
                <div className="p-4 border-t bg-background">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={`Mensaje en #${activeChannel}...`}
                            autoComplete="off"
                        />
                        <Button type="submit" size="icon" disabled={isSending || !newMessage.trim()}>
                            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </form>
                </div>
            </CardContent>
        </Card>
    );
}
