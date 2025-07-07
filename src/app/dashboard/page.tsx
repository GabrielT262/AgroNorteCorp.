

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import {
  ArrowRight,
  Package,
  ClipboardCheck,
  Fuel,
  Droplet,
  TriangleAlert,
  Wrench,
} from 'lucide-react';
import type { User, ExpiringProduct, RecentOrder, ManagedUser } from '@/lib/types';
import Link from 'next/link';
import { getDashboardData } from '@/lib/db';
import { ApproveOrderButton } from './approve-order-button';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const AdminDashboard = async ({currentUser}: {currentUser: ManagedUser}) => {
  const {
    recentOrders,
    expiringProducts,
    totalInventoryItems,
    pendingOrdersCount,
    fuelLevels,
  } = await getDashboardData(currentUser);

  const statusBadgeVariant: { [key in RecentOrder['status']]: BadgeProps['variant'] } =
    {
      Aprobado: 'secondary',
      Pendiente: 'outline',
      Rechazado: 'destructive',
      Despachado: 'default',
    };

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/inventory">
          <Card className="hover:bg-muted/80 transition-colors h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Productos en Inventario
              </CardTitle>
              <Package className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{totalInventoryItems}</div>
              <p className="text-xs text-muted-foreground">
                Total de items únicos
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/requests">
          <Card className="hover:bg-muted/80 transition-colors h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pedidos Pendientes
              </CardTitle>
              <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{pendingOrdersCount}</div>
              <p className="text-xs text-muted-foreground">
                Solicitudes por aprobar
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/fuel">
          <Card className="hover:bg-muted/80 transition-colors h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Nivel de Gasolina
              </CardTitle>
              <Fuel className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{fuelLevels.Gasolina.toFixed(1)} gal.</div>
              <p className="text-xs text-muted-foreground">Tanque principal</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/fuel">
          <Card className="hover:bg-muted/80 transition-colors h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Nivel de Petróleo
              </CardTitle>
              <Droplet className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{fuelLevels.Petróleo.toFixed(1)} gal.</div>
              <p className="text-xs text-muted-foreground">Tanque principal</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Pedidos Recientes (Global)</CardTitle>
              <p className="text-sm text-muted-foreground">
                Los últimos pedidos de toda la empresa.
              </p>
            </div>
            <Link href="/dashboard/requests">
              <Button variant="ghost" size="sm">
                Ver Todos <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentOrders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.items.length} producto(s)</TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant[order.status]}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {order.status === 'Pendiente' &&
                        (currentUser.role === 'Administrador' ||
                          currentUser.area === 'Gerencia') ? (
                          <ApproveOrderButton order={order} />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            -
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-10">
                No hay pedidos recientes.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <TriangleAlert className="h-5 w-5 text-yellow-500" />
              <CardTitle>Lotes por Vencer</CardTitle>
            </div>
            <Link href="/dashboard/inventory">
              <Button variant="ghost" size="sm">
                Inventario <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Lotes que expiran en los próximos 30 días.
            </p>
            {expiringProducts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto (Lote)</TableHead>
                    <TableHead>Vence en</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expiringProducts.map((product) => (
                    <TableRow key={`${product.name}-${product.lote_id}`}>
                      <TableCell className="font-medium">
                        {product.name} <span className="text-muted-foreground text-xs">({product.lote_id})</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            product.expires_in === 'Vencido'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {product.expires_in}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {product.stock}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay lotes por vencer pronto.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

const OperarioDashboard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench />
          Portal del Operario
        </CardTitle>
        <CardDescription>Accesos directos a tus tareas diarias.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row">
        <Link href="/dashboard/inventory" className="w-full">
          <Button className="w-full" size="lg">
            <Package className="mr-2" />
            Ver Inventario
          </Button>
        </Link>
         <Link href="/dashboard/requests" className="w-full">
          <Button className="w-full" size="lg" variant="secondary">
            <ClipboardCheck className="mr-2" />
            Mis Solicitudes
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default async function DashboardPage() {
  const { data: currentUser, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', 'usr_gabriel')
    .single();

  if (error || !currentUser) {
    return <div>Usuario no encontrado.</div>
  }

  const adminAreas: User['area'][] = ['Administrador', 'Gerencia'];
  const isAdmin = adminAreas.includes(currentUser.area) || currentUser.role === 'Administrador';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bienvenido, {currentUser.name}</h1>
        <p className="text-muted-foreground">
          {isAdmin
            ? 'Este es un resumen general de la operación.'
            : 'Selecciona una opción para empezar.'}
        </p>
      </div>

      {isAdmin ? (
        <AdminDashboard currentUser={currentUser}/>
      ) : (
        <OperarioDashboard />
      )}
    </div>
  );
}
