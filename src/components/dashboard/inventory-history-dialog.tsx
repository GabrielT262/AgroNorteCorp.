
"use client";

import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { InventoryHistoryEntry } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface InventoryHistoryDialogProps {
  history: InventoryHistoryEntry[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InventoryHistoryDialog({ history, isOpen, onOpenChange }: InventoryHistoryDialogProps) {

  const typeVariant = {
    'Entrada': 'bg-green-500/20 text-green-700 border-green-500/30',
    'Salida': 'bg-red-500/20 text-red-700 border-red-500/30',
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-headline">Historial de Movimientos</DialogTitle>
          <DialogDescription>
            Registro global de entradas y salidas del inventario.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0">
            <ScrollArea className="h-full">
                <Table>
                    <TableHeader className="sticky top-0 bg-background">
                        <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                        <TableHead>Área</TableHead>
                        <TableHead>Usuario</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(entry => {
                            const userName = entry.users ? `${entry.users.name} ${entry.users.last_name}` : entry.user_id;
                            return (
                                <TableRow key={entry.id}>
                                    <TableCell className="font-medium whitespace-nowrap">{format(new Date(entry.date), "dd/MM/yyyy HH:mm", { locale: es })}</TableCell>
                                    <TableCell>{entry.product_name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={typeVariant[entry.type]}>{entry.type}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">{entry.quantity} {entry.unit}</TableCell>
                                    <TableCell>{entry.requesting_area}</TableCell>
                                    <TableCell>{userName}</TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
