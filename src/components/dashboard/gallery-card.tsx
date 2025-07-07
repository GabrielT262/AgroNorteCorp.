
'use client';

import * as React from 'react';
import Image from 'next/image';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { GalleryPost } from '@/lib/types';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, User, Calendar, X, Loader2, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';


interface GalleryCardProps {
    post: GalleryPost;
    showApprovalActions?: boolean;
    onApprove?: () => void;
    onReject?: () => void;
    isPending?: boolean;
}

export function GalleryCard({ post, showApprovalActions = false, onApprove, onReject, isPending }: GalleryCardProps) {
    const ai_hint = post.ai_hint || 'achievement celebration';
    const authorName = post.users ? `${post.users.name} ${post.users.last_name}` : 'Usuario del Sistema';

    return (
        <Card className={cn("flex flex-col", post.status === 'Pendiente' && 'border-yellow-500/50 bg-yellow-500/5')}>
            <CardHeader>
                <div className="aspect-video relative bg-muted rounded-md overflow-hidden">
                    <Image
                        src={post.images?.[0] || 'https://placehold.co/600x400.png'}
                        alt={`Foto del logro ${post.id}`}
                        fill
                        className="object-cover"
                         data-ai-hint={ai_hint}
                    />
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-2">
                <CardTitle className="text-xl">{post.title}</CardTitle>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <Building2 className="h-3 w-3" />
                        <span>{post.author_area}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <User className="h-3 w-3" />
                        <span>{authorName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        <span>{format(parseISO(post.date), "dd MMM, yyyy", { locale: es })}</span>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground pt-2">{post.description}</p>
            </CardContent>
            {showApprovalActions && post.status === 'Pendiente' && (
                <CardFooter className="flex gap-2">
                     <Button onClick={onReject} variant="outline" className="w-full" disabled={isPending}>
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                        Rechazar
                    </Button>
                    <Button onClick={onApprove} className="w-full bg-green-600 hover:bg-green-700" disabled={isPending}>
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                        Aprobar
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
