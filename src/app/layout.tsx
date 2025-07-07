import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { CompanySettingsProvider } from '@/context/company-settings-context';
import { getCompanySettings } from '@/lib/db';

export async function generateMetadata(): Promise<Metadata> {
  const companySettings = await getCompanySettings();
  
  return {
    title: 'Agro Norte Corp',
    description: 'Sistema de gestión de inventario y pedidos.',
    icons: {
      icon: companySettings.logo_url || 'https://placehold.co/32x32.png',
      apple: companySettings.logo_url || 'https://placehold.co/180x180.png',
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetching settings for non-dashboard pages like the login page.
  const companySettings = await getCompanySettings();

  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Poppins:wght@600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <CompanySettingsProvider initialSettings={companySettings}>
            {children}
        </CompanySettingsProvider>
        <Toaster />
      </body>
    </html>
  );
}
