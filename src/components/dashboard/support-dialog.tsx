
'use client';

import * as React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Phone, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useCompanySettings } from '@/context/company-settings-context';

interface SupportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupportDialog({ isOpen, onOpenChange }: SupportDialogProps) {
  const { settings } = useCompanySettings();

  const adminPhoneNumber = settings.support_whats_app || "+51987654321"; // Use setting or fallback
  const whatsappMessage = "Hola, necesito soporte con el sistema AgroNorte Corp.";
  const whatsappLink = `https://wa.me/${adminPhoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Contacto de Soporte Técnico</AlertDialogTitle>
          <AlertDialogDescription>
            Si encuentras algún problema o tienes una consulta, puedes contactar al administrador a través de los siguientes medios:
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4 space-y-4">
            <div className="flex items-center gap-4">
                <Phone className="h-5 w-5 text-primary" />
                <div>
                    <p className="font-semibold">Llamada Telefónica</p>
                    <a href={`tel:${adminPhoneNumber}`} className="text-muted-foreground hover:underline">{adminPhoneNumber}</a>
                </div>
            </div>
             <div className="flex items-center gap-4">
                <MessageSquare className="h-5 w-5 text-green-500" />
                <div>
                    <p className="font-semibold">WhatsApp</p>
                    <p className="text-muted-foreground">Envía un mensaje directo para soporte.</p>
                </div>
            </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cerrar</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Link href={whatsappLink} target="_blank">
                <MessageSquare className="mr-2 h-4 w-4"/>
                Abrir WhatsApp
            </Link>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
