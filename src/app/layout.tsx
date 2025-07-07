
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { CompanySettingsProvider } from '@/context/company-settings-context';
import { getCompanySettings } from '@/lib/db';
import { ThemeProvider } from '@/context/theme-context';

const defaultIcon = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌿</text></svg>';

export async function generateMetadata(): Promise<Metadata> {
  const companySettings = await getCompanySettings();
  
  return {
    title: 'Agro Norte Corp',
    description: 'Sistema de gestión de inventario y pedidos.',
    icons: {
      icon: companySettings.logo_url || defaultIcon,
      apple: companySettings.logo_url || defaultIcon,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const companySettings = await getCompanySettings();

  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider defaultTheme="dark" storageKey="agronorte-ui-theme">
          <CompanySettingsProvider initialSettings={companySettings}>
              {children}
          </CompanySettingsProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
