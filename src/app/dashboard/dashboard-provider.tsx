
import * as React from "react";
import { getCurrentUser } from "@/lib/db";
import { OrderProvider } from "@/context/order-context";
import { DashboardLayoutContent } from "./layout-client";

export default async function DashboardProvider({
  searchParams,
  children,
}: {
  searchParams: { userId?: string };
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser(searchParams.userId);

  if (!currentUser) {
    return <div>Usuario no encontrado o error de base de datos. Por favor, inicia sesión.</div>;
  }

  // We don't want to pass the password to the client component.
  const { password, ...clientUser } = currentUser;

  return (
    <OrderProvider currentUser={clientUser}>
      <DashboardLayoutContent currentUser={clientUser}>
        {children}
      </DashboardLayoutContent>
    </OrderProvider>
  );
}
