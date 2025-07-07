import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { CompanySettingsProvider } from '@/context/company-settings-context';
import { getCompanySettings } from '@/lib/db';

export const metadata: Metadata = {
  title: 'Agro Norte Corp',
  description: 'Sistema de gestión de inventario y pedidos.',
};

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
