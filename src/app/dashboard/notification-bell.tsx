'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Bell, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Notification, ManagedUser } from '@/lib/types';
import { getNotificationsForUserAction, markNotificationAsReadAction } from '@/app/actions/notification-actions';
import { supabase } from '@/lib/supabase';

export function NotificationBell({ currentUser }: { currentUser: Omit<ManagedUser, 'password'> }) {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const fetchNotifications = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedNotifications = await getNotificationsForUserAction(currentUser.area);
      setNotifications(fetchedNotifications);
    } catch (error) {
        console.error("Error fetching initial notifications:", error);
        toast({
            title: "Error de Red",
            description: "No se pudieron cargar las notificaciones. Revisa la consola para más detalles.",
            variant: "destructive",
        });
    } finally {
        setIsLoading(false);
    }
  }, [currentUser.area, toast]);

  React.useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel('realtime-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          // The IN filter listens for new rows where recipient_id is either the user's area or the global 'Administrador' recipient
          filter: `recipient_id=in.(${currentUser.area},Administrador)`
        },
        (payload) => {
          toast({
            title: 'Nueva Notificación',
            description: (payload.new as Notification).title,
          });
          setNotifications(prev => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to real-time notifications!');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Realtime Channel Error:', err);
            toast({
              title: "Error de Conexión",
              description: "No se pudo conectar al sistema de notificaciones en tiempo real. Revisa la consola.",
              variant: "destructive"
            });
          } else if (status === 'TIMED_OUT') {
            console.warn('Realtime connection timed out.');
          } else if (err) {
            console.error('Realtime subscription failed:', err);
          }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser.area, fetchNotifications, toast]);


  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      setNotifications(prev =>
        prev.map(n => (n.id === notification.id ? { ...n, is_read: true } : n))
      );
      await markNotificationAsReadAction(notification.id);
    }
    if (notification.path) {
      router.push(notification.path);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="relative">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Ver notificaciones</span>
          </Button>
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0">{unreadCount}</Badge>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
            <div className="flex justify-center items-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        ) : notifications.length > 0 ? (
          notifications.map(notification => (
            <DropdownMenuItem
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`flex flex-col items-start gap-1 whitespace-normal cursor-pointer ${!notification.is_read ? 'bg-accent' : ''}`}
            >
              <p className="font-semibold">{notification.title}</p>
              <p className="text-xs text-muted-foreground">{notification.description}</p>
            </DropdownMenuItem>
          ))
        ) : (
          <p className="p-4 text-sm text-center text-muted-foreground">No tienes notificaciones.</p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
