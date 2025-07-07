
import * as React from "react";

// The providers (Theme, CompanySettings) are now in the root layout (src/app/layout.tsx).
// This component can be simpler and just pass children through.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
