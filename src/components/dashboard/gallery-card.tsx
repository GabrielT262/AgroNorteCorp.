
'use client';

import * as React from 'react';
import Image from 'next/image';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { GalleryPost } from '@/lib/types';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Check, User, Calendar, X, BadgeInfo, Building2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';


interface GalleryCardProps {
    post: GalleryPost;
    showApprovalActions?: boolean;
    onApprove?: () => void;
    onReject?: () => void;
}

export function GalleryCard({ post, showApprovalActions = false, onApprove, onReject }: GalleryCardProps) {
    const allImages = post.images && post.images.length > 0 ? post.images : ['https://placehold.co/600x400.png'];
    const aiHint = post.aiHint || 'achievement celebration';

    return (
        <Card className={cn("flex flex-col", post.status === 'Pendiente' && 'border-yellow-500/50 bg-yellow-500/5')}>
            <CardHeader>
                 {allImages.length > 1 ? (
                    <Carousel className="w-full">
                        <CarouselContent>
                            {allImages.map((src, index) => (
                            <CarouselItem key={index}>
                                <div className="aspect-video relative bg-muted rounded-md overflow-hidden">
                                    <Image
                                        src={src}
                                        alt={`Foto del logro ${post.id}`}
                                        fill
                                        className="object-cover"
                                        data-ai-hint={aiHint}
                                    />
                                </div>
                            </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="left-2" />
                        <CarouselNext className="right-2"/>
                    </Carousel>
                ) : (
                    <div className="aspect-video relative bg-muted rounded-md overflow-hidden">
                        <Image
                            src={allImages[0]}
                            alt={`Foto del logro ${post.id}`}
                            fill
                            className="object-cover"
                             data-ai-hint={aiHint}
                        />
                    </div>
                )}
            </CardHeader>
            <CardContent className="flex-grow space-y-2">
                <CardTitle className="text-xl">{post.title}</CardTitle>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <Building2 className="h-3 w-3" />
                        <span>{post.authorArea}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <User className="h-3 w-3" />
                        <span>{post.authorName}</span>
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
                     <Button onClick={onReject} variant="outline" className="w-full">
                        <X className="mr-2 h-4 w-4" />
                        Rechazar
                    </Button>
                    <Button onClick={onApprove} className="w-full bg-green-600 hover:bg-green-700">
                        <Check className="mr-2 h-4 w-4" />
                        Aprobar
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
