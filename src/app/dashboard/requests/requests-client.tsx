"use client";

import * as React from "react";
import { useToast } from "@/hooks/use-toast";
import type { RecentOrder, User, UserRole } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Truck, X, Printer, Loader2 } from "lucide-react";
import { PrintReceiptDialog } from "@/components/dashboard/print-receipt-dialog";
import { approveOrderAction, rejectOrderAction, dispatchOrderAction } from '@/app/actions/order-actions';


const statusBadgeVariant: {[key in RecentOrder['status']]: BadgeProps['variant']} = {
  'Aprobado': 'secondary',
  'Pendiente': 'outline',
  'Rechazado': 'destructive',
  'Despachado': 'default',
};

interface RequestsClientProps {
    initialOrders: RecentOrder[];
    currentUser: User;
}

export function RequestsClient({ initialOrders, currentUser }: RequestsClientProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [orderToPrint, setOrderToPrint] = React.useState<RecentOrder | null>(null);
  
  // Memoize filtered lists
  const pendingApproval = React.useMemo(() => initialOrders.filter(o => o.status === 'Pendiente'), [initialOrders]);
  const readyForDispatch = React.useMemo(() => initialOrders.filter(o => o.status === 'Aprobado'), [initialOrders]);
  const orderHistory = React.useMemo(() => initialOrders.filter(o => o.status === 'Despachado' || o.status === 'Rechazado'), [initialOrders]);
  const userPending = React.useMemo(() => initialOrders.filter(o => o.requesting_area === currentUser.area && o.status === 'Pendiente'), [initialOrders, currentUser.area]);
  const userHistory = React.useMemo(() => initialOrders.filter(o => o.requesting_area === currentUser.area && o.status !== 'Pendiente'), [initialOrders, currentUser.area]);

  const canApproveRoles: UserRole[] = ['Administrador', 'Gerencia'];
  const canDispatchRoles: UserRole[] = ['Administrador', 'Almacén'];
  const canViewGlobalHistoryRoles: UserRole[] = ['Administrador', 'Gerencia', 'Almacén', 'Logística'];
  
  const canApprove = canApproveRoles.includes(currentUser.role);
  const canDispatch = canDispatchRoles.includes(currentUser.role);
  const canViewGlobalHistory = canViewGlobalHistoryRoles.includes(currentUser.role);


  const handleAction = (action: () => Promise<any>, successMessage: string, errorMessage: string) => {
    startTransition(async () => {
        const result = await action();
        if (result.success) {
            toast({ title: successMessage });
        } else {
            toast({ title: "Error", description: result.message || errorMessage, variant: "destructive" });
        }
    });
  };

  const handleApprove = (order: RecentOrder) => handleAction(() => approveOrderAction(order), `Pedido ${order.id} Aprobado`, "No se pudo aprobar el pedido.");
  const handleReject = (order: RecentOrder) => handleAction(() => rejectOrderAction(order.id, order.requesting_area), `Pedido ${order.id} Rechazado`, "No se pudo rechazar el pedido.");
  const handleDispatch = (order: RecentOrder) => handleAction(() => dispatchOrderAction(order), `Pedido ${order.id} Despachado`, "No se pudo despachar el pedido.");

  const renderTable = (orders: RecentOrder[], type: 'approval' | 'dispatch' | 'history' | 'user') => {
    if (orders.length === 0) {
      return <p className="text-center text-muted-foreground py-8">No hay solicitudes en esta vista.</p>;
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Solicitante</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map(order => {
            const userName = order.users ? `${order.users.name} ${order.users.last_name}` : order.requesting_user_id;
            return (
                <TableRow key={order.id}>
                <TableCell className="font-medium">{order.id}</TableCell>
                <TableCell>{order.items.length} producto(s)</TableCell>
                <TableCell>{userName} ({order.requesting_area})</TableCell>
                <TableCell>
                    <Badge variant={statusBadgeVariant[order.status]}>{order.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                    {isPending && <Loader2 className="h-4 w-4 animate-spin ml-auto" />}
                    {!isPending && type === 'approval' && (
                    <div className="flex gap-2 justify-end">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-600 hover:bg-green-100" onClick={() => handleApprove(order)}><Check className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:text-red-600 hover:bg-red-100" onClick={() => handleReject(order)}><X className="h-4 w-4" /></Button>
                    </div>
                    )}
                    {!isPending && type === 'dispatch' && (
                    <div className="flex gap-2 justify-end">
                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setOrderToPrint(order)}>
                        <Printer className="h-4 w-4" />
                        <span className="sr-only">Imprimir Vale</span>
                        </Button>
                        <Button size="sm" onClick={() => handleDispatch(order)}><Truck className="mr-2 h-4 w-4" />Despachar</Button>
                    </div>
                    )}
                    {!isPending && (type === 'history' || type === 'user') && (
                    <span className="text-xs text-muted-foreground">-</span>
                    )}
                </TableCell>
                </TableRow>
            )
          })}
        </TableBody>
      </Table>
    );
  };
  
  if (!canViewGlobalHistory) {
      return (
        <div className="flex flex-col gap-6">
            <h1 className="text-3xl font-bold tracking-tight font-headline">Mis Solicitudes</h1>
            <Tabs defaultValue="pendientes">
                <TabsList>
                    <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
                    <TabsTrigger value="historial">Historial</TabsTrigger>
                </TabsList>
                <TabsContent value="pendientes">
                    <Card><CardContent className="p-0">{renderTable(userPending, 'user')}</CardContent></Card>
                </TabsContent>
                <TabsContent value="historial">
                    <Card><CardContent className="p-0">{renderTable(userHistory, 'user')}</CardContent></Card>
                </TabsContent>
            </Tabs>
        </div>
      )
  }

  const defaultTab = canApprove ? 'approval' : canDispatch ? 'dispatch' : 'history';

  return (
    <>
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Gestión de Solicitudes</h1>
        
        <Tabs defaultValue={defaultTab}>
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
            {(canApprove) && <TabsTrigger value="approval">Pendientes por Aprobar</TabsTrigger>}
            {(canDispatch) && <TabsTrigger value="dispatch">Listos para Despacho</TabsTrigger>}
            {canViewGlobalHistory && <TabsTrigger value="history">Historial Global</TabsTrigger>}
          </TabsList>

          {(canApprove) && (
            <TabsContent value="approval">
              <Card>
                  <CardHeader>
                      <CardTitle>Solicitudes Pendientes de Aprobación</CardTitle>
                      <CardDescription>Revisa y aprueba o rechaza las nuevas solicitudes de productos.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      {renderTable(pendingApproval, 'approval')}
                  </CardContent>
              </Card>
            </TabsContent>
          )}

          {(canDispatch) && (
            <TabsContent value="dispatch">
              <Card>
                  <CardHeader>
                      <CardTitle>Pedidos Listos para Despacho</CardTitle>
                      <CardDescription>Estos pedidos han sido aprobados por Gerencia y están listos para ser preparados y enviados.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      {renderTable(readyForDispatch, 'dispatch')}
                  </CardContent>
              </Card>
            </TabsContent>
          )}

          {canViewGlobalHistory && (
              <TabsContent value="history">
                  <Card>
                      <CardHeader>
                          <CardTitle>Historial Global de Solicitudes</CardTitle>
                          <CardDescription>Consulta el registro de todas las solicitudes que han sido despachadas o rechazadas.</CardDescription>
                      </CardHeader>
                      <CardContent>
                          {renderTable(orderHistory, 'history')}
                      </CardContent>
                  </Card>
              </TabsContent>
          )}
        </Tabs>
      </div>

      <PrintReceiptDialog
        isOpen={!!orderToPrint}
        onOpenChange={() => setOrderToPrint(null)}
        order={orderToPrint}
      />
    </>
  );
}
