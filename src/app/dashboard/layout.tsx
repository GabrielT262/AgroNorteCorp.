

import * as React from "react";
import { getCompanySettings, getUsers } from "@/lib/db";
import { CompanySettingsProvider } from "@/context/company-settings-context";
import { OrderProvider } from "@/context/order-context";
import { ThemeProvider } from "@/context/theme-context";
import { DashboardLayoutContent } from "./layout-client";
import { supabase } from "@/lib/supabase";


export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const companySettings = await getCompanySettings();
  
  // In a real app, user would be fetched based on session.
  // For this prototype, we hardcode a user.
  const { data: currentUser, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', 'usr_gabriel') // Hardcoded admin user ID
    .single();

  if (error || !currentUser) {
    // Handle case where user is not found, maybe redirect to login
    return <div>Usuario no encontrado o error de base de datos.</div>;
  }
  
  // We don't want to pass the password to the client component.
  const { password, ...clientUser } = currentUser;


  return (
    <ThemeProvider defaultTheme="dark" storageKey="agronorte-ui-theme">
      <CompanySettingsProvider initialSettings={companySettings}>
          <OrderProvider>
              <DashboardLayoutContent currentUser={clientUser}>
                {children}
              </DashboardLayoutContent>
          </OrderProvider>
      </CompanySettingsProvider>
    </ThemeProvider>
  )
}
