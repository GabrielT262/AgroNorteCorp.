'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import type { SecurityReport, RegisteredVehicle } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { createNotificationAction } from './notification-actions';

export async function createSecurityReportAction(data: Omit<SecurityReport, 'id' | 'date' | 'author_id' | 'photos' | 'users'>) {
    const newReportId = `REP-${uuidv4().slice(0, 8).toUpperCase()}`;
    const hardcodedUserId = 'usr_gabriel'; // Placeholder for actual user from session
    try {
        const newReport: Omit<SecurityReport, 'id' | 'users'> = {
            ...data,
            date: new Date().toISOString(),
            author_id: hardcodedUserId,
            photos: [], // Photos are not implemented yet
        };

        const { error } = await supabase.from('security_reports').insert({ id: newReportId, ...newReport });
        if(error) throw error;


        if (data.type === 'Solicitud de Permiso') {
            await createNotificationAction({
                recipient_id: 'Gerencia',
                title: 'Nueva Solicitud de Permiso',
                description: `Se ha creado una solicitud de permiso: "${data.title}"`,
                path: '/dashboard/security-reports',
            });
        }
        
        revalidatePath('/dashboard/security-reports');
        return { success: true, reportId: newReportId };
    } catch (error) {
        console.error('Error creating security report:', error);
        return { success: false, message: 'Error al crear el reporte.' };
    }
}

export async function approveSecurityRequestAction(reportId: string) {
    try {
        const { error } = await supabase.from('security_reports').update({ status: 'Aprobado' }).eq('id', reportId);
        if(error) throw error;
        
        revalidatePath('/dashboard/security-reports');
        return { success: true };
    } catch (error) {
        console.error('Error approving security request:', error);
        return { success: false, message: 'Error al aprobar la solicitud.' };
    }
}

export async function rejectSecurityRequestAction(reportId: string) {
    try {
        const { error } = await supabase.from('security_reports').update({ status: 'Rechazado' }).eq('id', reportId);
        if(error) throw error;

        revalidatePath('/dashboard/security-reports');
        return { success: true };
    } catch (error) {
        console.error('Error rejecting security request:', error);
        return { success: false, message: 'Error al rechazar la solicitud.' };
    }
}

export async function registerVehicleEntryAction(data: Omit<RegisteredVehicle, 'id' | 'users'>) {
    const reportId = `VEH-${uuidv4().slice(0, 8).toUpperCase()}`;
    const hardcodedUserId = 'usr_gabriel'; // Placeholder for actual user from session
    const {data: employee, error: employeeError} = await supabase.from('users').select('name, last_name').eq('id', data.employee_id).single();
    if(employeeError) throw employeeError;

    const employeeFullName = `${employee.name} ${employee.last_name}`;
    const description = `Ingreso del vehículo con placa ${data.vehicle_plate}, modelo ${data.vehicle_model}, conducido por ${employeeFullName} del área ${data.employee_area}.`;
    
    try {
        // Upsert logic for the registered vehicle
        const { error: upsertError } = await supabase
            .from('registered_vehicles')
            .upsert({ id: `VEHREG-${data.employee_id}`, ...data }, { onConflict: 'employee_id' });
        
        if (upsertError) throw upsertError;

        // Create a security report for the entry
        const newReport: Omit<SecurityReport, 'id' | 'users'> = {
            date: new Date().toISOString(),
            title: `Ingreso Vehicular: ${employeeFullName}`,
            description,
            type: 'Ingreso Vehículo Trabajador',
            author_id: hardcodedUserId,
            status: 'Cerrado', // Vehicle entries are usually just logs, not open cases
        };

        const { error: reportError } = await supabase.from('security_reports').insert({ id: reportId, ...newReport });
        if(reportError) throw reportError;


        revalidatePath('/dashboard/security-reports');
        return { success: true };
    } catch (error) {
        console.error('Error registering vehicle entry:', error);
        return { success: false, message: 'Error al registrar el ingreso.' };
    }
}

export async function findVehicleByEmployeeIdAction(employeeId: string): Promise<RegisteredVehicle | null> {
    try {
        const { data, error } = await supabase
            .from('registered_vehicles')
            .select('*')
            .eq('employee_id', employeeId)
            .single();
        
        if(error || !data) return null;

        return data;
    } catch (error) {
        console.error('Error finding vehicle by employee id:', error);
        return null;
    }
}
