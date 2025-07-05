
'use client';

import * as React from 'react';
import Image from 'next/image';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Communication } from '@/lib/types';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '../ui/scroll-area';

interface CommunicationDialogProps {
  communication: Communication | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommunicationDialog({ communication, isOpen, onOpenChange }: CommunicationDialogProps) {
  if (!communication) return null;

  const allImages = communication.images && communication.images.length > 0 ? communication.images : [];
  const aiHint = communication.aiHint || 'announcement';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline">{communication.title}</DialogTitle>
          <DialogDescription>
            Publicado por {communication.authorName} el {format(parseISO(communication.date), "dd MMMM, yyyy 'a las' HH:mm", { locale: es })}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
                {allImages.length > 0 && (
                    allImages.length > 1 ? (
                        <Carousel className="w-full">
                            <CarouselContent>
                                {allImages.map((src, index) => (
                                <CarouselItem key={index}>
                                    <div className="aspect-video relative bg-muted rounded-md overflow-hidden">
                                        <Image src={src} alt={`Imagen de comunicado ${index + 1}`} fill className="object-cover" data-ai-hint={aiHint} />
                                    </div>
                                </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious className="left-2" />
                            <CarouselNext className="right-2"/>
                        </Carousel>
                    ) : (
                        <div className="aspect-video relative bg-muted rounded-md overflow-hidden">
                            <Image src={allImages[0]} alt="Imagen de comunicado" fill className="object-cover" data-ai-hint={aiHint}/>
                        </div>
                    )
                )}
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
