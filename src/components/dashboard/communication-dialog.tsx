
'use client';

import * as React from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Communication } from '@/lib/types';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '../ui/scroll-area';

interface CommunicationDialogProps {
  communication: Communication | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommunicationDialog({ communication, isOpen, onOpenChange }: CommunicationDialogProps) {
  if (!communication) return null;

  const authorName = communication.users ? `${communication.users.name} ${communication.users.last_name}` : 'Usuario del Sistema';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline">{communication.title}</DialogTitle>
          <DialogDescription>
            Publicado por {authorName} el {format(parseISO(communication.date), "dd MMMM, yyyy 'a las' HH:mm", { locale: es })}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{communication.description}</p>
            </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
