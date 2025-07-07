
'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { getCompanySettings } from '@/lib/db';

async function uploadFileAndGetUrl(file: File, bucket: string, path: string): Promise<string | null> {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: '3600',
        upsert: true,
    });
    if (error) {
        console.error(`Error uploading to ${bucket}:`, error);
        return null;
    }
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
    return publicUrl;
}

export async function updateCompanySettingsAction(formData: FormData) {
  const supportWhatsApp = formData.get('support_whats_app') as string;
  const logoFile = formData.get('logo') as File;
  const bgFile = formData.get('login_bg') as File;

  try {
    const currentSettings = await getCompanySettings();
    let logo_url = currentSettings.logo_url;
    let login_bg_url = currentSettings.login_bg_url;

    if (logoFile && logoFile.size > 0) {
        const logoPath = `public/logo-${Date.now()}`;
        const newLogoUrl = await uploadFileAndGetUrl(logoFile, 'company', logoPath);
        if(newLogoUrl) logo_url = newLogoUrl;
    }

    if (bgFile && bgFile.size > 0) {
        const bgPath = `public/login-bg-${Date.now()}`;
        const newBgUrl = await uploadFileAndGetUrl(bgFile, 'company', bgPath);
        if(newBgUrl) login_bg_url = newBgUrl;
    }
    
    const { error } = await supabase
        .from('company_settings')
        .update({
            support_whats_app: supportWhatsApp,
            logo_url: logo_url,
            login_bg_url: login_bg_url
        })
        .eq('id', 1);
        
    if (error) throw error;

    revalidatePath('/dashboard/company-settings');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error updating company settings:', error);
    return { success: false, message: 'Error al guardar la configuración.' };
  }
}
