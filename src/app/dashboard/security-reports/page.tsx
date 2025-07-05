
'use client';

import * as React from 'react';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { useSecurity } from '@/context/security-context';
import type { User, SecurityReport } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { PlusCircle, History, AlertTriangle, Car } from 'lucide-react';
import { CreateSecurityReportDialog } from '@/components/dashboard/create-security-report-dialog';
import { SecurityReportHistoryDialog } from '@/components/dashboard/security-report-history-dialog';
import { SecurityReportCard } from '@/components/dashboard/security-report-card';
import { RegisterVehicleEntryDialog } from '@/components/dashboard/register-vehicle-entry-dialog';

// Hardcoded current user for demonstration
const currentUser: User = { name: 'Carlos P', role: 'Usuario', area: 'Seguridad Patrimonial' };
// To test other roles, change the currentUser object above to:
// const currentUser: User = { name: 'Gabriel T', role: 'Administrador', area: 'Administrador' };
// const currentUser: User = { name: 'Ana G', role: 'Usuario', area: 'Gerencia' };


export default function SecurityReportsPage() {
  const { reports } = useSecurity();
  const [isCreateOpen, setCreateOpen] = React.useState(false);
  const [isHistoryOpen, setHistoryOpen] = React.useState(false);
  const [isRegisterVehicleOpen, setRegisterVehicleOpen] = React.useState(false);
  const [todaysReports, setTodaysReports] = React.useState<SecurityReport[]>([]);

  const canManageReports = currentUser.area === 'Seguridad Patrimonial' || currentUser.role === 'Administrador';

  React.useEffect(() => {
    // This effect runs only on the client, after hydration, avoiding the mismatch.
    const today = new Date();
    const filteredReports = reports
      .filter(report => differenceInCalendarDays(today, parseISO(report.date)) === 0)
      .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    setTodaysReports(filteredReports);
  }, [reports]);

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight font-headline">Reportes de Seguridad</h1>
              <p className="text-muted-foreground">Registro de novedades e incidentes del día.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setHistoryOpen(true)}>
              <History className="mr-2 h-4 w-4" />
              Ver Historial
            </Button>
            {canManageReports && (
              <>
                <Button onClick={() => setRegisterVehicleOpen(true)}>
                  <Car className="mr-2 h-4 w-4" />
                  Registrar Ingreso
                </Button>
                <Button onClick={() => setCreateOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Crear Reporte
                </Button>
              </>
            )}
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {todaysReports.length > 0 ? (
                todaysReports.map(report => <SecurityReportCard key={report.id} report={report} currentUser={currentUser} />)
            ) : (
                <div className="col-span-full text-center py-16 bg-muted/50 rounded-lg">
                    <p className="text-lg font-semibold">No hay reportes de seguridad para hoy.</p>
                    <p className="text-muted-foreground">Crea un nuevo reporte para registrar una novedad.</p>
                </div>
            )}
        </div>

      </div>

      <CreateSecurityReportDialog isOpen={isCreateOpen} onOpenChange={setCreateOpen} />
      <RegisterVehicleEntryDialog isOpen={isRegisterVehicleOpen} onOpenChange={setRegisterVehicleOpen} />
      <SecurityReportHistoryDialog isOpen={isHistoryOpen} onOpenChange={setHistoryOpen} allReports={reports} />
    </>
  );
}
