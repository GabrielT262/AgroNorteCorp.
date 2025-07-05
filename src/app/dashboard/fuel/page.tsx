
'use client';

import * as React from 'react';
import type { DateRange } from "react-day-picker"
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import * as XLSX from "xlsx";

import { useFuel } from '@/context/fuel-context';
import type { FuelHistoryEntry, FuelType, User, UserArea, VehicleType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { FuelGauge } from '@/components/dashboard/fuel-gauge';
import { AddFuelStockDialog } from '@/components/dashboard/add-fuel-stock-dialog';
import { DispatchFuelDialog } from '@/components/dashboard/dispatch-fuel-dialog';
import { Plus, Download, Calendar as CalendarIcon, X, Fuel } from 'lucide-react';

const currentUser: User = { name: 'Gabriel T', role: 'Administrador', area: 'Administrador' };
const canViewHistoryAreas: UserArea[] = ['Gerencia', 'Logística', 'Almacén', 'Administrador'];

export default function FuelPage() {
  const { levels, history } = useFuel();
  const { toast } = useToast();
  
  const [isAddStockOpen, setAddStockOpen] = React.useState(false);
  const [isDispatchOpen, setDispatchOpen] = React.useState(false);
  
  // Filter states
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
  const [fuelTypeFilter, setFuelTypeFilter] = React.useState<"all" | FuelType>("all");
  const [vehicleTypeFilter, setVehicleTypeFilter] = React.useState<"all" | VehicleType>("all");

  const canViewHistory = canViewHistoryAreas.includes(currentUser.area);
  const vehicleTypes: VehicleType[] = ['Tractor', 'Camión', 'Camioneta', 'Moto Lineal'];

  const filteredHistory = React.useMemo(() => {
    return history.filter(entry => {
      const entryDate = parseISO(entry.date);
      if (dateRange?.from && entryDate < dateRange.from) return false;
      if (dateRange?.to) {
          // Include the whole day of 'to' date
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          if (entryDate > toDate) return false;
      }
      if (fuelTypeFilter !== 'all' && entry.fuelType !== fuelTypeFilter) return false;
      if (vehicleTypeFilter !== 'all' && entry.vehicleType !== vehicleTypeFilter) return false;
      return true;
    }).sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  }, [history, dateRange, fuelTypeFilter, vehicleTypeFilter]);

  const handleExport = () => {
    const dataToExport = filteredHistory.map(entry => ({
      'ID': entry.id,
      'Fecha': format(parseISO(entry.date), 'dd/MM/yyyy HH:mm'),
      'Tipo Movimiento': entry.type,
      'Tipo Combustible': entry.fuelType,
      'Cantidad (gal)': entry.quantity,
      'Área Solicitante': entry.area || '-',
      'Usuario': entry.user || '-',
      'Tipo Vehículo': entry.vehicleType || '-',
      'Registrado Por': entry.registeredBy,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Historial Combustible");
    XLSX.writeFile(workbook, "historial_combustible.xlsx");
    toast({
        title: "Exportación Completa",
        description: "El historial de combustible ha sido exportado.",
    });
  };

  const clearFilters = () => {
    setDateRange(undefined);
    setFuelTypeFilter('all');
    setVehicleTypeFilter('all');
  }

  const hasActiveFilters = dateRange || fuelTypeFilter !== 'all' || vehicleTypeFilter !== 'all';
  
  const movementTypeVariant: {[key in FuelHistoryEntry['type']]: BadgeProps['variant']} = {
    'Abastecimiento': 'default',
    'Consumo': 'secondary'
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Gestión de Combustible</h1>
        <div className="flex gap-2">
          <Button onClick={() => setDispatchOpen(true)}>
            <Fuel className="h-4 w-4 mr-2" />
            Despachar
          </Button>
          <Button variant="outline" onClick={() => setAddStockOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Añadir Stock
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center justify-items-center">
        <FuelGauge fuelType="Gasolina" currentLevel={levels.Gasolina} maxLevel={70} />
        <FuelGauge fuelType="Petróleo" currentLevel={levels.Petróleo} maxLevel={1000} />
      </div>

      {canViewHistory && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                <div>
                    <CardTitle>Historial de Movimientos</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Consulta el registro de consumo y abastecimiento.</p>
                </div>
                <Button onClick={handleExport} variant="outline"><Download className="mr-2 h-4 w-4" />Exportar</Button>
            </div>
            <div className="flex flex-wrap items-end gap-2 pt-4">
                <div className="grid gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Rango de Fechas</label>
                     <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                            "w-[260px] justify-start text-left font-normal",
                            !dateRange && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (
                            dateRange.to ? (
                                <>
                                {format(dateRange.from, "LLL dd, y")} -{" "}
                                {format(dateRange.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(dateRange.from, "LLL dd, y")
                            )
                            ) : (
                            <span>Seleccionar rango</span>
                            )}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={2}
                            locale={es}
                        />
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="grid gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Combustible</label>
                    <Select value={fuelTypeFilter} onValueChange={(v) => setFuelTypeFilter(v as any)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filtrar..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="Gasolina">Gasolina</SelectItem>
                            <SelectItem value="Petróleo">Petróleo</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="grid gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Tipo de Vehículo</label>
                    <Select value={vehicleTypeFilter} onValueChange={(v) => setVehicleTypeFilter(v as any)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filtrar..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {vehicleTypes.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                {hasActiveFilters && (
                    <Button variant="ghost" onClick={clearFilters}>
                        <X className="mr-2 h-4 w-4"/>
                        Limpiar filtros
                    </Button>
                )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Combustible</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead>Área/Vehículo</TableHead>
                    <TableHead>Usuario</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredHistory.length > 0 ? (
                        filteredHistory.map(entry => (
                            <TableRow key={entry.id}>
                            <TableCell className="font-medium whitespace-nowrap">{format(parseISO(entry.date), "dd/MM/yy HH:mm", { locale: es })}</TableCell>
                            <TableCell>
                                <Badge variant={movementTypeVariant[entry.type]}>{entry.type}</Badge>
                            </TableCell>
                            <TableCell>{entry.fuelType}</TableCell>
                            <TableCell className="text-right">{entry.quantity.toFixed(2)} gal</TableCell>
                            <TableCell>{entry.area || entry.vehicleType}</TableCell>
                            <TableCell>{entry.user}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center h-24">No hay resultados para los filtros seleccionados.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
                </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <AddFuelStockDialog isOpen={isAddStockOpen} onOpenChange={setAddStockOpen} />
      <DispatchFuelDialog isOpen={isDispatchOpen} onOpenChange={setDispatchOpen} />
    </div>
  );
}
