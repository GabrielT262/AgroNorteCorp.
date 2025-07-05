
'use client';

import * as React from 'react';
import Image from 'next/image';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { SecurityReport, User } from '@/lib/types';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { AlertCircle, CheckCircle, Clock, Forward, MessageSquare, Tractor, XCircle, Car, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';


interface SecurityReportCardProps {
    report: SecurityReport;
    currentUser: User;
    onApprove: () => void;
    onReject: () => void;
    isPending: boolean;
}

export function SecurityReportCard({ report, currentUser, onApprove, onReject, isPending }: SecurityReportCardProps) {
    const canApprove = (currentUser.area === 'Gerencia' || currentUser.role === 'Administrador');

    const typeInfo = {
        'Incidente': { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-500/10', border: 'border-red-500/20' },
        'Novedad': { icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
        'Solicitud de Permiso': { icon: Forward, color: 'text-yellow-600', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
        'Ingreso de Proveedor': { icon: Tractor, color: 'text-green-600', bg: 'bg-green-500/10', border: 'border-green-500/20' },
        'Ingreso Vehículo Trabajador': { icon: Car, color: 'text-slate-600', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
    };

    const statusInfo: {[key in SecurityReport['status']]: { icon: React.ElementType, color: string }} = {
        'Abierto': { icon: Clock, color: 'text-blue-500' },
        'Cerrado': { icon: CheckCircle, color: 'text-slate-500' },
        'Aprobación Pendiente': { icon: Clock, color: 'text-yellow-500' },
        'Aprobado': { icon: CheckCircle, color: 'text-green-500' },
        'Rechazado': { icon: XCircle, color: 'text-red-500' },
    };

    const { icon: TypeIcon, color: typeColor, bg: typeBg, border: typeBorder } = typeInfo[report.type];
    const { icon: StatusIcon, color: statusColor } = statusInfo[report.status];

    const handleApprove = () => {
        onApprove();
    }

    const handleReject = () => {
        onReject();
    }

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className={cn("p-2 rounded-lg", typeBg, typeBorder)}>
                            <TypeIcon className={cn("h-5 w-5", typeColor)} />
                        </div>
                        <div>
                            <CardTitle className="text-lg">{report.title}</CardTitle>
                            <CardDescription className="text-xs">
                                {format(parseISO(report.date), "dd/MM/yyyy HH:mm", { locale: es })} por {report.author}
                            </CardDescription>
                        </div>
                    </div>
                     <Badge variant="outline">
                        <StatusIcon className={cn("h-3 w-3 mr-1.5", statusColor)} />
                        {report.status}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                <p className="text-sm text-muted-foreground">{report.description}</p>
                {report.meta && (
                    <div className="p-3 bg-secondary/50 border rounded-md">
                        <h4 className="font-semibold text-sm mb-1">Detalles para {report.meta.targetArea}</h4>
                        <p className="text-sm text-muted-foreground">{report.meta.details}</p>
                    </div>
                )}
                {report.photos && report.photos.length > 0 && (
                     <Carousel className="w-full max-w-xs mx-auto">
                        <CarouselContent>
                            {report.photos.map((src, index) => (
                            <CarouselItem key={index}>
                                <div className="p-1">
                                <div className="aspect-video relative bg-muted rounded-md overflow-hidden">
                                    <Image
                                        src={src}
                                        alt={`Foto del reporte ${report.id}`}
                                        fill
                                        className="object-cover"
                                        data-ai-hint="security report image"
                                    />
                                </div>
                                </div>
                            </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="-left-8"/>
                        <CarouselNext className="-right-8"/>
                    </Carousel>
                )}
            </CardContent>
            <CardFooter className="flex gap-2">
                 {report.type === 'Solicitud de Permiso' && report.status === 'Aprobación Pendiente' && canApprove && (
                    <>
                        <Button onClick={handleReject} variant="outline" className="w-full" disabled={isPending}>
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                            Rechazar
                        </Button>
                        <Button onClick={handleApprove} className="w-full" disabled={isPending}>
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                            Aprobar
                        </Button>
                    </>
                )}
            </CardFooter>
        </Card>
    );
}
