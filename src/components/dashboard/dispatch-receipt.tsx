
'use client';

import * as React from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { RecentOrder } from '@/lib/types';
import { useCompanySettings } from '@/context/company-settings-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Leaf } from 'lucide-react';

interface DispatchReceiptProps {
  order: RecentOrder;
}

const Receipt = ({ order }: { order: RecentOrder }) => {
    const userName = order.users ? `${order.users.name} ${order.users.last_name}` : 'Usuario no encontrado';

    return (
    <div className="bg-white p-6 border-2 border-gray-800 w-full font-sans text-gray-900">
    {/* Header */}
    <div className="flex justify-between items-start pb-4 border-b-2 border-gray-800">
      <div className="flex items-center gap-4">
        <Leaf className="h-10 w-10 text-gray-700" />
        <h1 className="text-2xl font-bold tracking-wider">VALE DE DESPACHO</h1>
      </div>
      <div className="text-right border-2 border-gray-800 p-2">
        <p className="text-lg font-bold">N°: {order.id}</p>
      </div>
    </div>
    
    {/* Order Details */}
    <div className="grid grid-cols-2 gap-x-6 gap-y-2 py-3 text-sm border-b border-gray-800">
      <div className="flex gap-2">
        <span className="font-bold">FECHA:</span>
        <span>{format(parseISO(order.date), "dd/MM/yyyy HH:mm", { locale: es })}</span>
      </div>
      <div className="flex gap-2">
        <span className="font-bold">ÁREA SOLICITANTE:</span>
        <span>{order.requesting_area}</span>
      </div>
       <div className="col-span-2 flex gap-2">
        <span className="font-bold">USUARIO:</span>
        <span>{userName}</span>
      </div>
    </div>

    {/* Items Table */}
    <div className="my-2 min-h-[22rem]">
      <Table className="text-xs">
        <TableHeader>
          <TableRow className="border-b-2 border-gray-800 hover:bg-transparent">
            <TableHead className="h-8 font-bold text-black w-[15%]">CÓDIGO</TableHead>
            <TableHead className="h-8 font-bold text-black w-[55%]">DESCRIPCIÓN Y DETALLES</TableHead>
            <TableHead className="h-8 text-right font-bold text-black w-[15%]">CANT.</TableHead>
            <TableHead className="h-8 font-bold text-black w-[15%]">UNIDAD</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {order.items.map((item) => (
            <TableRow key={item.item_id} className="border-b-gray-300 hover:bg-transparent align-top">
              <TableCell className="py-2">{item.item_id}</TableCell>
              <TableCell className="py-2">
                <p className="font-semibold">{item.name}</p>
                <div className="text-gray-600 space-y-0.5 mt-1">
                    {item.cost_center && <p>C. Costo: {item.cost_center}</p>}
                    {item.cultivo && <p>Cultivo/Lote: {item.cultivo}</p>}
                    {item.area && <p>Área Dest: {item.area}</p>}
                    {item.observations && <p className="whitespace-pre-wrap">Obs: {item.observations}</p>}
                </div>
              </TableCell>
              <TableCell className="text-right py-2">{item.quantity}</TableCell>
              <TableCell className="py-2">{item.unit}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>

    {/* Signatures */}
    <div className="grid grid-cols-3 gap-6 pt-8 text-center text-xs">
      <div>
        <div className="h-16 w-40 mx-auto border-b-2 border-gray-800 mb-2 flex items-center justify-center p-1">
          <span className="text-gray-400">Sin firma</span>
        </div>
        <p className="font-bold">{userName}</p>
        <p>RECIBÍ CONFORME (SOLICITANTE)</p>
      </div>
       <div>
        <div className="h-16 w-40 mx-auto border-b-2 border-gray-800 mb-2" />
        <p className="font-bold">.................................................</p>
        <p>ENTREGUE CONFORME (ALMACÉN)</p>
      </div>
      <div>
        <div className="h-16 w-40 mx-auto border-b-2 border-gray-800 mb-2" />
        <p className="font-bold">.................................................</p>
        <p>V°B° JEFE DE ÁREA</p>
      </div>
    </div>
  </div>
)};


export function DispatchReceipt({ order }: DispatchReceiptProps) {
  return (
    <div className="font-sans text-black bg-white a4-sheet">
       <style jsx global>{`
        @media print {
          body, html {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
      <div className="flex flex-col space-y-4">
        <Receipt order={order} />
        <div className="border-t-2 border-dashed border-gray-400 my-4" />
        <Receipt order={order} />
      </div>
    </div>
  );
}
