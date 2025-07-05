
'use client';

import * as React from 'react';
import Image from 'next/image';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { RecentOrder } from '@/lib/types';
import { useCompanySettings } from '@/context/company-settings-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface DispatchReceiptProps {
  order: RecentOrder;
}

const Receipt = ({ order, logoUrl }: { order: RecentOrder, logoUrl: string }) => (
    <div className="bg-white p-6 border-2 border-gray-800 w-full font-sans text-gray-900">
    {/* Header */}
    <div className="flex justify-between items-start pb-4 border-b-2 border-gray-800">
      <div className="flex items-center gap-4">
        {logoUrl ? (
          <Image src={logoUrl} alt="Logo" width={120} height={50} className="object-contain" />
        ) : (
          <div className="w-[120px] h-[50px] bg-gray-200 flex items-center justify-center text-sm text-gray-500">Logo</div>
        )}
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
        <span>{order.requestingArea}</span>
      </div>
      <div className="flex gap-2">
        <span className="font-bold">USUARIO:</span>
        <span>{order.requestingUserName}</span>
      </div>
      <div className="flex gap-2">
        <span className="font-bold">CENTRO DE COSTO:</span>
        <span>{order.costCenter || 'N/A'}</span>
      </div>
       {order.cultivo && (
        <div className="col-span-2 flex gap-2">
            <span className="font-bold">CULTIVO:</span>
            <span>{order.cultivo}</span>
        </div>
       )}
    </div>

    {/* Items Table */}
    <div className="my-2 min-h-[18rem]">
      <Table className="text-xs">
        <TableHeader>
          <TableRow className="border-b-2 border-gray-800 hover:bg-transparent">
            <TableHead className="h-8 font-bold text-black">CÓDIGO</TableHead>
            <TableHead className="h-8 font-bold text-black">DESCRIPCIÓN</TableHead>
            <TableHead className="h-8 font-bold text-black">USO / DESTINO</TableHead>
            <TableHead className="h-8 text-right font-bold text-black">CANT.</TableHead>
            <TableHead className="h-8 font-bold text-black">UNIDAD</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {order.items.map((item) => (
            <TableRow key={item.itemId} className="border-b-gray-300 hover:bg-transparent">
              <TableCell className="py-1.5">{item.itemId}</TableCell>
              <TableCell className="py-1.5">{item.name}</TableCell>
              <TableCell className="py-1.5 max-w-xs truncate">{item.usageDescription || '-'}</TableCell>
              <TableCell className="text-right py-1.5">{item.quantity}</TableCell>
              <TableCell className="py-1.5">{item.unit}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
    
    {/* Observations */}
    {order.observations && (
        <div className="text-xs mt-4 p-2 border border-gray-800">
            <p className="font-bold">OBSERVACIONES:</p>
            <p>{order.observations}</p>
        </div>
    )}

    {/* Signatures */}
    <div className="grid grid-cols-3 gap-6 pt-8 text-center text-xs">
      <div>
        <div className="h-16 w-40 mx-auto border-b-2 border-gray-800 mb-2 flex items-center justify-center p-1">
          {order.requestingUserSignatureUrl ? (
             <Image src={order.requestingUserSignatureUrl} alt="Firma del solicitante" width={140} height={60} className="object-contain" data-ai-hint="signature"/>
          ) : <span className="text-gray-400">Sin firma</span>}
        </div>
        <p className="font-bold">{order.requestingUserName}</p>
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
);


export function DispatchReceipt({ order }: DispatchReceiptProps) {
  const { settings } = useCompanySettings();

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
        <Receipt order={order} logoUrl={settings.logoUrl} />
        <div className="border-t-2 border-dashed border-gray-400 my-4" />
        <Receipt order={order} logoUrl={settings.logoUrl} />
      </div>
    </div>
  );
}
