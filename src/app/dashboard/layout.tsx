

"use client";

import Link from "next/link";
import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Bell,
  Fuel,
  GalleryHorizontal,
  Home,
  Leaf,
  LifeBuoy,
  LogOut,
  Menu,
  Package,
  Paintbrush,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Users,
  Megaphone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { User, Communication } from "@/lib/types";
import { OrderProvider, useOrder } from "@/context/order-context";
import { OrderSheet } from "@/components/dashboard/order-sheet";
import { ThemeProvider } from "@/context/theme-context";
import { SupportDialog } from "@/components/dashboard/support-dialog";
import { CompanySettingsProvider, useCompanySettings } from "@/context/company-settings-context";


const CartButton = () => {
    const { orderItems, setSheetOpen } = useOrder();
    const itemCount = orderItems.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <div className="relative">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setSheetOpen(true)}>
                <ShoppingCart className="h-5 w-5" />
                <span className="sr-only">Abrir pedido</span>
            </Button>
            {itemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0">{orderItems.length}</Badge>
            )}
        </div>
    );
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSupportDialogOpen, setSupportDialogOpen] = React.useState(false);
  const { settings, isSettingsLoading } = useCompanySettings();
  const [globalSearchTerm, setGlobalSearchTerm] = React.useState('');

  const currentUser: User = { name: 'Gabriel T', role: 'Administrador', area: 'Administrador' };

  const handleNavigate = (path: string) => {
    router.push(path);
  };
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearchTerm.trim()) {
      router.push(`/dashboard/inventory?q=${encodeURIComponent(globalSearchTerm.trim())}`);
    } else {
      router.push('/dashboard/inventory');
    }
  };

  const badgeCount = 0; // This should be fetched from the server in a real scenario

  const allNavLinks = [
    { href: "/dashboard", label: "Inicio", icon: Home, active: pathname === "/dashboard", roles: ['Administrador', 'Usuario'] },
    { href: "/dashboard/inventory", label: "Inventario", icon: Package, active: pathname.startsWith("/dashboard/inventory"), roles: ['Administrador', 'Usuario'] },
    { href: "/dashboard/requests", label: "Solicitudes", icon: ShoppingCart, active: pathname.startsWith("/dashboard/requests"), badge: badgeCount, roles: ['Administrador', 'Usuario', 'Gerencia', 'Almacén', 'Logística'] },
    { href: "/dashboard/fuel", label: "Combustible", icon: Fuel, active: pathname.startsWith("/dashboard/fuel"), disabled: false, roles: ['Administrador', 'Usuario'] },
    { href: "/dashboard/security-reports", label: "Reportes de Seguridad", icon: ShieldCheck, active: pathname.startsWith("/dashboard/security-reports"), disabled: false, roles: ['Administrador', 'Usuario', 'Gerencia', 'Logística', 'RR.HH', 'Seguridad Patrimonial', 'Almacén', 'Taller', 'Producción', 'Sanidad', 'SS.GG'] },
    { href: "/dashboard/gallery", label: "Galería De Logros", icon: GalleryHorizontal, active: pathname.startsWith("/dashboard/gallery"), disabled: false, roles: ['Administrador', 'Usuario', 'Gerencia', 'Logística', 'RR.HH', 'Seguridad Patrimonial', 'Almacén', 'Taller', 'Producción', 'Sanidad', 'SS.GG'] },
    { href: "/dashboard/communications", label: "Comunicados", icon: Megaphone, active: pathname.startsWith("/dashboard/communications"), roles: ['Administrador', 'Gerencia'] },
    { href: "/dashboard/manage-users", label: "Gestionar Usuarios", icon: Users, active: pathname.startsWith("/dashboard/manage-users"), roles: ['Administrador'] },
    { href: "/dashboard/company-settings", label: "Personalización", icon: Paintbrush, active: pathname.startsWith("/dashboard/company-settings"), roles: ['Administrador'] },
  ];
  
  const navLinks = allNavLinks.filter(link => link.roles.includes(currentUser.role) || link.roles.includes(currentUser.area));

  return (
    <>
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/dashboard" className="flex items-center gap-3 font-semibold">
              {isSettingsLoading ? (
                  <Leaf className="h-9 w-9 text-primary" />
                ) : (
                  <Image src={settings.logoUrl || '/logo-placeholder.svg'} alt="Logo de la empresa" width={36} height={36} className="h-9 w-9 object-contain" />
                )}
              <span className="text-xl font-headline whitespace-nowrap">Agro Norte Corp</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.disabled ? "#" : link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    link.active && "bg-muted text-primary",
                    link.disabled && "cursor-not-allowed opacity-50"
                  )}
                  onClick={(e) => link.disabled && e.preventDefault()}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                  {link.badge !== undefined && link.badge > 0 && (
                     <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                       {link.badge}
                     </Badge>
                  )}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
                <SheetHeader>
                    <SheetTitle className="sr-only">Menu</SheetTitle>
                </SheetHeader>
              <nav className="grid gap-2 text-lg font-medium">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 text-lg font-semibold mb-4"
                >
                  {isSettingsLoading ? (
                    <Leaf className="h-9 w-9 text-primary" />
                  ) : (
                    <Image src={settings.logoUrl || '/logo-placeholder.svg'} alt="Logo de la empresa" width={36} height={36} className="h-9 w-9 object-contain" />
                  )}
                  <span className="text-xl font-headline whitespace-nowrap">Agro Norte Corp</span>
                </Link>
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.disabled ? "#" : link.href}
                    onClick={(e) => {
                      if (link.disabled) e.preventDefault();
                      // Ideally close sheet on navigate
                    }}
                    className={cn(
                      "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground",
                      link.active && "bg-muted text-foreground",
                      link.disabled && "cursor-not-allowed opacity-50"
                    )}
                  >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                    {link.badge !== undefined && link.badge > 0 && (
                      <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                        {link.badge}
                      </Badge>
                    )}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar productos y presionar Enter..."
                  className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
                  value={globalSearchTerm}
                  onChange={(e) => setGlobalSearchTerm(e.target.value)}
                />
              </div>
            </form>
          </div>
            <CartButton />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://placehold.co/100x100.png" alt="Gabriel T" data-ai-hint="person portrait"/>
                  <AvatarFallback>GT</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Mi Cuenta ({currentUser.role})</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleNavigate('/dashboard/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Ajustes</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSupportDialogOpen(true)}>
                <LifeBuoy className="mr-2 h-4 w-4" />
                <span>Soporte</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleNavigate("/")}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
    <OrderSheet />
    <SupportDialog isOpen={isSupportDialogOpen} onOpenChange={setSupportDialogOpen} />
    </>
  );
}


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="agronorte-ui-theme">
      <CompanySettingsProvider>
          <OrderProvider>
              <DashboardLayoutContent>{children}</DashboardLayoutContent>
          </OrderProvider>
      </CompanySettingsProvider>
    </ThemeProvider>
  )
}
