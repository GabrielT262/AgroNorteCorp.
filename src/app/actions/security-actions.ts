'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import type { SecurityReport, RegisteredVehicle } from '@/lib/types';
import { eq, ilike } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function createSecurityReportAction(data: Omit<SecurityReport, 'id' | 'date' | 'author' | 'photos'>, photos: string[]) {
    const newReportId = `REP-${uuidv4().slice(0, 8).toUpperCase()}`;
    try {
        await db.insert(schema.securityReports).values({
            ...data,
            id: newReportId,
            date: new Date(),
            author: 'Current User', // Placeholder for actual user
            photos, // In a real app, you'd upload and get URLs
        });
        revalidatePath('/dashboard/security-reports');
        return { success: true, reportId: newReportId };
    } catch (error) {
        console.error('Error creating security report:', error);
        return { success: false, message: 'Error al crear el reporte.' };
    }
}

export async function approveSecurityRequestAction(reportId: string) {
    try {
        await db.update(schema.securityReports)
            .set({ status: 'Aprobado' })
            .where(eq(schema.securityReports.id, reportId));
        revalidatePath('/dashboard/security-reports');
        return { success: true };
    } catch (error) {
        console.error('Error approving security request:', error);
        return { success: false, message: 'Error al aprobar la solicitud.' };
    }
}

export async function rejectSecurityRequestAction(reportId: string) {
    try {
        await db.update(schema.securityReports)
            .set({ status: 'Rechazado' })
            .where(eq(schema.securityReports.id, reportId));
        revalidatePath('/dashboard/security-reports');
        return { success: true };
    } catch (error) {
        console.error('Error rejecting security request:', error);
        return { success: false, message: 'Error al rechazar la solicitud.' };
    }
}

export async function registerVehicleEntryAction(data: Omit<RegisteredVehicle, 'id'>, photoUrl: string | null) {
    const reportId = `VEH-${uuidv4().slice(0, 8).toUpperCase()}`;
    const description = `Ingreso del vehículo con placa ${data.vehiclePlate}, modelo ${data.vehicleModel}, conducido por ${data.employeeName} del área ${data.employeeArea}.`;
    
    try {
        // Upsert logic for the registered vehicle
        await db.insert(schema.registeredVehicles)
            .values({ id: uuidv4(), ...data })
            .onConflictDoUpdate({
                target: schema.registeredVehicles.employeeName,
                set: {
                    employeeArea: data.employeeArea,
                    vehicleType: data.vehicleType,
                    vehicleModel: data.vehicleModel,
                    vehiclePlate: data.vehiclePlate,
                }
            });

        // Create a security report for the entry
        await db.insert(schema.securityReports).values({
            id: reportId,
            date: new Date(),
            title: `Ingreso Vehicular: ${data.employeeName}`,
            description,
            type: 'Ingreso Vehículo Trabajador',
            author: 'Current User', // Placeholder
            photos: photoUrl ? [photoUrl] : [],
            status: 'Cerrado', // Vehicle entries are usually just logs, not open cases
        });

        revalidatePath('/dashboard/security-reports');
        return { success: true };
    } catch (error) {
        console.error('Error registering vehicle entry:', error);
        return { success: false, message: 'Error al registrar el ingreso.' };
    }
}

export async function findVehicleByEmployeeNameAction(name: string): Promise<RegisteredVehicle | null> {
    try {
        const result = await db.query.registeredVehicles.findFirst({
            where: ilike(schema.registeredVehicles.employeeName, name)
        });
        return result || null;
    } catch (error) {
        console.error('Error finding vehicle by employee name:', error);
        return null;
    }
}
