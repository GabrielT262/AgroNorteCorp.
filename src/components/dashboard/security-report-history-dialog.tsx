
'use client';

import * as React from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { SecurityReport } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, CheckCircle, Clock, Forward, MessageSquare, Tractor, XCircle, Car } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SecurityReportHistoryDialogProps {
  allReports: SecurityReport[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SecurityReportHistoryDialog({ allReports, isOpen, onOpenChange }: SecurityReportHistoryDialogProps) {
  
  const sortedReports = React.useMemo(() => {
    return [...allReports].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  }, [allReports]);

  const typeInfo: { [key in SecurityReport['type']]: { icon: React.ElementType, label: string } } = {
    'Incidente': { icon: AlertCircle, label: 'Incidente' },
    'Novedad': { icon: MessageSquare, label: 'Novedad' },
    'Solicitud de Permiso': { icon: Forward, label: 'Solicitud' },
    'Ingreso de Proveedor': { icon: Tractor, label: 'Proveedor' },
    'Ingreso Vehículo Trabajador': { icon: Car, label: 'Ingreso Vehículo' },
  };

  const statusVariant: {[key in SecurityReport['status']]: string} = {
    'Abierto': 'bg-blue-500/20 text-blue-700',
    'Cerrado': 'bg-slate-500/20 text-slate-700',
    'Aprobación Pendiente': 'bg-yellow-500/20 text-yellow-700',
    'Aprobado': 'bg-green-500/20 text-green-700',
    'Rechazado': 'bg-red-500/20 text-red-700',
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-headline">Historial de Reportes de Seguridad</DialogTitle>
          <DialogDescription>
            Consulta todos los registros de la bitácora de seguridad.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 border rounded-md">
            <ScrollArea className="h-full">
                <Table>
                    <TableHeader className="sticky top-0 bg-background/95 backdrop-blur-sm">
                        <TableRow>
                            <TableHead className="w-[150px]">Fecha</TableHead>
                            <TableHead>Título</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Autor</TableHead>
                            <TableHead>Estado</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedReports.map(report => {
                            const { icon: Icon, label } = typeInfo[report.type];
                            return (
                                <TableRow key={report.id}>
                                    <TableCell className="font-medium whitespace-nowrap">{format(parseISO(report.date), "dd/MM/yy HH:mm", { locale: es })}</TableCell>
                                    <TableCell className="font-semibold">{report.title}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Icon className="h-4 w-4 text-muted-foreground" />
                                            <span>{label}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{report.author}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn("border-transparent", statusVariant[report.status])}>{report.status}</Badge>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
